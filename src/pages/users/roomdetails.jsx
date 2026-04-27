import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getRoomDetails, getAllRoomDetails } from "../../services/roomService";
import {
  createRequest,
  getRequestsForRoomDate,
} from "../../services/requestService";
import { getBookingsForDate } from "../../services/bookingService";
import { getCurrentUser } from "../../services/authService";

// Icon components (simple SVG replacements)
const ChevronLeft = () => (
  <svg
    className="w-6 h-6"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 19l-7-7 7-7"
    />
  </svg>
);

const ChevronRight = () => (
  <svg
    className="w-6 h-6"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 5l7 7-7 7"
    />
  </svg>
);

const AlertCircle = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

// Feature Icon Component
const FeatureIcon = ({ type }) => {
  const icons = {
    Users: "👥",
    Wifi: "📡",
    Projector: "🎬",
    Wind: "❄️",
    Capacity: "🧑‍🤝‍🧑",
    Location: "📍",
  };
  return <span className="text-3xl">{icons[type] || "•"}</span>;
};

const normalizeRoom = (rawRoom, roomId) => {
  const facilities = rawRoom.facilities;
  const features = Array.isArray(facilities)
    ? facilities.map((label) => ({
        icon: label.includes("TV")
          ? "📺"
          : label.includes("Whiteboard")
            ? "🧾"
            : label.includes("Projector")
              ? "🎬"
              : label.includes("WiFi")
                ? "📡"
                : label.includes("Air")
                  ? "❄️"
                  : "•",
        label,
        value: "Included",
      }))
    : facilities && typeof facilities === "object"
      ? Object.keys(facilities).map((key) => ({
          icon: key,
          label: key,
          value: facilities[key] || "Yes",
        }))
      : [];

  const timeSlots =
    rawRoom.timeSlots ||
    (rawRoom.availableHours && typeof rawRoom.availableHours === "object"
      ? [
          {
            time: `${rawRoom.availableHours.start || ""} - ${rawRoom.availableHours.end || ""}`.trim(),
            status:
              String(rawRoom.status || "")
                .trim()
                .toLowerCase() === "available"
                ? "available"
                : rawRoom.status || "available",
          },
        ]
      : []);

  const normalizedLocation =
    rawRoom.location && typeof rawRoom.location === "object"
      ? [
          rawRoom.location.building,
          rawRoom.location.floor ? `Floor ${rawRoom.location.floor}` : null,
        ]
          .filter(Boolean)
          .join(" • ")
      : rawRoom.location || "";

  return {
    id: rawRoom.id || roomId,
    ...rawRoom,
    name: rawRoom.name || normalizedLocation || rawRoom.id,
    building: rawRoom.building || normalizedLocation || "Unknown location",
    features,
    timeSlots,
    images: rawRoom.images || [],
  };
};

