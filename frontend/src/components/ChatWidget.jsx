import React, { useEffect, useRef, useState } from "react";
import { chatApi } from "../lib/api";

function IconSparkle() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8" />
    </svg>
  );
}
function IconClose() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 6 6 18" /><path d="M6 6l12 12" />
    </svg>
  );
}
function IconSend() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path d="M22 2 11 13" /><path d="M22 2 15 22l-4-9-9-4 20-7Z" />
    </svg>
  );
}

const GREETING = {
  role: "assistant",
  text: "Hi! I'm the NexaCRM assistant. Ask me anything about your products, orders, customers or revenue — I can see the live data.",
};

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([GREETING]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open, loading]);

  async function handleSend(e) {
    e?.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    setError("");
    const nextMessages = [...messages, { role: "user", text }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const history = messages
        .filter((m) => m !== GREETING)
        .map((m) => ({ role: m.role, text: m.text }));
      const data = await chatApi.ask(text, history);
      setMessages((prev) => [...prev, { role: "assistant", text: data.reply }]);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Floating toggle button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-brand text-white shadow-lg flex items-center justify-center hover:bg-brand/90 transition-colors"
        aria-label={open ? "Close assistant" : "Open assistant"}
      >
        {open ? <IconClose /> : <IconSparkle />}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-40 w-[min(380px,calc(100vw-2rem))] h-[min(560px,calc(100vh-8rem))] bg-white border border-gray-200 rounded-2xl shadow-lg flex flex-col overflow-hidden">
          <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-100 bg-brand text-white shrink-0">
            <span className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center">
              <IconSparkle />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-bold truncate">NexaCRM Assistant</p>
              <p className="text-xs text-white/70 truncate">Knows your live data</p>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-wrap ${
                  m.role === "user"
                    ? "bg-brand text-white self-end rounded-br-sm"
                    : "bg-gray-100 text-gray-800 self-start rounded-bl-sm"
                }`}
              >
                {m.text}
              </div>
            ))}

            {loading && (
              <div className="bg-gray-100 text-gray-400 self-start rounded-2xl rounded-bl-sm px-3.5 py-2.5 text-sm flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" />
              </div>
            )}

            {error && (
              <div className="text-xs text-risk-text bg-risk-bg border border-red-100 rounded-lg px-3 py-2.5 self-start max-w-[90%]">
                {error}
              </div>
            )}
          </div>

          <form onSubmit={handleSend} className="flex items-center gap-2 px-3 py-3 border-t border-gray-100 shrink-0">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about orders, stock, revenue..."
              className="flex-1 min-w-0 bg-gray-50 border border-gray-200 rounded-full px-4 py-2.5 text-sm outline-none focus:border-brand"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="w-10 h-10 shrink-0 rounded-full bg-brand text-white flex items-center justify-center disabled:opacity-40 hover:bg-brand/90 transition-colors"
              aria-label="Send"
            >
              <IconSend />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
