import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { logout, onAuthStateChange } from "../../services/authService";
import {
  markAllNotificationsAsRead,
  markNotificationAsRead,
  subscribeToUserNotifications,
} from "../../services/notificationService";
import euiLogo from "../../assets/eui-logo.png";

export default function Navbar({ userRole = "user" }) {
  const [user, setUser] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const location = useLocation();
  const isAdmin = userRole === "admin";
  const homePath = isAdmin ? "/admin" : "/rooms";

  useEffect(() => {
    const unsubscribe = onAuthStateChange((currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user?.uid) {
      setNotifications([]);
      return () => {};
    }

    return subscribeToUserNotifications(user.uid, setNotifications);
  }, [user?.uid]);

  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      window.location.href = "/login";
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const isActive = (path) => location.pathname === path;
  const unreadCount = notifications.filter((notification) => !notification.read).length;

  const getNotificationTone = (type) => {
    switch (type) {
      case "approved":
        return "border-green-200 bg-green-50 text-green-800";
      case "rejected":
        return "border-red-200 bg-red-50 text-red-800";
      case "request":
        return "border-sky-200 bg-sky-50 text-sky-800";
      default:
        return "border-slate-200 bg-slate-50 text-slate-700";
    }
  };

  const formatNotificationTime = (dateValue) => {
    if (!dateValue) return "";
    return new Date(dateValue).toLocaleString();
  };

  return (
    <nav className="sticky top-0 z-40 border-b border-white/60 bg-white/75 shadow-[0_18px_50px_rgba(15,38,92,0.08)] backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          <div className="flex items-center">
            <Link to={homePath} className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-[rgba(23,95,184,0.12)]">
                <img
                  src={euiLogo}
                  alt="EUI logo"
                  className="h-8 w-8 object-contain"
                />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--eui-gold)]">
                  EUI Portal
                </p>
                <span className="text-lg font-semibold text-[var(--eui-navy)]">
                  Room Booking
                </span>
              </div>
            </Link>
          </div>

          <div className="hidden items-center space-x-8 md:flex">
            <Link
              to="/rooms"
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                isActive("/") || isActive("/rooms")
                  ? "bg-[rgba(23,95,184,0.1)] text-[var(--eui-blue)]"
                  : "text-slate-700 hover:bg-[rgba(23,124,122,0.08)] hover:text-[var(--eui-teal)]"
              }`}
            >
              Rooms
            </Link>

            {user && (
              <Link
                to="/my-bookings"
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  isActive("/my-bookings")
                    ? "bg-[rgba(23,95,184,0.1)] text-[var(--eui-blue)]"
                    : "text-slate-700 hover:bg-[rgba(23,124,122,0.08)] hover:text-[var(--eui-teal)]"
                }`}
              >
                My Bookings
              </Link>
            )}

            {user && isAdmin && (
              <Link
                to="/admin"
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  isActive("/admin")
                    ? "bg-[rgba(196,150,69,0.16)] text-[var(--eui-navy)]"
                    : "text-slate-700 hover:bg-[rgba(196,150,69,0.12)] hover:text-[var(--eui-navy)]"
                }`}
              >
                Admin Dashboard
              </Link>
            )}

            {user ? (
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsNotificationsOpen((current) => !current)}
                    className="relative rounded-full border border-[rgba(23,95,184,0.14)] bg-white p-3 text-slate-700 shadow-sm transition hover:text-[var(--eui-blue)]"
                    aria-label="Open notifications"
                  >
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                      />
                    </svg>
                    {unreadCount > 0 && (
                      <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {isNotificationsOpen && (
                    <div className="absolute right-0 top-14 z-50 w-96 rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_24px_70px_rgba(15,38,92,0.16)]">
                      <div className="mb-4 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            Notifications
                          </p>
                          <p className="text-xs text-slate-500">
                            {unreadCount} unread
                          </p>
                        </div>
                        {unreadCount > 0 && (
                          <button
                            type="button"
                            onClick={() => markAllNotificationsAsRead(notifications)}
                            className="text-xs font-semibold text-[var(--eui-blue)]"
                          >
                            Mark all as read
                          </button>
                        )}
                      </div>

                      <div className="max-h-96 space-y-3 overflow-y-auto pr-1">
                        {notifications.length === 0 ? (
                          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                            No notifications yet.
                          </div>
                        ) : (
                          notifications.map((notification) => (
                            <button
                              key={notification.id}
                              type="button"
                              onClick={() => markNotificationAsRead(notification.id)}
                              className={`block w-full rounded-2xl border p-4 text-left transition hover:shadow-sm ${getNotificationTone(notification.type)} ${notification.read ? "opacity-70" : ""}`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-sm font-semibold">
                                    {notification.title}
                                  </p>
                                  <p className="mt-1 text-sm">
                                    {notification.message}
                                  </p>
                                </div>
                                {!notification.read && (
                                  <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-current" />
                                )}
                              </div>
                              <p className="mt-2 text-xs opacity-80">
                                {formatNotificationTime(notification.createdAt)}
                              </p>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="rounded-full border border-[rgba(23,95,184,0.14)] bg-white px-4 py-2 text-sm text-slate-600 shadow-sm">
                  {user.displayName || user.email}
                </div>
                <button
                  onClick={handleLogout}
                  className="rounded-full bg-[var(--eui-navy)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--eui-blue)]"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="rounded-full border border-[rgba(23,95,184,0.18)] px-4 py-2 text-sm font-medium text-[var(--eui-blue)] transition hover:bg-[rgba(23,95,184,0.08)]"
              >
                Login
              </Link>
            )}
          </div>

          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center rounded-2xl border border-[rgba(23,95,184,0.12)] bg-white p-2 text-slate-700 shadow-sm hover:bg-slate-50 hover:text-[var(--eui-blue)] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[var(--eui-blue)]"
            >
              <svg
                className={`${isMenuOpen ? "hidden" : "block"} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              <svg
                className={`${isMenuOpen ? "block" : "hidden"} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden">
          <div className="space-y-1 border-t border-[rgba(23,95,184,0.08)] bg-white/95 px-3 pt-3 pb-4 shadow-[0_24px_50px_rgba(15,38,92,0.08)]">
            <Link
              to="/rooms"
              className={`block rounded-2xl px-3 py-3 text-base font-medium ${
                isActive("/") || isActive("/rooms")
                  ? "bg-[rgba(23,95,184,0.1)] text-[var(--eui-blue)]"
                  : "text-slate-700 hover:bg-[rgba(23,124,122,0.08)] hover:text-[var(--eui-teal)]"
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              Rooms
            </Link>

            {user && (
              <Link
                to="/my-bookings"
                className={`block rounded-2xl px-3 py-3 text-base font-medium ${
                  isActive("/my-bookings")
                    ? "bg-[rgba(23,95,184,0.1)] text-[var(--eui-blue)]"
                    : "text-slate-700 hover:bg-[rgba(23,124,122,0.08)] hover:text-[var(--eui-teal)]"
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                My Bookings
              </Link>
            )}

            {user && isAdmin && (
              <Link
                to="/admin"
                className={`block rounded-2xl px-3 py-3 text-base font-medium ${
                  isActive("/admin")
                    ? "bg-[rgba(196,150,69,0.16)] text-[var(--eui-navy)]"
                    : "text-slate-700 hover:bg-[rgba(196,150,69,0.12)] hover:text-[var(--eui-navy)]"
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Admin Dashboard
              </Link>
            )}

            {user && (
              <div className="mt-3 rounded-3xl border border-[rgba(23,95,184,0.08)] bg-slate-50 p-3">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Notifications
                    </p>
                    <p className="text-xs text-slate-500">
                      {unreadCount} unread
                    </p>
                  </div>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={() => markAllNotificationsAsRead(notifications)}
                      className="text-xs font-semibold text-[var(--eui-blue)]"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                <div className="max-h-72 space-y-2 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-600">
                      No notifications yet.
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <button
                        key={notification.id}
                        type="button"
                        onClick={() => markNotificationAsRead(notification.id)}
                        className={`block w-full rounded-2xl border bg-white p-3 text-left transition ${getNotificationTone(notification.type)} ${notification.read ? "opacity-70" : ""}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold">
                              {notification.title}
                            </p>
                            <p className="mt-1 text-sm">
                              {notification.message}
                            </p>
                          </div>
                          {!notification.read && (
                            <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-current" />
                          )}
                        </div>
                        <p className="mt-2 text-xs opacity-80">
                          {formatNotificationTime(notification.createdAt)}
                        </p>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}

            {user ? (
              <div className="mt-4 border-t border-slate-200 pt-4">
                <div className="rounded-2xl bg-slate-50 px-3 py-3 text-sm text-slate-600">
                  {user.displayName || user.email}
                </div>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                  }}
                  className="mt-3 block w-full rounded-2xl bg-[var(--eui-navy)] px-3 py-3 text-left text-base font-medium text-white"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="block rounded-2xl border border-[rgba(23,95,184,0.18)] px-3 py-3 text-base font-medium text-[var(--eui-blue)]"
                onClick={() => setIsMenuOpen(false)}
              >
                Login
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
