import { db } from "./firebase.js";
import { ref, get, set, update, remove, push } from "firebase/database";

export const getBookings = async () => {
  try {
    const bookingsRef = ref(db, "bookings");
    const snapshot = await get(bookingsRef);
    if (snapshot.exists()) {
      return snapshot.val();
    }
    return {};
  } catch (error) {
    console.error("Error fetching bookings:", error);
    throw error;
  }
};

export const getBookingsForRoom = async (roomId) => {
  try {
    const bookingsRef = ref(db, `bookings/${roomId}`);
    const snapshot = await get(bookingsRef);
    if (snapshot.exists()) {
      return snapshot.val();
    }
    return {};
  } catch (error) {
    console.error("Error fetching bookings for room:", error);
    throw error;
  }
};

export const getBookingsForDate = async (roomId, date) => {
  try {
    const bookingsRef = ref(db, `bookings/${roomId}/${date}`);
    const snapshot = await get(bookingsRef);
    if (snapshot.exists()) {
      const data = snapshot.val();
      return Object.keys(data).map((key) => ({
        id: key,
        ...data[key],
      }));
    }
    return [];
  } catch (error) {
    console.error("Error fetching bookings for date:", error);
    throw error;
  }
};

export const createBooking = async (roomId, date, bookingData) => {
  try {
    const bookingsRef = ref(db, `bookings/${roomId}/${date}`);
    const newBookingRef = push(bookingsRef);
    await set(newBookingRef, bookingData);
    return { id: newBookingRef.key, ...bookingData };
  } catch (error) {
    console.error("Error creating booking:", error);
    throw error;
  }
};

export const updateBooking = async (roomId, date, bookingId, updates) => {
  try {
    const bookingRef = ref(db, `bookings/${roomId}/${date}/${bookingId}`);
    await update(bookingRef, updates);
    return updates;
  } catch (error) {
    console.error("Error updating booking:", error);
    throw error;
  }
};

export const deleteBooking = async (roomId, date, bookingId) => {
  try {
    const bookingRef = ref(db, `bookings/${roomId}/${date}/${bookingId}`);
    await remove(bookingRef);
    return true;
  } catch (error) {
    console.error("Error deleting booking:", error);
    throw error;
  }
};

export const getUserBookings = async (userId) => {
  try {
    const bookings = await getBookings();
    const userBookings = [];

    Object.keys(bookings).forEach((roomId) => {
      Object.keys(bookings[roomId]).forEach((date) => {
        Object.keys(bookings[roomId][date]).forEach((bookingId) => {
          const booking = bookings[roomId][date][bookingId];
          if (booking.userId === userId) {
            userBookings.push({
              id: bookingId,
              roomId,
              date,
              ...booking,
            });
          }
        });
      });
    });

    return userBookings;
  } catch (error) {
    console.error("Error fetching user bookings:", error);
    throw error;
  }
};
