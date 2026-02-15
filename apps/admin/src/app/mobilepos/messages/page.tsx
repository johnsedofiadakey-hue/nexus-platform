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
      const res = await fetch("/api/mobile/messages", { cache: 'no-store' });
      if (res.ok) {
        const payload = await res.json();
        const inner = payload?.data ?? payload;
        const rows = inner?.items ?? inner;
        setMessages(Array.isArray(rows) ? rows : []);
      }
    } catch (e) {
      console.error("Chat Sync Error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 2000);
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
    <div className={`flex flex-col h-full font-sans bg-slate-50 dark:bg-slate-900 transition-colors duration-500`}>

      {/* HEADER */}
      <div className="px-6 py-5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center gap-4 sticky top-0 z-20 shadow-sm">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
            HQ Support
          </h1>
          <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Online
          </p>
        </div>
        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs uppercase">
          HQ
        </div>
      </div>

      {/* CHAT AREA */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {loading && (
          <div className="flex justify-center pt-10">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        )}

        {messages.length === 0 && !loading && (
          <div className="text-center py-20 opacity-40 animate-in fade-in duration-700">
            <div className="w-16 h-16 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-xs font-black uppercase tracking-widest text-slate-500">
              Start a conversation
            </p>
          </div>
        )}

        {messages.map((msg, index) => {
          const isMe = msg.direction === "OUTGOING";

          return (
            <div
              key={msg.id || index}
              className={`flex ${isMe ? "justify-end" : "justify-start"
                } animate-in slide-in-from-bottom-2 duration-300`}
            >
              <div
                className={`px-5 py-3 rounded-2xl max-w-[80%] shadow-sm text-sm font-medium relative ${isMe
                    ? "bg-gradient-to-br from-blue-600 to-blue-500 text-white rounded-tr-sm"
                    : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-slate-700 rounded-tl-sm"
                  }`}
              >
                <p className="leading-relaxed">{msg.content}</p>
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
      <div className="p-4 pb-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-slate-200 dark:border-slate-800">
        <div className="flex gap-2 relative">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            className="flex-1 h-12 pl-5 pr-4 rounded-full font-medium text-sm outline-none border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
            placeholder="Type a message..."
          />
          <button
            onClick={send}
            disabled={!input.trim()}
            className="w-12 h-12 rounded-full flex items-center justify-center bg-blue-600 text-white shadow-lg shadow-blue-500/30 active:scale-90 transition-all disabled:opacity-50 disabled:scale-100 hover:bg-blue-700"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
