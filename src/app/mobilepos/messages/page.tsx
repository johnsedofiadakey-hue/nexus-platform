"use client";

import React, { useState, useEffect, useRef } from "react";
import { Send, ArrowLeft, Loader2, User, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function MobileChat() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // --- 1. SYNC MESSAGES ---
  const fetchMessages = async () => {
    try {
      const res = await fetch("/api/mobile/messages");
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (error) {
      console.error("Chat Sync Error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000); // Poll every 3 seconds for live feel
    return () => clearInterval(interval);
  }, []);

  // Scroll to bottom on new message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // --- 2. SEND MESSAGE ---
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const tempMsg = {
      id: "temp-" + Date.now(),
      content: input,
      senderId: "me", // Temporary ID for UI
      createdAt: new Date().toISOString(),
      pending: true
    };

    // Optimistic UI Update
    setMessages(prev => [...prev, tempMsg]);
    setInput("");
    setSending(true);

    try {
      await fetch("/api/mobile/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: tempMsg.content })
      });
      await fetchMessages(); // Refresh to get real ID
    } catch (e) {
      alert("Failed to send");
    } finally {
      setSending(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-slate-100 font-sans">
      
      {/* HEADER */}
      <div className="bg-white p-4 flex items-center gap-3 shadow-sm border-b border-slate-200 sticky top-0 z-10">
        <Link href="/mobilepos" className="p-2 bg-slate-50 rounded-full text-slate-500 hover:bg-slate-100">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-blue-200">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-black text-slate-900 uppercase tracking-wide">Nexus HQ</h1>
            <div className="flex items-center gap-1.5">
               <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Support Online</span>
            </div>
          </div>
        </div>
      </div>

      {/* CHAT AREA */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-10 opacity-40">
            <p className="text-xs font-bold text-slate-400">No messages yet.</p>
            <p className="text-[10px] text-slate-300">Start the conversation with HQ.</p>
          </div>
        )}

        {messages.map((msg, i) => {
          // Check if message is from "Me" (Assuming the current user sends it)
          // NOTE: In the API response, we need to check if senderId matches current user ID. 
          // For simplicity in this view, we can check if the sender role is NOT admin, or pass the current ID.
          // Since we didn't pass current ID in props, let's infer: If role is ADMIN, it's incoming. If not, it's me.
          // Better logic: The API sends `senderId`. We assume the client knows their ID, or we guess based on role.
          
          const isIncoming = msg.sender?.role === 'ADMIN'; 
          
          return (
            <div key={msg.id} className={`flex w-full ${isIncoming ? 'justify-start' : 'justify-end'}`}>
              <div className={`max-w-[75%] p-4 rounded-2xl text-sm font-medium shadow-sm leading-relaxed ${
                isIncoming 
                  ? 'bg-white text-slate-700 rounded-tl-none border border-slate-200' 
                  : 'bg-blue-600 text-white rounded-br-none shadow-blue-200'
              }`}>
                {msg.content}
                <div className={`text-[9px] font-bold uppercase mt-1 text-right ${isIncoming ? 'text-slate-300' : 'text-blue-200'}`}>
                   {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* INPUT BAR */}
      <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-200 flex gap-2">
        <input 
          className="flex-1 bg-slate-100 rounded-full px-5 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-400 text-slate-900"
          placeholder="Type a message..."
          value={input}
          onChange={e => setInput(e.target.value)}
        />
        <button 
          disabled={!input.trim() || sending}
          className="w-12 h-12 bg-slate-900 text-white rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform disabled:opacity-50"
        >
          {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
        </button>
      </form>

    </div>
  );
}