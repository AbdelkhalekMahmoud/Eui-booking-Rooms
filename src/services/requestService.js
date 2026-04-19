import { db } from "./firebase.js";
import { ref, get, set, update, remove, push } from "firebase/database";
import { createBooking } from "./bookingService.js";

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
    await createBooking(request.roomId, request.date, {
      ...request,
      status: "approved",
      approvedAt: new Date().toISOString(),
      approvedByName: approvedBy?.name || approvedBy?.email || "Admin",
      approvedByEmail: approvedBy?.email || "",
    });

    // Delete from requests
    await deleteRequest(requestId);

    return true;
  } catch (error) {
    console.error("Error approving request:", error);
    throw error;
  }
};

export const rejectRequest = async (requestId) => {
  try {
    await updateRequest(requestId, { status: "rejected" });
    return true;
  } catch (error) {
    console.error("Error rejecting request:", error);
    throw error;
  }
};
