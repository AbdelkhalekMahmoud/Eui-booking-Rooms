import { db } from "./firebase.js";
import { ref, get, set, update, remove } from "firebase/database";

export const getRoomDetails = async (roomId) => {
  try {
    const roomDetailsRef = ref(db, `roomDetails/${roomId}`);
    const snapshot = await get(roomDetailsRef);
    if (snapshot.exists()) {
      return snapshot.val();
    }
    throw new Error("Room not found");
  } catch (error) {
    console.error("Error fetching room details:", error);
    throw error;
  }
};

export const getAllRoomDetails = async () => {
  try {
    const roomsRef = ref(db, "roomDetails");
    const snapshot = await get(roomsRef);
    if (snapshot.exists()) {
      const data = snapshot.val();
      return Object.keys(data).map((key) => ({
        id: key,
        ...data[key],
      }));
    }
    return [];
  } catch (error) {
    console.error("Error fetching room details list:", error);
    throw error;
  }
};

export const getRooms = async () => {
  try {
    const roomsRef = ref(db, "rooms");
    const snapshot = await get(roomsRef);
    if (snapshot.exists()) {
      const data = snapshot.val();
      return Object.keys(data).map((key) => ({
        id: key,
        ...data[key],
      }));
    }
    return [];
  } catch (error) {
    console.error("Error fetching rooms:", error);
    throw error;
  }
};

export const getRoom = async (roomId) => {
  try {
    const roomRef = ref(db, `rooms/${roomId}`);
    const snapshot = await get(roomRef);
    if (snapshot.exists()) {
      return snapshot.val();
    }
    throw new Error("Room not found");
  } catch (error) {
    console.error("Error fetching room:", error);
    throw error;
  }
};

export const createRoom = async (roomId, roomData) => {
  try {
    const roomRef = ref(db, `rooms/${roomId}`);
    await set(roomRef, roomData);
    return roomData;
  } catch (error) {
    console.error("Error creating room:", error);
    throw error;
  }
};

export const updateRoom = async (roomId, updates) => {
  try {
    const roomRef = ref(db, `rooms/${roomId}`);
    await update(roomRef, updates);
    return updates;
  } catch (error) {
    console.error("Error updating room:", error);
    throw error;
  }
};

export const deleteRoom = async (roomId) => {
  try {
    const roomRef = ref(db, `rooms/${roomId}`);
    await remove(roomRef);
    return true;
  } catch (error) {
    console.error("Error deleting room:", error);
    throw error;
  }
};

export const createRoomDetails = async (roomId, roomDetailsData) => {
  try {
    const roomDetailsRef = ref(db, `roomDetails/${roomId}`);
    await set(roomDetailsRef, roomDetailsData);
    return roomDetailsData;
  } catch (error) {
    console.error("Error creating room details:", error);
    throw error;
  }
};

export const updateRoomDetails = async (roomId, updates) => {
  try {
    const roomDetailsRef = ref(db, `roomDetails/${roomId}`);
    await update(roomDetailsRef, updates);
    return updates;
  } catch (error) {
    console.error("Error updating room details:", error);
    throw error;
  }
};

export const deleteRoomDetails = async (roomId) => {
  try {
    const roomDetailsRef = ref(db, `roomDetails/${roomId}`);
    await remove(roomDetailsRef);
    return true;
  } catch (error) {
    console.error("Error deleting room details:", error);
    throw error;
  }
};
