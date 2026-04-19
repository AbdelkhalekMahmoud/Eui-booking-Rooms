import nodemailer from "nodemailer";
import { initializeApp } from "firebase-admin/app";
import { getDatabase, ref, update } from "firebase-admin/database";
import * as functions from "firebase-functions";
import { onValueCreated, onValueUpdated } from "firebase-functions/v2/database";

initializeApp();
const db = getDatabase();
const { logger } = functions;

const getGmailConfig = () => functions.config().gmail || {};

let transporter = null;

const normalizeText = (value) =>
  String(value ?? "")
    .normalize("NFKC")
    .trim()
    .toLowerCase();

const isApproved = (value) => normalizeText(value) === "approved";
const isRejected = (value) => normalizeText(value) === "rejected";

const getSnapshotValue = (snapshot) => {
  if (!snapshot) return null;
  if (typeof snapshot.val === "function") {
    return snapshot.val();
  }
  return snapshot;
};

const getTransports = () => {
  if (transporter) return transporter;

  const { email: gmailEmail, password: gmailPassword } = getGmailConfig();

  if (!gmailEmail || !gmailPassword) {
    logger.error(
      "Unable to create Nodemailer transporter: missing Gmail credentials.",
    );
    return null;
  }

  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: gmailEmail,
      pass: gmailPassword,
    },
  });

  return transporter;
};

const buildEmailContent = (booking, status) => {
  const roomName = booking.roomName || booking.roomId || "the room";
  const requester = booking.userName || booking.email || "Staff Member";
  const bookingDate = booking.date || "your selected date";
  const startTime = booking.startTime || "N/A";
  const endTime = booking.endTime || "N/A";
  const bookingTimeLine = booking.spansNextDay
    ? `${startTime} - ${endTime} (next day)`
    : `${startTime} - ${endTime}`;
  const adminName =
    booking.approvedByName || booking.rejectedByName || "EUI Admin";
  const adminEmail = booking.approvedByEmail || booking.rejectedByEmail || "";
  const statusLabel = status === "approved" ? "Approved" : "Rejected";
  const actionMessage =
    status === "approved"
      ? "Your booking request has been approved successfully."
      : "Your booking request has been rejected.";
  const closeMessage =
    status === "approved"
      ? "Thank you for using EUI Room Booking."
      : "Please contact the administrator if you need help.";

  return {
    subject: `Booking Request ${statusLabel} - ${roomName}`,
    text: [
      `Hello ${requester},`,
      "",
      actionMessage,
      "",
      "Booking Details:",
      `Room: ${roomName}`,
      `Date: ${bookingDate}`,
      `Time: ${bookingTimeLine}`,
      `Status: ${statusLabel}`,
      `Handled by: ${adminName}${adminEmail ? ` (${adminEmail})` : ""}`,
      "",
      closeMessage,
      "",
      "Egypt University of Informatics",
    ].join("\n"),
    html: `
      <div style="margin:0;padding:24px;background:#f3f6fb;font-family:Arial,sans-serif;color:#0f172a;line-height:1.6;">
        <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #dbe5f1;box-shadow:0 12px 32px rgba(15,38,92,0.08);">
          <div style="padding:24px 28px;background:linear-gradient(135deg,#0f265c,#175fb8);color:#ffffff;">
            <p style="margin:0 0 6px;font-size:12px;letter-spacing:0.24em;text-transform:uppercase;opacity:0.8;">Egypt University of Informatics</p>
            <h2 style="margin:0;font-size:26px;font-weight:700;">Booking ${statusLabel}</h2>
          </div>
          <div style="padding:28px;">
            <p style="margin-top:0;">Hello ${requester},</p>
            <p>${actionMessage}</p>
            <div style="margin:20px 0;padding:18px;border-radius:14px;background:#f8fafc;border:1px solid #e2e8f0;">
              <p style="margin:0 0 10px;font-size:13px;letter-spacing:0.18em;text-transform:uppercase;color:#64748b;">Booking Details</p>
              <p style="margin:0 0 8px;"><strong>Room:</strong> ${roomName}</p>
              <p style="margin:0 0 8px;"><strong>Date:</strong> ${bookingDate}</p>
              <p style="margin:0 0 8px;"><strong>Time:</strong> ${bookingTimeLine}</p>
              <p style="margin:0 0 8px;"><strong>Status:</strong> ${statusLabel}</p>
              <p style="margin:0;"><strong>Handled by:</strong> ${adminName}${adminEmail ? ` (${adminEmail})` : ""}</p>
            </div>
            <p style="margin-bottom:0;">${closeMessage}<br /><strong>EUI Room Booking Team</strong><br />Egypt University of Informatics</p>
          </div>
        </div>
      </div>
    `,
  };
};

