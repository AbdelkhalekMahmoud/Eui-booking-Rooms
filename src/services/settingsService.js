import { db } from "./firebase.js";
import { ref, get, set, update } from "firebase/database";

export const getSettings = async () => {
  try {
    const settingsRef = ref(db, "settings");
    const snapshot = await get(settingsRef);
    if (snapshot.exists()) {
      return snapshot.val();
    }
    return {};
  } catch (error) {
    console.error("Error fetching settings:", error);
    throw error;
  }
};

export const updateSettings = async (updates) => {
  try {
    const settingsRef = ref(db, "settings");
    await update(settingsRef, updates);
    return updates;
  } catch (error) {
    console.error("Error updating settings:", error);
    throw error;
  }
};

export const setSettings = async (settingsData) => {
  try {
    const settingsRef = ref(db, "settings");
    await set(settingsRef, settingsData);
    return settingsData;
  } catch (error) {
    console.error("Error setting settings:", error);
    throw error;
  }
};
