"use client";

import React, { useState, useEffect, useRef } from "react";
import { Send, MessageSquare, RefreshCw, CheckCheck, Loader2 } from "lucide-react";

type ChatMessage = {
  id: string;
  content: string;
  senderId?: string;
  receiverId?: string;
  createdAt: string;
  isOptimistic?: boolean;
};

interface ChatConsoleProps {
  messages?: ChatMessage[];
  onSendMessage: (content: string) => void;
  onRefresh?: () => void;
  viewerId: string;
  loading?: boolean;
}

export default function ChatConsole({
  messages = [],
  onSendMessage,
  onRefresh,
  viewerId,
  loading = false
}: ChatConsoleProps) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // 🔽 Always scroll to latest message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSendMessage(input.trim());
    setInput("");
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* HEADER */}
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
            <MessageSquare size={16} />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Secure Link
            </span>
            <span className="text-xs font-bold text-slate-900">
              Direct Terminal
            </span>
          </div>
        </div>

        {onRefresh && (
          <button
            onClick={onRefresh}
            className="p-2 hover:bg-slate-50 rounded-lg transition-colors"
          >
            <RefreshCw
              size={14}
              className={`text-slate-300 ${loading ? "animate-spin" : ""}`}
            />
          </button>
        )}
      </div>

      {/* MESSAGE STREAM */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-5 space-y-4 bg-[#fcfcfd]"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-20">
            <MessageSquare size={40} className="text-slate-400 mb-2" />
            <span className="text-[10px] font-black uppercase tracking-widest">
              No active traffic
            </span>
          </div>
        ) : (
          messages.map((m) => {
            // ✅ FINAL, CORRECT MESSAGE DIRECTION LOGIC
            const isMe =
              m.senderId === viewerId ||
              m.isOptimistic === true;

            return (
              <div
                key={m.id}
                className={`flex w-full ${
                  isMe ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[85%] flex flex-col ${
                    isMe ? "items-end" : "items-start"
                  }`}
                >
                  <div
                    className={`px-4 py-2.5 rounded-2xl text-[13px] font-medium leading-snug shadow-sm ${
                      isMe
                        ? "bg-blue-600 text-white rounded-tr-none"
                        : "bg-white text-slate-700 border border-slate-200 rounded-tl-none"
                    }`}
                  >
                    {m.content}
                  </div>

                  <div className="mt-1.5 flex items-center gap-1.5 px-1 opacity-40">
                    <span className="text-[9px] font-bold uppercase tracking-tighter">
                      {new Date(m.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </span>
                    {isMe && (
                      <CheckCheck size={12} className="text-blue-500" />
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* INPUT */}
      <form
        onSubmit={handleSubmit}
        className="p-4 bg-white border-t border-slate-100 flex items-center gap-3"
      >
        <input
          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-blue-400 focus:bg-white transition-all placeholder:text-slate-300"
          placeholder="Instruction..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />

        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="bg-slate-900 text-white p-3 rounded-xl hover:bg-blue-600 transition-all disabled:opacity-30 flex items-center justify-center shadow-md shadow-slate-100"
        >
          {loading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Send size={18} />
          )}
        </button>
      </form>
    </div>
  );
}
