"use client";

import React, { useEffect, useState, useRef } from "react";
import { Send, CheckCheck, ArrowLeft, Loader2, User } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useMobileTheme } from "@/context/MobileThemeContext";

// Helper for dynamic colors
const getColorHex = (color: string) => {
  const colors: Record<string, string> = {
    blue: "#2563eb",
    purple: "#9333ea",
    rose: "#e11d48",
    amber: "#d97706",
  };
  return colors[color] || colors.blue;
};

export default function StaffChat() {
  const { data: session } = useSession();
  const router = useRouter();
  const { darkMode, accent, themeClasses } = useMobileTheme();
  const accentHex = getColorHex(accent);

  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  // --------------------------------------------------
  // 1. FETCH & POLL MESSAGES
  // --------------------------------------------------
  const fetchMessages = async () => {
    try {
      const res = await fetch("/api/mobile/messages");
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (e) {
      console.error("Chat Sync Error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // --------------------------------------------------
  // 2. SEND MESSAGE (OPTIMISTIC)
  // --------------------------------------------------
  const send = async () => {
    if (!input.trim()) return;

    const optimisticMsg = {
      id: `temp-${Date.now()}`,
      content: input,
      createdAt: new Date().toISOString(),
      direction: "OUTGOING", // 🔧 FIX: explicit direction
      pending: true,
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setInput("");

    try {
      await fetch("/api/mobile/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: optimisticMsg.content }),
      });

      fetchMessages(); // refresh with real IDs
    } catch (error) {
      alert("Failed to send");
    }
  };

  return (
    <div className={`flex flex-col h-screen font-sans ${themeClasses.bg} transition-colors duration-500`}>
      
      {/* HEADER */}
      <div className={`px-4 py-4 border-b flex items-center gap-3 sticky top-0 z-20 shadow-sm ${themeClasses.nav} ${themeClasses.border}`}>
        <button
          onClick={() => router.back()}
          className={`p-2 rounded-full hover:opacity-70 transition-colors ${
            darkMode ? "bg-slate-800" : "bg-slate-100"
          }`}
        >
          <ArrowLeft className={`w-5 h-5 ${themeClasses.text}`} />
        </button>
        <div>
          <h1 className={`text-lg font-black tracking-tight ${themeClasses.text}`}>
            HQ Support
          </h1>
          <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Online
          </p>
        </div>
      </div>

      {/* CHAT AREA */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading && (
          <div className="flex justify-center pt-10">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        )}

        {messages.length === 0 && !loading && (
          <div className="text-center py-20 opacity-40">
            <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-slate-400" />
            </div>
            <p className={`text-xs font-black uppercase tracking-widest ${themeClasses.text}`}>
              Start a conversation
            </p>
          </div>
        )}

        {messages.map((msg, index) => {
          // 🔧 FIX: Direction-based rendering
          const isMe = msg.direction === "OUTGOING";

          return (
            <div
              key={msg.id || index}
              className={`flex ${
                isMe ? "justify-end" : "justify-start"
              } animate-in slide-in-from-bottom-2 duration-300`}
            >
              <div
                className={`px-5 py-3 rounded-2xl max-w-[80%] shadow-sm text-sm font-medium relative ${
                  isMe
                    ? "text-white rounded-tr-none"
                    : `${
                        darkMode
                          ? "bg-slate-800 text-slate-200"
                          : "bg-white text-slate-800 border border-slate-100"
                      } rounded-tl-none`
                }`}
                style={{ backgroundColor: isMe ? accentHex : undefined }}
              >
                <p>{msg.content}</p>
                <div className="text-[9px] mt-1 flex items-center gap-1 justify-end opacity-70">
                  {new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  {isMe && <CheckCheck size={10} />}
                </div>
              </div>
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>

      {/* INPUT */}
      <div className={`p-4 border-t ${themeClasses.card} ${themeClasses.border}`}>
        <div className="flex gap-2 relative">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            className={`flex-1 h-14 pl-6 pr-4 rounded-[1.5rem] font-bold text-sm outline-none border transition-all ${
              darkMode
                ? "bg-slate-900 border-slate-700 text-white"
                : "bg-slate-50 border-slate-200 text-slate-900"
            }`}
            placeholder="Type a message..."
          />
          <button
            onClick={send}
            disabled={!input.trim()}
            className="w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg active:scale-90 transition-all disabled:opacity-50 disabled:scale-100"
            style={{ backgroundColor: accentHex }}
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