const markEmailSent = async (roomId, date, bookingId) => {
  const bookingRef = ref(db, `bookings/${roomId}/${date}/${bookingId}`);
  await update(bookingRef, { emailSent: true });
};

const shouldSendEmail = (beforeBooking, afterBooking) => {
  if (!afterBooking || Object.keys(afterBooking).length === 0) {
    return false;
  }

  if (afterBooking.emailSent) {
    return false;
  }

  const beforeStatus = normalizeText(beforeBooking?.status);
  const afterStatus = normalizeText(afterBooking.status);

  if (!isApproved(afterStatus) && !isRejected(afterStatus)) {
    return false;
  }

  return beforeStatus !== afterStatus;
};

const handleBookingEmailEvent = async (event, eventType) => {
  const bookingId = event.params?.bookingId;
  const roomId = event.params?.roomId;
  const date = event.params?.date;

  const previousSnapshot = event.data?.previous ?? event.data?.before;
  const currentSnapshot = event.data?.current ?? event.data?.after;

  const beforeBooking = getSnapshotValue(previousSnapshot) || {};
  const afterBooking = getSnapshotValue(currentSnapshot) || {};

  const beforeStatus = normalizeText(beforeBooking.status);
  const afterStatus = normalizeText(afterBooking.status);

  logger.info("Booking event received.", {
    bookingId,
    roomId,
    date,
    eventType,
    beforeStatus,
    afterStatus,
    emailSent: !!afterBooking.emailSent,
  });

  if (!afterBooking || Object.keys(afterBooking).length === 0) {
    logger.warn("Booking event contains no booking data.", {
      bookingId,
      roomId,
      date,
      eventType,
    });
    return;
  }

  if (!shouldSendEmail(beforeBooking, afterBooking)) {
    logger.info("Skipping email send for booking event.", {
      bookingId,
      roomId,
      date,
      eventType,
      beforeStatus,
      afterStatus,
      emailSent: !!afterBooking.emailSent,
    });
    return;
  }

  if (!afterBooking.email) {
    logger.warn("Booking has no recipient email.", {
      bookingId,
      roomId,
      date,
      eventType,
    });
    return;
  }

  const mailer = getTransports();
  if (!mailer) {
    logger.error("Unable to create Nodemailer transporter.", {
      bookingId,
      roomId,
      date,
      eventType,
    });
    return;
  }

  const statusType = isApproved(afterStatus) ? "approved" : "rejected";
  const emailContent = buildEmailContent(afterBooking, statusType);
  const { email: gmailEmail = "", password: gmailPassword = "" } =
    getGmailConfig();
  const approvingAdminEmail = (
    afterBooking.approvedByEmail ||
    afterBooking.rejectedByEmail ||
    ""
  ).trim();
  const fromAddress = gmailEmail;
  const fromName = `EUI Room Booking`;
  const replyToAddress = approvingAdminEmail || gmailEmail;

  logger.info("Sending booking status email.", {
    bookingId,
    roomId,
    date,
    eventType,
    statusType,
    to: afterBooking.email,
    replyTo: replyToAddress,
  });

  try {
    await mailer.sendMail({
      from: `"${fromName}" <${fromAddress}>`,
      to: afterBooking.email,
      replyTo: replyToAddress,
      subject: emailContent.subject,
      text: emailContent.text,
      html: emailContent.html,
    });

    await markEmailSent(roomId, date, bookingId);

    logger.info("Booking status email sent and emailSent updated.", {
      bookingId,
      roomId,
      date,
      eventType,
      statusType,
    });
  } catch (error) {
    logger.error("Failed to send booking status email.", {
      bookingId,
      roomId,
      date,
      eventType,
      statusType,
      error: error?.message || error,
    });
  }
};

export const sendBookingCreatedEmail = onValueCreated(
  {
    ref: "/bookings/{roomId}/{date}/{bookingId}",
    region: "us-central1",
  },
  async (event) => {
    await handleBookingEmailEvent(event, "onValueCreated");
  },
);

export const sendBookingUpdatedEmail = onValueUpdated(
  {
    ref: "/bookings/{roomId}/{date}/{bookingId}",
    region: "us-central1",
  },
  async (event) => {
    await handleBookingEmailEvent(event, "onValueUpdated");
  },
);
