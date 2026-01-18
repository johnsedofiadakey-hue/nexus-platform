"use client";

import React, { useState, useEffect, useRef } from "react";
import { Send, ArrowLeft, ShieldCheck, Loader2 } from "lucide-react";
import Link from "next/link";

export default function MobileChat() {
  // --- STATE ---
  // We separate confirmed messages (from DB) and pending messages (local)
  // to prevent the "disappearing" bug during polling.
  const [serverMessages, setServerMessages] = useState<any[]>([]);
  const [pendingMessages, setPendingMessages] = useState<any[]>([]);
  
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  // --- 1. LIVE POLLING ---
  useEffect(() => {
    fetchMessages(); // Initial fetch
    const interval = setInterval(fetchMessages, 3000); // Poll every 3s
    return () => clearInterval(interval);
  }, []);

  const fetchMessages = async () => {
    try {
      const res = await fetch("/api/messages?t=" + Date.now()); 
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setServerMessages(data);
          setLoading(false);
        }
      }
    } catch (e) {
      console.error("Sync Error");
    }
  };

  // --- 2. AUTO SCROLL ---
  // Combine lists for rendering view
  const allMessages = [...serverMessages, ...pendingMessages];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [allMessages.length]); // Scroll only when count changes

  // --- 3. SEND MESSAGE ---
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const tempText = inputText;
    setInputText(""); // Clear input
    setSending(true);

    // 1. Create a Pending Message
    const tempId = "temp-" + Date.now();
    const tempMsg = { 
        id: tempId, 
        content: tempText, 
        isMe: true, // Always right side
        senderId: "ME_MOBILE",
        createdAt: new Date().toISOString(),
        isPending: true // Tag it
    };
    
    // Add to pending queue immediately
    setPendingMessages(prev => [...prev, tempMsg]);

    try {
      // 2. Send to API
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          content: tempText,
          receiverId: "admin-hq-id" 
        })
      });

      if (res.ok) {
        // 3. Success: Remove from pending and fetch real update
        setPendingMessages(prev => prev.filter(m => m.id !== tempId));
        fetchMessages(); 
      } else {
        throw new Error("Send failed");
      }

    } catch (e) {
      alert("Failed to send. Please retry.");
      // If failed, keep it in pending or remove? 
      // For now, remove it so they can try again, or restore text
      setPendingMessages(prev => prev.filter(m => m.id !== tempId));
      setInputText(tempText);
    } finally {
      setSending(false);
    }
  };

  // --- LOADING VIEW ---
  if (loading && serverMessages.length === 0) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <Loader2 className="animate-spin text-blue-600 w-8 h-8"/>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Connecting to HQ...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans text-slate-900">
      
      {/* HEADER */}
      <div className="bg-white p-4 shadow-sm border-b border-slate-200 flex items-center gap-4 sticky top-0 z-10">
        <Link href="/mobile" className="p-2 -ml-2 text-slate-400 hover:text-slate-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
           <h1 className="text-sm font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
             <ShieldCheck className="w-4 h-4 text-blue-600" /> HQ Dispatch
           </h1>
           <p className="text-[10px] font-bold text-emerald-500 animate-pulse">● Live Connection</p>
        </div>
      </div>

      {/* CHAT AREA */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 pb-20">
        {allMessages.length === 0 ? (
           <div className="flex flex-col items-center justify-center h-full text-slate-400 opacity-50">
             <p className="font-bold text-xs uppercase tracking-widest">No messages yet</p>
           </div>
        ) : (
          allMessages.map((msg) => {
            // Logic: isMe (Right) vs Admin (Left)
            const isMe = msg.isMe || msg.isPending; 
            
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                 <div className={`max-w-[80%] p-3 rounded-2xl text-sm font-medium shadow-sm transition-opacity ${
                   isMe 
                   ? "bg-blue-600 text-white rounded-tr-none" 
                   : "bg-white border border-slate-200 text-slate-800 rounded-tl-none"
                 } ${msg.isPending ? 'opacity-70' : 'opacity-100'}`}>
                   
                   <p className="mb-1">{msg.content}</p>
                   
                   <div className="flex items-center justify-end gap-1">
                     {msg.isPending && <Loader2 className="w-2 h-2 animate-spin text-white" />}
                     <p className={`text-[9px] text-right ${isMe ? 'text-blue-100' : 'text-slate-400'}`}>
                       {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                     </p>
                   </div>

                 </div>
              </div>
            );
          })
        )}
      </div>

      {/* INPUT AREA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200">
         <form onSubmit={handleSend} className="flex gap-2">
            <input 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Report to HQ..."
              className="flex-1 bg-slate-100 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
            <button 
              disabled={sending}
              className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50 shadow-lg shadow-blue-200"
            >
              {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
         </form>
      </div>

    </div>
  );
}