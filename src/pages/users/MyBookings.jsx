import { useState, useEffect } from "react";
import { getUserBookings, deleteBooking } from "../../services/bookingService";
import { getCurrentUser } from "../../services/authService";

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all"); // all, upcoming, past
  const [deleteMessage, setDeleteMessage] = useState("");
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    fetchUserBookings();
  }, []);

  const formatBookingDateRange = (booking) => {
    if (!booking?.date) return "Date not available";
    if (!booking.endDate || booking.endDate === booking.date) {
      return booking.date;
    }

    return `${booking.date} to ${booking.endDate}`;
  };

  const formatBookingTimeRange = (booking) => {
    if (!booking?.startTime || !booking?.endTime) {
      return "Time not available";
    }

    return booking.spansNextDay
      ? `${booking.startTime} - ${booking.endTime} (next day)`
      : `${booking.startTime} - ${booking.endTime}`;
  };

  const fetchUserBookings = async () => {
    try {
      setLoading(true);
      const currentUser = getCurrentUser();
      if (!currentUser) {
        setError("Please log in to view your bookings");
        return;
      }

      const userBookings = await getUserBookings(currentUser.uid);
      setBookings(userBookings);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredBookings = bookings.filter((booking) => {
    const bookingDate = new Date(booking.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (filter === "upcoming") {
      return bookingDate >= today;
    } else if (filter === "past") {
      return bookingDate < today;
    }
    return true;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleDeleteBooking = async (booking) => {
    try {
      setDeleteMessage("");
      setDeleteError("");
      await deleteBooking(booking.roomId, booking.date, booking.id);
      setBookings(bookings.filter((b) => b.id !== booking.id));
      setDeleteMessage("Booking deleted successfully");
      setTimeout(() => setDeleteMessage(""), 3000);
    } catch (err) {
      setDeleteError(err.message || "Failed to delete booking");
      console.error("Error deleting booking:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading your bookings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">My Bookings</h1>
          <p className="mt-2 text-slate-600">
            View and manage your room bookings
          </p>
        </div>

        {/* Success/Error Messages */}
        {deleteMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
            <p className="text-sm text-green-800">{deleteMessage}</p>
          </div>
        )}
        {deleteError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-sm text-red-800">{deleteError}</p>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-slate-100 p-1 rounded-2xl w-fit">
            {[
              { key: "all", label: "All Bookings" },
              { key: "upcoming", label: "Upcoming" },
              { key: "past", label: "Past" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`px-4 py-2 text-sm font-medium rounded-xl transition ${
                  filter === tab.key
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Bookings List */}
        <div className="space-y-4">
          {filteredBookings.length === 0 ? (
            <div className="rounded-3xl bg-white p-10 text-center shadow-sm border border-slate-200">
              <svg
                className="w-16 h-16 text-slate-400 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 4v10a2 2 0 002 2h4a2 2 0 002-2V11M9 11h6"
                />
              </svg>
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                No bookings found
              </h3>
              <p className="text-slate-600">
                {filter === "all"
                  ? "You haven't made any bookings yet."
                  : filter === "upcoming"
                    ? "You have no upcoming bookings."
                    : "You have no past bookings."}
              </p>
            </div>
          ) : (
            filteredBookings.map((booking) => (
              <div
                key={booking.id}
                className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200 hover:shadow-md transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="w-12 h-12 bg-sky-100 rounded-xl flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-sky-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">
                        {booking.roomName}
                      </h3>
                      <p className="text-sm text-slate-600">
                        {formatBookingDateRange(booking)} •{" "}
                        {formatBookingTimeRange(booking)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span
                        className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(booking.status)}`}
                      >
                        {booking.status}
                      </span>
                      {booking.status === "approved" && (
                        <p className="text-xs text-slate-500 mt-1">Confirmed</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteBooking(booking)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Delete booking"
                    >
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
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                {booking.status === "pending" && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
                    <p className="text-sm text-yellow-800">
                      Your booking request is pending approval. You'll receive a
                      notification once it's reviewed.
                    </p>
                  </div>
                )}

                {booking.status === "rejected" && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-sm text-red-800">
                      Your booking request was not approved. Please contact an
                      administrator for more information.
                    </p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
