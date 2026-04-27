import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getRooms, getAllRoomDetails } from "../../services/roomService";

const normalizeText = (value) =>
  String(value || "")
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

const isAvailable = (status) => normalizeText(status) === "available";

const getRoomLocationText = (room) => {
  if (room?.location && typeof room.location === "object") {
    return [room.location.building, room.location.floor ? `floor ${room.location.floor}` : null]
      .filter(Boolean)
      .join(" ");
  }

  return [room?.building, room?.location].filter(Boolean).join(" ");
};

const parseCapacityNeed = (prompt) => {
  const directMatch = prompt.match(/(?:for|need|capacity|room for)\s+(\d{1,3})/i);
  if (directMatch) {
    return Number(directMatch[1]);
  }

  const peopleMatch = prompt.match(/(\d{1,3})\s*(?:people|persons|staff|guests|users|attendees)/i);
  if (peopleMatch) {
    return Number(peopleMatch[1]);
  }

  return null;
};

const getRequestedFeatures = (prompt) => {
  const featureMatchers = [
    { key: "projector", terms: ["projector"] },
    { key: "wifi", terms: ["wifi", "wi-fi", "internet"] },
    { key: "whiteboard", terms: ["whiteboard", "board"] },
    { key: "tv", terms: ["tv", "screen", "display"] },
    { key: "air", terms: ["air", "ac", "air conditioning"] },
    { key: "lab", terms: ["lab", "laboratory"] },
    { key: "meeting", terms: ["meeting", "discussion", "conference"] },
    { key: "research", terms: ["research"] },
  ];

  return featureMatchers
    .filter((feature) =>
      feature.terms.some((term) => prompt.includes(term)),
    )
    .map((feature) => feature.key);
};

const scoreRoom = (room, prompt, requestedCapacity, requestedFeatures) => {
  let score = 0;
  const searchableText = normalizeText(
    [
      room.name,
      room.type,
      room.building,
      getRoomLocationText(room),
      ...(Array.isArray(room.facilities) ? room.facilities : []),
      room.description,
    ].join(" "),
  );

  if (requestedCapacity !== null) {
    const roomCapacity = Number(room.capacity || 0);
    if (roomCapacity >= requestedCapacity) {
      score += 18;
      score += Math.max(0, 10 - Math.abs(roomCapacity - requestedCapacity) / 5);
    } else {
      score -= 20;
    }
  }

  if (isAvailable(room.status)) {
    score += 10;
  }

  requestedFeatures.forEach((feature) => {
    if (searchableText.includes(feature)) {
      score += 12;
    }
  });

  if (prompt.includes("available") && isAvailable(room.status)) {
    score += 8;
  }

  if (prompt.includes("quiet") && searchableText.includes("meeting")) {
    score += 5;
  }

  if (prompt.includes("large") && Number(room.capacity || 0) >= 20) {
    score += 6;
  }

  if (prompt.includes("small") && Number(room.capacity || 0) > 0 && Number(room.capacity) <= 8) {
    score += 6;
  }

  return score;
};

const buildReply = (matches, prompt, requestedCapacity, requestedFeatures) => {
  if (matches.length === 0) {
    return {
      text:
        "I couldn't find a strong room match yet. Try adding capacity, room type, or facilities like projector, lab, or whiteboard.",
      suggestions: [],
    };
  }

  const summaryParts = [];
  if (requestedCapacity !== null) {
    summaryParts.push(`for about ${requestedCapacity} people`);
  }
  if (requestedFeatures.length > 0) {
    summaryParts.push(`with ${requestedFeatures.join(", ")}`);
  }

  const opening = summaryParts.length
    ? `Here are the best room matches ${summaryParts.join(" ")}.`
    : `Here are the best room matches for "${prompt}".`;

  const suggestions = matches.slice(0, 3).map((room) => ({
    id: room.id,
    name: room.name || room.id,
    capacity: room.capacity || "N/A",
    type: room.type || "Room",
    status: room.status || "Unknown",
    building: room.building || getRoomLocationText(room) || "EUI campus",
    facilities: Array.isArray(room.facilities) ? room.facilities.slice(0, 3) : [],
  }));

  return {
    text: opening,
    suggestions,
  };
};

const starterPrompts = [
  "Need a meeting room for 8 people",
  "Suggest a lab with projector",
  "I need an available room with whiteboard",
];

