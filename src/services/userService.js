import { db } from "./firebase.js";
import { ref, get, set, update, remove } from "firebase/database";
import { normalizeUserRole } from "./authService.js";

export const getUsers = async () => {
  try {
    const usersRef = ref(db, "users");
    const snapshot = await get(usersRef);
    if (snapshot.exists()) {
      const data = snapshot.val();
      return Object.keys(data).map((key) => ({
        id: key,
        ...data[key],
      }));
    }
    return [];
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
};

export const getUser = async (userId) => {
  try {
    const userRef = ref(db, `users/${userId}`);
    const snapshot = await get(userRef);
    if (snapshot.exists()) {
      return snapshot.val();
    }
    throw new Error("User not found");
  } catch (error) {
    console.error("Error fetching user:", error);
    throw error;
  }
};

export const createUser = async (userId, userData) => {
  try {
    const userRef = ref(db, `users/${userId}`);
    await set(userRef, userData);
    return userData;
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
};

export const updateUser = async (userId, updates) => {
  try {
    const userRef = ref(db, `users/${userId}`);
    await update(userRef, updates);
    return updates;
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
};

export const deleteUser = async (userId) => {
  try {
    const userRef = ref(db, `users/${userId}`);
    await remove(userRef);
    return true;
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
};

export const updateUserRole = async (userId, role) => {
  try {
    const userRef = ref(db, `users/${userId}`);
    const normalizedRole = normalizeUserRole(role);
    await update(userRef, { role: normalizedRole });
    return { userId, role: normalizedRole };
  } catch (error) {
    console.error("Error updating user role:", error);
    throw error;
  }
};

export const getAdminUsers = async () => {
  try {
    const users = await getUsers();
    return users.filter((user) => normalizeUserRole(user.role) === "admin");
  } catch (error) {
    console.error("Error fetching admin users:", error);
    throw error;
  }
};
