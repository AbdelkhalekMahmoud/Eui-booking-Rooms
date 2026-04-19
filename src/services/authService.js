import { auth } from "./firebase.js";
import { db } from "./firebase.js";
import { ref, set, get } from "firebase/database";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
  OAuthProvider,
} from "firebase/auth";

export const normalizeUserRole = (role) =>
  typeof role === "string" ? role.trim().toLowerCase() : "user";

export const saveUserToDatabase = async (user, role = "user") => {
  try {
    const userRef = ref(db, `users/${user.uid}`);
    const existingSnapshot = await get(userRef);
    const existingUser = existingSnapshot.exists() ? existingSnapshot.val() : null;
    const resolvedRole = normalizeUserRole(existingUser?.role || role);

    await set(userRef, {
      email: user.email,
      name: user.displayName || "",
      role: resolvedRole,
      createdAt: existingUser?.createdAt || new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error saving user to database:", error);
    throw error;
  }
};

export const getUserRole = async (userId) => {
  try {
    const userRef = ref(db, `users/${userId}`);
    const snapshot = await get(userRef);
    if (snapshot.exists()) {
      return normalizeUserRole(snapshot.val().role);
    }
    return "user";
  } catch (error) {
    console.error("Error fetching user role:", error);
    return "user";
  }
};

export const login = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password,
    );
    // Save/update user in database on login
    await saveUserToDatabase(userCredential.user);
    return userCredential.user;
  } catch (error) {
    console.error("Error logging in:", error);
    throw error;
  }
};

export const register = async (email, password, displayName) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    );
    await updateProfile(userCredential.user, { displayName });
    // Save new user to database with "user" role
    await saveUserToDatabase(userCredential.user, "user");
    return userCredential.user;
  } catch (error) {
    console.error("Error registering:", error);
    throw error;
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error logging out:", error);
    throw error;
  }
};

export const getCurrentUser = () => {
  return auth.currentUser;
};

export const onAuthStateChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

export const loginWithMicrosoft = async () => {
  try {
    const provider = new OAuthProvider("microsoft.com");

    // For institutional access, you can use either:
    // 1. "organizations" for multi-tenant apps (allows any Microsoft account)
    // 2. Specific tenant ID for single-tenant apps (only your organization's accounts)
    // 3. "consumers" for personal Microsoft accounts only

    const tenantId =
      import.meta.env.VITE_MICROSOFT_TENANT_ID || "organizations";

    provider.setCustomParameters({
      prompt: "consent",
      login_hint: "@eui.edu.eg",
      tenant: tenantId,
    });
    provider.addScope("email");
    provider.addScope("profile");

    const result = await signInWithPopup(auth, provider);
    // Save/update user in database on Microsoft login
    await saveUserToDatabase(result.user);
    return result.user;
  } catch (error) {
    console.error("Error logging in with Microsoft:", error);
    throw error;
  }
};
