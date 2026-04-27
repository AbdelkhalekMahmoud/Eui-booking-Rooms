import { db } from "./firebase.js";
import {
  get,
  onValue,
  orderByChild,
  push,
  query,
  ref,
  set,
  update,
} from "firebase/database";

const notificationsRef = ref(db, "notifications");

export const createNotification = async ({
  userId,
  title,
  message,
  type = "info",
  metadata = {},
}) => {
  if (!userId) {
    throw new Error("Notification userId is required");
  }

  const newNotificationRef = push(notificationsRef);
  const notification = {
    userId,
    title: String(title || "").trim(),
    message: String(message || "").trim(),
    type,
    metadata,
    read: false,
    createdAt: new Date().toISOString(),
  };

  await set(newNotificationRef, notification);
  return { id: newNotificationRef.key, ...notification };
};

export const createNotifications = async (notifications = []) => {
  const validNotifications = notifications.filter((notification) => notification?.userId);
  await Promise.all(validNotifications.map(createNotification));
};

export const getAdmins = async () => {
  const usersSnapshot = await get(ref(db, "users"));
  if (!usersSnapshot.exists()) {
    return [];
  }

  const users = usersSnapshot.val();
  return Object.entries(users)
    .filter(([, user]) => String(user?.role || "").trim().toLowerCase() === "admin")
    .map(([id, user]) => ({
      id,
      ...user,
    }));
};

export const subscribeToUserNotifications = (userId, callback) => {
  if (!userId) {
    callback([]);
    return () => {};
  }

  const userNotificationsQuery = query(
    notificationsRef,
    orderByChild("userId"),
  );

  return onValue(userNotificationsQuery, (snapshot) => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }

    const data = snapshot.val();
    const notifications = Object.keys(data)
      .map((key) => ({
        id: key,
        ...data[key],
      }))
      .filter((notification) => notification.userId === userId)
      .sort(
        (first, second) =>
          new Date(second.createdAt || 0) - new Date(first.createdAt || 0),
      );

    callback(notifications);
  });
};

export const markNotificationAsRead = async (notificationId) => {
  await update(ref(db, `notifications/${notificationId}`), { read: true });
};

export const markAllNotificationsAsRead = async (notifications = []) => {
  const unreadNotifications = notifications.filter((notification) => !notification.read);
  await Promise.all(
    unreadNotifications.map((notification) =>
      markNotificationAsRead(notification.id),
    ),
  );
};
