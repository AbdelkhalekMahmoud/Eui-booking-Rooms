import { db } from "./firebase.js";
import { ref, get, set, update, remove, push } from "firebase/database";
import { createBooking } from "./bookingService.js";
import {
  createNotification,
  createNotifications,
  getAdmins,
} from "./notificationService.js";

export const getRequests = async () => {
  try {
    const requestsRef = ref(db, "requests");
    const snapshot = await get(requestsRef);
    if (snapshot.exists()) {
      const data = snapshot.val();
      return Object.keys(data).map((key) => ({
        id: key,
        ...data[key],
      }));
    }
    return [];
  } catch (error) {
    console.error("Error fetching requests:", error);
    throw error;
  }
};

export const getRequestsForRoomDate = async (roomId, date) => {
  try {
    const requests = await getRequests();
    return requests.filter(
      (request) =>
        request.roomId === roomId &&
        request.date === date &&
        request.status !== "rejected",
    );
  } catch (error) {
    console.error("Error fetching requests for room and date:", error);
    throw error;
  }
};

export const getRequest = async (requestId) => {
  try {
    const requestRef = ref(db, `requests/${requestId}`);
    const snapshot = await get(requestRef);
    if (snapshot.exists()) {
      return snapshot.val();
    }
    throw new Error("Request not found");
  } catch (error) {
    console.error("Error fetching request:", error);
    throw error;
  }
};

export const createRequest = async (requestData) => {
  try {
    const requestsRef = ref(db, "requests");
    const newRequestRef = push(requestsRef);
    const requestWithTimestamp = {
      ...requestData,
      createdAt: new Date().toISOString(),
    };
    await set(newRequestRef, requestWithTimestamp);

    const admins = await getAdmins();
    await createNotifications(
      admins.map((admin) => ({
        userId: admin.id,
        title: "New booking request",
        message: `${requestWithTimestamp.userName || requestWithTimestamp.email || "A user"} requested ${requestWithTimestamp.roomName || requestWithTimestamp.roomId} on ${requestWithTimestamp.date} from ${requestWithTimestamp.startTime} to ${requestWithTimestamp.endTime}.`,
        type: "request",
        metadata: {
          requestId: newRequestRef.key,
          roomId: requestWithTimestamp.roomId,
          date: requestWithTimestamp.date,
        },
      })),
    );

    return { id: newRequestRef.key, ...requestWithTimestamp };
  } catch (error) {
    console.error("Error creating request:", error);
    throw error;
  }
};

export const updateRequest = async (requestId, updates) => {
  try {
    const requestRef = ref(db, `requests/${requestId}`);
    await update(requestRef, updates);
    return updates;
  } catch (error) {
    console.error("Error updating request:", error);
    throw error;
  }
};

export const deleteRequest = async (requestId) => {
  try {
    const requestRef = ref(db, `requests/${requestId}`);
    await remove(requestRef);
    return true;
  } catch (error) {
    console.error("Error deleting request:", error);
    throw error;
  }
};

export const approveRequest = async (requestId, approvedBy = null) => {
  try {
    const request = await getRequest(requestId);
    if (!request) throw new Error("Request not found");

    // Move to bookings
    const approvedBooking = {
      ...request,
      status: "approved",
      approvedAt: new Date().toISOString(),
      approvedByName: approvedBy?.name || approvedBy?.email || "Admin",
      approvedByEmail: approvedBy?.email || "",
    };
    await createBooking(request.roomId, request.date, approvedBooking);

    if (request.userId) {
      await createNotification({
        userId: request.userId,
        title: "Booking approved",
        message: `Your request for ${request.roomName || request.roomId} on ${request.date} from ${request.startTime} to ${request.endTime} has been approved.`,
        type: "approved",
        metadata: {
          requestId,
          roomId: request.roomId,
          date: request.date,
        },
      });
    }

    // Delete from requests
    await deleteRequest(requestId);

    return true;
  } catch (error) {
    console.error("Error approving request:", error);
    throw error;
  }
};

export const getUserRequests = async (userId) => {
  try {
    const requests = await getRequests();
    return requests
      .filter((request) => request.userId === userId)
      .map((request) => ({
        ...request,
        source: "request",
      }));
  } catch (error) {
    console.error("Error fetching user requests:", error);
    throw error;
  }
};

export const rejectRequest = async (
  requestId,
  rejectionReason,
  rejectedBy = null,
) => {
  try {
    const request = await getRequest(requestId);
    if (!request) throw new Error("Request not found");

    const trimmedReason = String(rejectionReason || "").trim();
    if (!trimmedReason) {
      throw new Error("Rejection reason is required");
    }

    await updateRequest(requestId, {
      status: "rejected",
      rejectionReason: trimmedReason,
      rejectedAt: new Date().toISOString(),
      rejectedByName: rejectedBy?.name || rejectedBy?.email || "Admin",
      rejectedByEmail: rejectedBy?.email || "",
    });

    if (request.userId) {
      await createNotification({
        userId: request.userId,
        title: "Booking rejected",
        message: `Your request for ${request.roomName || request.roomId} on ${request.date} was rejected. Reason: ${trimmedReason}`,
        type: "rejected",
        metadata: {
          requestId,
          roomId: request.roomId,
          date: request.date,
        },
      });
    }

    return true;
  } catch (error) {
    console.error("Error rejecting request:", error);
    throw error;
  }
};
