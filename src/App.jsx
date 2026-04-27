import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useState, useEffect } from "react";
import Navbar from "./components/common/Navbar";
import RoomChatbot from "./components/common/RoomChatbot";
import Login from "./pages/auth/login";
import Rooms from "./pages/users/rooms";
import RoomDetails from "./pages/users/roomdetails";
import MyBookings from "./pages/users/MyBookings";
import AdminDashboard from "./pages/admin/AdminDashboard";
import {
  getCurrentUser,
  onAuthStateChange,
  getUserRole,
} from "./services/authService";
import { useLocation } from "react-router-dom";

function App() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState("user");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (user) => {
      setUser(user);
      if (user) {
        const role = await getUserRole(user.uid);
        setUserRole(role);
      } else {
        setUserRole("user");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <AppRoutes user={user} userRole={userRole} />
    </Router>
  );
}

function AppRoutes({ user, userRole }) {
  const location = useLocation();
  const hideNavbar = location.pathname.startsWith("/room/");
  const isAdmin = userRole === "admin";

  return (
    <div className="min-h-screen bg-slate-50">
      {!hideNavbar && <Navbar userRole={userRole} />}
      <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={!user ? <Login /> : <Navigate to={isAdmin ? "/admin" : "/"} />}
        />

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            user ? (isAdmin ? <Navigate to="/admin" /> : <Rooms />) : <Navigate to="/login" />
          }
        />
        <Route
          path="/rooms"
          element={user ? <Rooms /> : <Navigate to="/login" />}
        />
        <Route
          path="/room/:id"
          element={user ? <RoomDetails /> : <Navigate to="/login" />}
        />
        <Route
          path="/my-bookings"
          element={user ? <MyBookings /> : <Navigate to="/login" />}
        />

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            user && isAdmin ? (
              <AdminDashboard />
            ) : (
              <Navigate to="/" />
            )
          }
        />

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      {user && <RoomChatbot />}
    </div>
  );
}

export default App;
