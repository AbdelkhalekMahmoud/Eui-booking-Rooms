import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getRooms } from "../../services/roomService";
import euiLogo from "../../assets/eui-logo.png";

const normalizeStatus = (status) =>
  String(status || "")
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

const isAvailable = (status) => normalizeStatus(status) === "available";

export default function Rooms() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const roomsData = await getRooms();
      setRooms(roomsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 lg:px-10">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-[var(--eui-blue)]"></div>
          <p className="mt-4 text-slate-600">Loading rooms...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 lg:px-10">
        <div className="text-center">
          <p className="text-red-600">Error loading rooms: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/80 shadow-[0_28px_70px_rgba(15,38,92,0.12)] ring-1 ring-[rgba(255,255,255,0.42)] backdrop-blur-xl">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="relative p-6 sm:p-8">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(196,150,69,0.18),transparent_28%),linear-gradient(135deg,rgba(15,38,92,0.98),rgba(23,95,184,0.92)_45%,rgba(23,124,122,0.9))]" />
              <div className="relative">
                <div className="flex items-center gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-[1.25rem] bg-white/14 backdrop-blur-sm ring-1 ring-white/20">
                    <img
                      src={euiLogo}
                      alt="EUI logo"
                      className="h-9 w-9 object-contain"
                    />
                  </div>
                  <p className="text-sm font-semibold uppercase tracking-[0.32em] text-[rgba(255,255,255,0.74)]">
                    EUI Room Booking
                  </p>
                </div>
                <h1 className="mt-8 max-w-3xl text-4xl font-semibold text-white sm:text-5xl">
                  Reserve university rooms with a clearer, faster staff
                  workflow.
                </h1>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-[rgba(255,255,255,0.78)] sm:text-base">
                  Browse available spaces, compare facilities, and book the best
                  room for meetings, labs, and research sessions across the EUI
                  campus.
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  <span className="rounded-full border border-white/18 bg-white/10 px-4 py-2 text-sm text-white/85 backdrop-blur-sm">
                    Live availability
                  </span>
                  <span className="rounded-full border border-white/18 bg-white/10 px-4 py-2 text-sm text-white/85 backdrop-blur-sm">
                    Staff access only
                  </span>
                  <span className="rounded-full border border-white/18 bg-white/10 px-4 py-2 text-sm text-white/85 backdrop-blur-sm">
                    Admin approval flow
                  </span>
                </div>
              </div>
            </div>

            <div className="grid gap-4 p-6 sm:p-8">
              <div className="rounded-[1.75rem] border border-[rgba(23,95,184,0.12)] bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[var(--eui-gold)]">
                  Portfolio
                </p>
                <p className="mt-3 text-4xl font-semibold text-[var(--eui-navy)]">
                  {rooms.length}
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  Total bookable rooms
                </p>
              </div>

              <div className="rounded-[1.75rem] border border-[rgba(23,124,122,0.12)] bg-[rgba(23,124,122,0.06)] p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[var(--eui-teal)]">
                  Right Now
                </p>
                <p className="mt-3 text-4xl font-semibold text-[var(--eui-navy)]">
                  {rooms.filter((room) => isAvailable(room.status)).length}
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  Rooms available now
                </p>
              </div>

              <div className="rounded-[1.75rem] border border-[rgba(196,150,69,0.15)] bg-[rgba(196,150,69,0.08)] p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[var(--eui-gold)]">
                  Booking Mode
                </p>
                <p className="mt-3 text-lg font-semibold text-[var(--eui-navy)]">
                  Research, meetings, and staff sessions
                </p>
              </div>
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[1.5rem] border border-white/70 bg-white/80 p-5 shadow-sm backdrop-blur-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-400">
              Campus Feel
            </p>
            <p className="mt-3 text-lg font-semibold text-[var(--eui-navy)]">
              EUI blue and gold branding across the booking experience
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-white/70 bg-white/80 p-5 shadow-sm backdrop-blur-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-400">
              Fast Choice
            </p>
            <p className="mt-3 text-lg font-semibold text-[var(--eui-navy)]">
              Capacity, type, and facilities visible before opening details
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-white/70 bg-white/80 p-5 shadow-sm backdrop-blur-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-400">
              Live Status
            </p>
            <p className="mt-3 text-lg font-semibold text-[var(--eui-navy)]">
              Available and unavailable spaces are easier to scan
            </p>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {rooms.length === 0 ? (
            <div className="col-span-full rounded-4xl border border-dashed border-slate-300 bg-white/80 p-10 text-center text-slate-500 shadow-sm">
              No rooms found yet. Please check back later.
            </div>
          ) : (
            rooms.map((room) => (
              <article
                key={room.id}
                className="overflow-hidden rounded-[1.85rem] border border-white/70 bg-white/88 p-6 shadow-[0_24px_50px_rgba(15,38,92,0.08)] ring-1 ring-[rgba(255,255,255,0.45)] transition hover:-translate-y-1 hover:shadow-[0_30px_70px_rgba(15,38,92,0.14)]"
              >
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--eui-gold)]">
                      {room.building}
                    </p>
                    <h2 className="mt-3 text-2xl font-semibold text-[var(--eui-navy)]">
                      {room.name}
                    </h2>
                  </div>
                  <span
                    className={
                      "rounded-full px-3 py-1 text-sm font-semibold " +
                      (isAvailable(room.status)
                        ? "bg-[rgba(23,124,122,0.12)] text-[var(--eui-teal)]"
                        : "bg-rose-100 text-rose-700")
                    }
                  >
                    {room.status}
                  </span>
                </div>

                <div className="grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                  <div className="rounded-3xl bg-[rgba(23,95,184,0.05)] p-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                      Capacity
                    </p>
                    <p className="mt-2 text-lg font-semibold text-[var(--eui-navy)]">
                      {room.capacity}
                    </p>
                  </div>
                  <div className="rounded-3xl bg-[rgba(196,150,69,0.07)] p-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                      Room type
                    </p>
                    <p className="mt-2 text-lg font-semibold text-[var(--eui-navy)]">
                      {room.type}
                    </p>
                  </div>
                </div>

                <div className="mt-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Facilities
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {room.facilities?.map((facility, index) => (
                      <span
                        key={index}
                        className="rounded-full border border-[rgba(23,95,184,0.10)] bg-[rgba(23,95,184,0.05)] px-3 py-1 text-xs text-slate-700"
                      >
                        {facility}
                      </span>
                    ))}
                  </div>
                </div>

                {isAvailable(room.status) ? (
                  <Link
                    to={`/room/${room.id}`}
                    className="mt-6 inline-flex w-full items-center justify-center rounded-3xl bg-[linear-gradient(135deg,var(--eui-navy),var(--eui-blue))] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[rgba(15,38,92,0.18)] transition hover:brightness-105"
                  >
                    Book Now
                  </Link>
                ) : (
                  <button
                    type="button"
                    className="mt-6 inline-flex w-full cursor-not-allowed items-center justify-center rounded-3xl bg-slate-200 px-4 py-3 text-sm font-semibold text-slate-500 shadow-sm transition"
                    disabled
                  >
                    Unavailable
                  </button>
                )}
              </article>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
