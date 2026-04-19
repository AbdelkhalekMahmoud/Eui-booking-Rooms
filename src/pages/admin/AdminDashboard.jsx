import { useState, useEffect } from "react";
import {
  getDashboardStats,
  getRecentBookings,
  getRoomUtilization,
} from "../../services/dashboardService";
import {
  getRequests,
  approveRequest,
  rejectRequest,
} from "../../services/requestService";
import { getBookings } from "../../services/bookingService";
import { getCurrentUser } from "../../services/authService";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);
  const [requests, setRequests] = useState([]);
  const [roomUtilization, setRoomUtilization] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsData, bookingsData, requestsData, utilizationData] =
        await Promise.all([
          getDashboardStats(),
          getRecentBookings(10),
          getRequests(),
          getRoomUtilization(),
        ]);

      setStats(statsData);
      setRecentBookings(bookingsData);
      setRequests(requestsData);
      setRoomUtilization(utilizationData);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRequest = async (requestId) => {
    try {
      const currentUser = getCurrentUser();
      await approveRequest(requestId, {
        name: currentUser?.displayName || currentUser?.email || "Admin",
        email: currentUser?.email || "",
      });
      fetchDashboardData(); // Refresh data
    } catch (error) {
      console.error("Error approving request:", error);
      alert("Error approving request: " + error.message);
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      await rejectRequest(requestId);
      fetchDashboardData(); // Refresh data
    } catch (error) {
      console.error("Error rejecting request:", error);
      alert("Error rejecting request: " + error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
          <p className="mt-2 text-slate-600">
            Manage rooms, bookings, and requests
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-xl">
                <svg
                  className="w-6 h-6 text-blue-600"
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
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">
                  Total Rooms
                </p>
                <p className="text-2xl font-bold text-slate-900">
                  {stats?.totalRooms || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-xl">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">
                  Total Users
                </p>
                <p className="text-2xl font-bold text-slate-900">
                  {stats?.totalUsers || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-xl">
                <svg
                  className="w-6 h-6 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 4v10a2 2 0 002 2h4a2 2 0 002-2V11M9 11h6"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">
                  Total Bookings
                </p>
                <p className="text-2xl font-bold text-slate-900">
                  {stats?.totalBookings || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-xl">
                <svg
                  className="w-6 h-6 text-orange-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">
                  Pending Requests
                </p>
                <p className="text-2xl font-bold text-slate-900">
                  {stats?.pendingRequests || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-1 bg-slate-100 p-1 rounded-2xl">
            {["overview", "requests", "utilization"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 px-4 text-sm font-medium rounded-xl transition ${
                  activeTab === tab
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">
                Recent Bookings
              </h3>
              <div className="space-y-3">
                {recentBookings.length === 0 ? (
                  <p className="text-slate-500 text-center py-4">
                    No recent bookings
                  </p>
                ) : (
                  recentBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-xl"
                    >
                      <div>
                        <p className="font-medium text-slate-900">
                          {booking.roomName}
                        </p>
                        <p className="text-sm text-slate-600">
                          {booking.userName} • {booking.date} •{" "}
                          {booking.startTime} - {booking.endTime}
                        </p>
                      </div>
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                        {booking.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "requests" && (
          <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Pending Requests
            </h3>
            <div className="space-y-3">
              {requests.filter((req) => req.status === "pending").length ===
              0 ? (
                <p className="text-slate-500 text-center py-4">
                  No pending requests
                </p>
              ) : (
                requests
                  .filter((req) => req.status === "pending")
                  .map((request) => (
                    <div
                      key={request.id}
                      className="p-4 border border-slate-200 rounded-xl"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-medium text-slate-900">
                            {request.roomName}
                          </p>
                          <p className="text-sm text-slate-600">
                            {request.userName} • {request.date} •{" "}
                            {request.startTime} - {request.endTime}
                          </p>
                          {request.createdAt && (
                            <p className="text-xs text-slate-500 mt-1">
                              Requested:{" "}
                              {new Date(request.createdAt).toLocaleString()}
                            </p>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleApproveRequest(request.id)}
                            className="px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleRejectRequest(request.id)}
                            className="px-3 py-1 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        )}

        {activeTab === "utilization" && (
          <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Room Utilization
            </h3>
            <div className="space-y-3">
              {roomUtilization.map((room) => (
                <div
                  key={room.roomId}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-xl"
                >
                  <div>
                    <p className="font-medium text-slate-900">{room.name}</p>
                    <p className="text-sm text-slate-600">ID: {room.roomId}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-slate-900">
                      {room.totalBookings}
                    </p>
                    <p className="text-sm text-slate-600">bookings</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