export default function RoomDetails() {
  const navigate = useNavigate();
  const { id: roomId } = useParams();
  const formatDateInputValue = (date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  const todayDate = formatDateInputValue(new Date());
  const [selectedDate, setSelectedDate] = useState(() =>
    formatDateInputValue(new Date()),
  );
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [room, setRoom] = useState(null);
  const [relatedSpaces, setRelatedSpaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bookingMessage, setBookingMessage] = useState("");
  const [bookingError, setBookingError] = useState("");
  const [existingBookings, setExistingBookings] = useState([]);
  const [nextDayBookings, setNextDayBookings] = useState([]);

  const timeToMinutes = (timeValue) => {
    if (!timeValue || !timeValue.includes(":")) return null;
    const [hours, minutes] = timeValue.split(":").map(Number);
    return hours * 60 + minutes;
  };

  const addDays = (dateString, offsetDays) => {
    const date = new Date(`${dateString}T00:00:00`);
    date.setDate(date.getDate() + offsetDays);
    return formatDateInputValue(date);
  };

  const spansNextDay = (entry) => {
    if (typeof entry?.spansNextDay === "boolean") {
      return entry.spansNextDay;
    }

    const startMinutes = timeToMinutes(entry?.startTime);
    const endMinutes = timeToMinutes(entry?.endTime);

    return (
      startMinutes !== null && endMinutes !== null && endMinutes <= startMinutes
    );
  };

  const getDurationMinutes = (startValue, endValue) => {
    const startMinutes = timeToMinutes(startValue);
    const endMinutes = timeToMinutes(endValue);

    if (
      startMinutes === null ||
      endMinutes === null ||
      startMinutes === endMinutes
    ) {
      return null;
    }

    return endMinutes > startMinutes
      ? endMinutes - startMinutes
      : 24 * 60 - startMinutes + endMinutes;
  };

  const normalizeEntriesForDay = (entries, storageDate, targetDate) =>
    entries
      .map((entry) => {
        const startMinutes = timeToMinutes(entry.startTime);
        const endMinutes = timeToMinutes(entry.endTime);
        const continuesToNextDay = spansNextDay(entry);

        if (startMinutes === null || endMinutes === null) {
          return null;
        }

        if (storageDate === targetDate) {
          return {
            ...entry,
            bookingDate: storageDate,
            startMinutes,
            endMinutes: continuesToNextDay ? 24 * 60 : endMinutes,
          };
        }

        if (continuesToNextDay && addDays(storageDate, 1) === targetDate) {
          return {
            ...entry,
            bookingDate: storageDate,
            startMinutes: 0,
            endMinutes,
          };
        }

        return null;
      })
      .filter(Boolean)
      .sort((first, second) => first.startMinutes - second.startMinutes);

  const formatTimeDisplay = (timeValue) => {
    if (!timeValue || !timeValue.includes(":")) return "N/A";
    const [hours, minutes] = timeValue.split(":").map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const formatMinutesDisplay = (minutesValue) => {
    if (typeof minutesValue !== "number") return "N/A";

    if (minutesValue === 24 * 60) {
      return "12:00 AM";
    }

    const hours = Math.floor(minutesValue / 60);
    const minutes = minutesValue % 60;

    return formatTimeDisplay(
      `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`,
    );
  };

  const calculateDurationHours = () => {
    const durationMinutes = getDurationMinutes(startTime, endTime);
    if (durationMinutes === null) {
      return "0.0";
    }

    return (durationMinutes / 60).toFixed(1);
  };

  const formatDateDisplay = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const getWeekday = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { weekday: "long" }).toUpperCase();
  };

  const updateDate = (offsetDays) => {
    setSelectedDate(addDays(selectedDate, offsetDays));
  };

  useEffect(() => {
    const fetchRoomDetails = async () => {
      try {
        setLoading(true);
        const data = await getRoomDetails(roomId);
        const normalizedRoom = normalizeRoom(data, roomId);
        setRoom(normalizedRoom);

        const allRooms = await getAllRoomDetails();
        const related = allRooms
          .filter((roomItem) => roomItem.id !== roomId)
          .slice(0, 3)
          .map((roomItem) => {
            const roomLocation =
              roomItem.location && typeof roomItem.location === "object"
                ? [
                    roomItem.location.building,
                    roomItem.location.floor
                      ? `Floor ${roomItem.location.floor}`
                      : null,
                  ]
                    .filter(Boolean)
                    .join(" • ")
                : roomItem.location || roomItem.building || "";

            return {
              id: roomItem.id,
              name: roomItem.name || roomItem.id,
              location: roomLocation,
              image: roomItem.images?.[0] || roomItem.image || "",
            };
          });
        setRelatedSpaces(related);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (roomId) {
      fetchRoomDetails();
    }
  }, [roomId]);

  const loadExistingBookings = async (date) => {
    try {
      const previousDate = addDays(date, -1);
      const nextDate = addDays(date, 1);

      const [
        previousDayBookings,
        previousDayRequests,
        currentDayBookings,
        currentDayRequests,
        nextDayBookingsData,
        nextDayRequests,
      ] = await Promise.all([
        getBookingsForDate(roomId, previousDate),
        getRequestsForRoomDate(roomId, previousDate),
        getBookingsForDate(roomId, date),
        getRequestsForRoomDate(roomId, date),
        getBookingsForDate(roomId, nextDate),
        getRequestsForRoomDate(roomId, nextDate),
      ]);

      const mapEntries = (entries, fallbackStatus) =>
        entries.map((entry) => ({
          ...entry,
          source:
            entry.source ||
            (fallbackStatus === "pending" ? "request" : "booking"),
          status: entry.status || fallbackStatus,
        }));

      const previousDayEntries = [
        ...mapEntries(previousDayBookings, "approved"),
        ...mapEntries(previousDayRequests, "pending"),
      ];
      const currentDayEntries = [
        ...mapEntries(currentDayBookings, "approved"),
        ...mapEntries(currentDayRequests, "pending"),
      ];
      const upcomingDayEntries = [
        ...mapEntries(nextDayBookingsData, "approved"),
        ...mapEntries(nextDayRequests, "pending"),
      ];

      setExistingBookings([
        ...normalizeEntriesForDay(previousDayEntries, previousDate, date),
        ...normalizeEntriesForDay(currentDayEntries, date, date),
      ]);

      setNextDayBookings([
        ...normalizeEntriesForDay(currentDayEntries, date, nextDate),
        ...normalizeEntriesForDay(upcomingDayEntries, nextDate, nextDate),
      ]);
    } catch (err) {
      console.error("Error loading existing bookings:", err);
      setExistingBookings([]);
      setNextDayBookings([]);
    }
  };

  useEffect(() => {
    if (!roomId || !selectedDate) return;
    loadExistingBookings(selectedDate);
  }, [roomId, selectedDate]);

  const isTimeRangeValid = () =>
    getDurationMinutes(startTime, endTime) !== null;

  const isRangeAvailable = () => {
    if (!isTimeRangeValid()) return false;

    const selectedStart = timeToMinutes(startTime);
    const selectedEnd = timeToMinutes(endTime);
    const crossesMidnight =
      selectedStart !== null && selectedEnd !== null
        ? selectedEnd <= selectedStart
        : false;

    const overlaps = (candidateStart, candidateEnd, bookings) =>
      bookings.some((booking) => {
        if (booking.startMinutes === null || booking.endMinutes === null) {
          return false;
        }

        return (
          candidateStart < booking.endMinutes &&
          candidateEnd > booking.startMinutes
        );
      });

    if (
      overlaps(
        selectedStart,
        crossesMidnight ? 24 * 60 : selectedEnd,
        existingBookings,
      )
    ) {
      return false;
    }

    if (!crossesMidnight) {
      return true;
    }

    return !overlaps(0, selectedEnd, nextDayBookings);
  };

  const handleConfirmBooking = async () => {
    setBookingMessage("");
    setBookingError("");

    const currentUser = getCurrentUser();
    if (!currentUser) {
      setBookingError("Please log in before booking a room.");
      return;
    }

    if (!isTimeRangeValid()) {
      setBookingError("Please choose a valid start and end time.");
      return;
    }

    if (!isRangeAvailable()) {
      setBookingError("This time range overlaps an existing booking.");
      return;
    }

    const bookingData = {
      roomId,
      roomName: room.name,
      userId: currentUser.uid,
      userName: currentUser.displayName || currentUser.email,
      email: currentUser.email,
      date: selectedDate,
      endDate: spansNextDay({ startTime, endTime })
        ? addDays(selectedDate, 1)
        : selectedDate,
      startTime,
      endTime,
      spansNextDay: spansNextDay({ startTime, endTime }),
      durationHours: calculateDurationHours(),
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    try {
      await createRequest(bookingData);
      sessionStorage.setItem(
        "bookingFlashMessage",
        `Your booking request for ${room.name} on ${selectedDate} from ${startTime} to ${endTime} was sent successfully.`,
      );
      setBookingMessage(
        "Booking request sent to admin. The slot is blocked until approval.",
      );
      await loadExistingBookings(selectedDate);
      setStartTime("");
      setEndTime("");
    } catch (err) {
      console.error(err);
      setBookingError(
        err.message || "Unable to submit request. Please try again.",
      );
    }
  };

  const currentImageUrl =
    room?.images?.[currentImageIndex] ||
    room?.images?.[0] ||
    "https://via.placeholder.com/800x600?text=Room+image";

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading room details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
          <p className="mt-4 text-red-600">
            Error loading room details: {error}
          </p>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600">Room not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-10">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sky-600 hover:text-sky-700 font-medium"
          >
            <ChevronLeft />
            Back to Rooms
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Gallery */}
            <div className="space-y-4">
              <div className="relative h-96 overflow-hidden rounded-3xl bg-slate-900">
                <img
                  src={currentImageUrl}
                  alt="Room"
                  className="h-full w-full object-cover"
                />
                <button
                  onClick={() =>
                    setCurrentImageIndex((prev) =>
                      prev === 0 ? room.images.length - 1 : prev - 1,
                    )
                  }
                  className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/80 hover:bg-white p-2 transition"
                >
                  <ChevronLeft />
                </button>
                <button
                  onClick={() =>
                    setCurrentImageIndex((prev) =>
                      prev === room.images.length - 1 ? 0 : prev + 1,
                    )
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/80 hover:bg-white p-2 transition"
                >
                  <ChevronRight />
                </button>
                <div className="absolute bottom-4 right-4 rounded-full bg-slate-900/80 px-4 py-2 text-sm font-semibold text-white">
                  +52 Photos
                </div>
              </div>

              {/* Thumbnail Gallery */}
              <div className="flex gap-3">
                {room.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`h-20 w-32 rounded-2xl overflow-hidden transition ${
                      idx === currentImageIndex
                        ? "ring-2 ring-sky-600"
                        : "opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={img}
                      alt={`Gallery ${idx}`}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Room Info */}
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
                      {room.building}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                      <span className="h-2 w-2 rounded-full bg-emerald-600" />
                      Live Availability
                    </span>
                  </div>
                  <h1 className="text-4xl font-bold text-slate-900">
                    {room.name}
                  </h1>
                </div>
              </div>

              {/* Room Features Grid */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {room.features.map((feature, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl border border-slate-200 bg-white p-4 text-center"
                  >
                    <div className="flex justify-center mb-2">
                      <FeatureIcon type={feature.icon} />
                    </div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                      {feature.label}
                    </p>
                    <p className="mt-2 font-semibold text-slate-900">
                      {feature.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Capacity */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-500">
                Capacity
              </h3>
              <p className="mt-2 text-5xl font-bold text-slate-900">
                {room.capacity}{" "}
                <span className="text-lg text-slate-500">Staff</span>
              </p>
            </div>

            {/* Laboratory Overview */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900">
                Laboratory Overview
              </h2>
              <p className="leading-relaxed text-slate-600">
                {room.description}
              </p>
            </div>
          </div>

          {/* Sidebar - Booking */}
          <div className="space-y-6">
            {/* Reserve Space Card */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">
              <h3 className="mb-4 border-b border-sky-600 pb-3 text-lg font-bold text-slate-900">
                Reserve Space
              </h3>

              {/* Date Selection */}
              <div className="mb-6">
                <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-slate-500">
                  Select Date
                </p>
                <div className="space-y-3 rounded-2xl bg-slate-50 px-4 py-4">
                  <label className="block">
                    <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                      Choose from calendar
                    </span>
                    <input
                      type="date"
                      min={todayDate}
                      value={selectedDate}
                      onChange={(event) => setSelectedDate(event.target.value)}
                      className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                    />
                  </label>
                  <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-3 py-3">
                    <button
                      type="button"
                      onClick={() => updateDate(-1)}
                      disabled={selectedDate <= todayDate}
                      className={`rounded-full p-2 transition ${
                        selectedDate <= todayDate
                          ? "cursor-not-allowed text-slate-300"
                          : "text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <ChevronLeft />
                    </button>
                    <span className="text-center">
                      <p className="font-semibold text-slate-900">
                        {formatDateDisplay(selectedDate)}
                      </p>
                      <p className="text-xs text-slate-500">
                        {getWeekday(selectedDate)}
                      </p>
                    </span>
                    <button
                      type="button"
                      onClick={() => updateDate(1)}
                      className="rounded-full p-2 text-slate-600 transition hover:bg-slate-100"
                    >
                      <ChevronRight />
                    </button>
                  </div>
                </div>
              </div>

              {/* Booking Time Range */}
              <div className="mb-6">
                <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-slate-500">
                  Booking Time
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                      From
                    </span>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(event) => setStartTime(event.target.value)}
                      className="w-full rounded-3xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                      To
                    </span>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(event) => setEndTime(event.target.value)}
                      className="w-full rounded-3xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                    />
                  </label>
                </div>
                <div className="mt-4 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold uppercase tracking-widest text-slate-500">
                    Blocked slots on {formatDateDisplay(selectedDate)}
                  </p>
                  {existingBookings.length === 0 ? (
                    <p className="mt-3 text-sm text-slate-600">
                      No existing bookings on this date.
                    </p>
                  ) : (
                    <div className="mt-3 space-y-2 text-sm text-slate-700">
                      {existingBookings.map((booking) => (
                        <div
                          key={`${booking.source || "booking"}-${booking.id}`}
                          className="rounded-2xl border border-slate-200 bg-white p-3"
                        >
                          <p className="font-semibold">
                            {formatMinutesDisplay(booking.startMinutes)} -{" "}
                            {formatMinutesDisplay(booking.endMinutes)}
                          </p>
                          <p className="text-xs text-slate-500">
                            {booking.status.toUpperCase()} •{" "}
                            {booking.userName || booking.email || "Reserved"}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Session Details */}
              <div className="mb-6 space-y-3 border-t border-slate-200 pt-4">
                <div className="flex justify-between text-sm">
                  <p className="text-slate-600">Session Duration</p>
                  <p className="font-semibold text-slate-900">
                    {calculateDurationHours()} Hours
                  </p>
                </div>
                <div className="flex justify-between text-sm">
                  <p className="text-slate-600">Booking Type</p>
                  <p className="font-semibold text-slate-900">Staff Research</p>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-3 text-base">
                  <p className="font-semibold text-slate-900">Total Credits</p>
                  <p className="font-bold text-sky-600">0.00</p>
                </div>
              </div>

              {/* Confirm Button */}
              <button
                disabled={!isRangeAvailable()}
                onClick={handleConfirmBooking}
                className={`w-full rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-lg transition ${isRangeAvailable() ? "bg-sky-600 hover:bg-sky-700" : "bg-slate-300 cursor-not-allowed"}`}
              >
                Confirm Booking 📑
              </button>

              {bookingError && (
                <div className="mt-4 rounded-2xl bg-rose-50 border border-rose-200 p-4 text-sm text-rose-700">
                  {bookingError}
                </div>
              )}
              {bookingMessage && (
                <div className="mt-4 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-700">
                  {bookingMessage}
                </div>
              )}

              {/* Room Access Policy */}
              <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-4">
                <div className="flex gap-3">
                  <div className="h-5 w-5 shrink-0 text-blue-600 mt-0.5">
                    <AlertCircle />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-blue-900">
                      Room Access Policy
                    </p>
                    <p className="mt-1 text-xs text-blue-800">
                      Make sure you book your EUI booking by 8-hour notice.
                      Cancellation must be made 2 hours prior to the end.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Labs & Spaces */}
        <div className="mt-12 space-y-6">
          <h2 className="text-2xl font-bold text-slate-900">
            Related Labs & Spaces
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {relatedSpaces.map((space, idx) => (
              <div
                key={idx}
                className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm hover:shadow-lg transition"
              >
                <div className="relative h-48 overflow-hidden bg-slate-200">
                  <img
                    src={space.image}
                    alt={space.name}
                    className="h-full w-full object-cover group-hover:scale-105 transition duration-300"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-bold text-slate-900">
                    {space.name}
                  </h3>
                  <p className="mt-2 text-sm text-slate-600">
                    {space.location}
                  </p>
                  <button className="mt-4 text-sm font-semibold text-sky-600 hover:text-sky-700 transition">
                    View Details →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-16 border-t border-slate-200 bg-slate-900 text-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-10">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="font-semibold">EUI Staff Portal</p>
              <p className="mt-1 text-sm text-slate-400">
                Egypt University of Informatics • Knowledge City
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-300">
                Usage Guidelines
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-300">
                Technical Support
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-300">
                Privacy Policy
              </p>
            </div>
          </div>
          <div className="mt-8 border-t border-slate-800 pt-8 text-center text-sm text-slate-400">
            © 2024 Egypt University of Informatics. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
}