export default function RoomChatbot() {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      role: "bot",
      text:
        "Room Assistant is ready. Ask for a room by capacity, type, building, or facilities like projector, lab, wifi, or whiteboard.",
      suggestions: [],
    },
  ]);

  useEffect(() => {
    const loadRooms = async () => {
      try {
        setLoading(true);
        const [basicRooms, detailedRooms] = await Promise.all([
          getRooms(),
          getAllRoomDetails(),
        ]);

        const detailMap = new Map(detailedRooms.map((room) => [room.id, room]));
        const mergedRooms = basicRooms.map((room) => ({
          ...detailMap.get(room.id),
          ...room,
          id: room.id,
        }));

        const missingDetailedOnlyRooms = detailedRooms.filter(
          (room) => !mergedRooms.some((basicRoom) => basicRoom.id === room.id),
        );

        setRooms([...mergedRooms, ...missingDetailedOnlyRooms]);
      } catch (error) {
        console.error("Error loading rooms for chatbot:", error);
      } finally {
        setLoading(false);
      }
    };

    loadRooms();
  }, []);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const sendPrompt = (rawPrompt) => {
    const prompt = normalizeText(rawPrompt);
    if (!prompt) {
      return;
    }

    const userMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: rawPrompt.trim(),
      suggestions: [],
    };

    const requestedCapacity = parseCapacityNeed(prompt);
    const requestedFeatures = getRequestedFeatures(prompt);
    const rankedRooms = [...rooms]
      .map((room) => ({
        ...room,
        score: scoreRoom(room, prompt, requestedCapacity, requestedFeatures),
      }))
      .filter((room) => room.score > -5)
      .sort((first, second) => second.score - first.score);

    const reply = buildReply(
      rankedRooms,
      rawPrompt.trim(),
      requestedCapacity,
      requestedFeatures,
    );

    const botMessage = {
      id: `bot-${Date.now()}`,
      role: "bot",
      text: reply.text,
      suggestions: reply.suggestions,
    };

    setMessages((current) => [...current, userMessage, botMessage]);
    setInput("");
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {isOpen && (
        <div className="mb-4 w-[min(92vw,24rem)] overflow-hidden rounded-[2rem] border border-white/70 bg-white/95 shadow-[0_24px_70px_rgba(15,38,92,0.18)] backdrop-blur-xl">
          <div className="bg-[linear-gradient(135deg,var(--eui-navy),var(--eui-blue),var(--eui-teal))] px-5 py-4 text-white">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/70">
                  Smart Assistant
                </p>
                <h3 className="mt-1 text-lg font-semibold">
                  Room Recommendation Bot
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-full bg-white/12 px-3 py-1 text-sm font-medium text-white transition hover:bg-white/20"
              >
                Close
              </button>
            </div>
          </div>

          <div className="max-h-[28rem] space-y-4 overflow-y-auto bg-[linear-gradient(180deg,rgba(249,251,255,0.95),rgba(238,244,251,0.95))] p-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={message.role === "user" ? "flex justify-end" : "flex justify-start"}
              >
                <div
                  className={
                    message.role === "user"
                      ? "max-w-[85%] rounded-[1.4rem] rounded-br-md bg-[var(--eui-navy)] px-4 py-3 text-sm text-white shadow-sm"
                      : "max-w-[92%] space-y-3 rounded-[1.4rem] rounded-bl-md border border-[rgba(23,95,184,0.08)] bg-white px-4 py-3 text-sm text-slate-700 shadow-sm"
                  }
                >
                  <p>{message.text}</p>

                  {message.suggestions?.length > 0 && (
                    <div className="space-y-2">
                      {message.suggestions.map((room) => (
                        <button
                          key={room.id}
                          type="button"
                          onClick={() => navigate(`/room/${room.id}`)}
                          className="block w-full rounded-2xl border border-[rgba(23,95,184,0.12)] bg-[rgba(23,95,184,0.04)] p-3 text-left transition hover:bg-[rgba(23,95,184,0.08)]"
                        >
                          <p className="font-semibold text-[var(--eui-navy)]">
                            {room.name}
                          </p>
                          <p className="mt-1 text-xs text-slate-600">
                            {room.building} • {room.type} • capacity {room.capacity}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            Status: {room.status}
                          </p>
                          {room.facilities.length > 0 && (
                            <p className="mt-1 text-xs text-slate-500">
                              Facilities: {room.facilities.join(", ")}
                            </p>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                Quick prompts
              </p>
              <div className="flex flex-wrap gap-2">
                {starterPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => sendPrompt(prompt)}
                    className="rounded-full border border-[rgba(23,95,184,0.12)] bg-white px-3 py-2 text-xs text-slate-700 transition hover:border-[rgba(23,95,184,0.22)] hover:bg-[rgba(23,95,184,0.05)]"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 bg-white p-4">
            <form
              onSubmit={(event) => {
                event.preventDefault();
                sendPrompt(input);
              }}
              className="space-y-3"
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                rows={3}
                placeholder="Example: I need an available room for 12 people with a projector"
                className="w-full resize-none rounded-[1.4rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
              />
              <button
                type="submit"
                disabled={loading || rooms.length === 0}
                className={`w-full rounded-[1.2rem] px-4 py-3 text-sm font-semibold text-white transition ${loading || rooms.length === 0 ? "cursor-not-allowed bg-slate-300" : "bg-[linear-gradient(135deg,var(--eui-navy),var(--eui-blue))] shadow-lg shadow-[rgba(15,38,92,0.18)] hover:brightness-105"}`}
              >
                {loading ? "Loading room data..." : "Ask assistant"}
              </button>
            </form>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex items-center gap-3 rounded-full bg-[linear-gradient(135deg,var(--eui-navy),var(--eui-blue))] px-5 py-4 text-sm font-semibold text-white shadow-[0_20px_45px_rgba(15,38,92,0.24)] transition hover:brightness-105"
      >
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/14 text-lg">
          AI
        </span>
        Room Assistant
      </button>
    </div>
  );
}
