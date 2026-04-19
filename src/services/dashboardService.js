import { db } from "./firebase.js";
import { ref, get } from "firebase/database";

const readSnapshotValue = (snapshot) => (snapshot.exists() ? snapshot.val() : {});

export const getDashboardStats = async () => {
  try {
    const [
      roomsSnapshot,
      roomDetailsSnapshot,
      bookingsSnapshot,
      usersSnapshot,
      requestsSnapshot,
    ] = await Promise.all([
      get(ref(db, "rooms")),
      get(ref(db, "roomDetails")),
      get(ref(db, "bookings")),
      get(ref(db, "users")),
      get(ref(db, "requests")),
    ]);

    const roomsData = readSnapshotValue(roomsSnapshot);
    const roomDetailsData = readSnapshotValue(roomDetailsSnapshot);
    const requestsData = readSnapshotValue(requestsSnapshot);
    const rooms = new Set([
      ...Object.keys(roomsData),
      ...Object.keys(roomDetailsData),
    ]).size;
    const users = usersSnapshot.exists()
      ? Object.keys(usersSnapshot.val()).length
      : 0;

    let totalBookings = 0;
    let pendingRequests = 0;

    if (bookingsSnapshot.exists()) {
      const bookingsData = bookingsSnapshot.val();
      Object.keys(bookingsData).forEach((roomId) => {
        Object.keys(bookingsData[roomId]).forEach((date) => {
          totalBookings += Object.keys(bookingsData[roomId][date]).length;
        });
      });
    }

    pendingRequests = Object.values(requestsData).filter(
      (request) => (request.status || "pending") === "pending",
    ).length;

    return {
      totalRooms: rooms,
      totalUsers: users,
      totalBookings,
      pendingRequests,
    };
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    throw error;
  }
};

export const getRecentBookings = async (limit = 10) => {
  try {
    const [bookingsSnapshot, roomsSnapshot, roomDetailsSnapshot] =
      await Promise.all([
        get(ref(db, "bookings")),
        get(ref(db, "rooms")),
        get(ref(db, "roomDetails")),
      ]);

    if (!bookingsSnapshot.exists()) return [];

    const bookings = [];
    const bookingsData = bookingsSnapshot.val();
    const roomsData = readSnapshotValue(roomsSnapshot);
    const roomDetailsData = readSnapshotValue(roomDetailsSnapshot);

    Object.keys(bookingsData).forEach((roomId) => {
      Object.keys(bookingsData[roomId]).forEach((date) => {
        Object.keys(bookingsData[roomId][date]).forEach((bookingId) => {
          const booking = bookingsData[roomId][date][bookingId];
          bookings.push({
            id: bookingId,
            roomId,
            roomName:
              booking.roomName ||
              roomDetailsData[roomId]?.name ||
              roomsData[roomId]?.name ||
              roomId,
            date,
            ...booking,
          });
        });
      });
    });

    // Sort by createdAt descending
    bookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return bookings.slice(0, limit);
  } catch (error) {
    console.error("Error fetching recent bookings:", error);
    throw error;
  }
};

export const getRoomUtilization = async () => {
  try {
    const [roomsSnapshot, roomDetailsSnapshot, bookingsSnapshot] = await Promise.all([
      get(ref(db, "rooms")),
      get(ref(db, "roomDetails")),
      get(ref(db, "bookings")),
    ]);

    const rooms = readSnapshotValue(roomsSnapshot);
    const roomDetails = readSnapshotValue(roomDetailsSnapshot);
    const utilization = [];
    const roomIds = new Set([...Object.keys(rooms), ...Object.keys(roomDetails)]);

    roomIds.forEach((roomId) => {
      const room = rooms[roomId] || roomDetails[roomId] || {};
      let bookingCount = 0;

      if (bookingsSnapshot.exists() && bookingsSnapshot.val()[roomId]) {
        const roomBookings = bookingsSnapshot.val()[roomId];
        Object.keys(roomBookings).forEach((date) => {
          bookingCount += Object.keys(roomBookings[date]).length;
        });
      }

      utilization.push({
        roomId,
        name: room.name || roomId,
        totalBookings: bookingCount,
        status: room.status,
      });
    });

    return utilization;
  } catch (error) {
    console.error("Error fetching room utilization:", error);
    throw error;
  }
};
