"use client";

import React, { useState, useEffect, useRef } from "react";
import { Send, MessageSquare, RefreshCw, CheckCheck, Loader2 } from "lucide-react";

export default function ChatConsole({ messages = [], onSendMessage, onRefresh, viewerId, loading }: any) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSendMessage(input);
    setInput("");
  };

  return (
    <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm flex flex-col overflow-hidden h-full min-h-[600px]">
       
       {/* HEADER */}
       <div className="p-6 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
               <MessageSquare className="w-5 h-5" />
             </div>
             <div>
               <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Secure Uplink</h3>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Direct to Agent</p>
             </div>
          </div>
          <button 
            onClick={onRefresh} 
            className="p-2 hover:bg-white rounded-full transition-all border border-transparent hover:border-slate-200"
            title="Refresh Messages"
          >
             <RefreshCw className={`w-4 h-4 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
       </div>

       {/* MESSAGE STREAM */}
       <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30">
          {messages.length === 0 ? (
             <div className="h-full flex flex-col items-center justify-center opacity-30 gap-2">
                <MessageSquare className="w-12 h-12 text-slate-400" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">No Messages Yet</span>
             </div>
          ) : (
            messages.map((m: any) => {
               const isMe = m.senderId === viewerId;
               return (
                  <div key={m.id} className={`flex w-full ${isMe ? "justify-end" : "justify-start"}`}>
                     <div className={`max-w-[80%] flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                        <div className={`px-5 py-3 rounded-2xl text-xs font-medium leading-relaxed shadow-sm ${
                           isMe 
                           ? 'bg-blue-600 text-white rounded-br-none' 
                           : 'bg-white text-slate-700 border border-slate-200 rounded-bl-none'
                        }`}>
                           {m.content}
                        </div>
                        <div className="mt-1 flex items-center gap-1 opacity-50 px-1">
                           <span className="text-[9px] font-bold uppercase">{new Date(m.createdAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                           {isMe && <CheckCheck className="w-3 h-3" />}
                        </div>
                     </div>
                  </div>
               );
            })
          )}
       </div>

       {/* INPUT AREA */}
       <form onSubmit={handleSubmit} className="p-4 bg-white border-t border-slate-100 flex gap-3">
          <input 
             className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-xs font-bold outline-none focus:border-blue-500 transition-all placeholder:text-slate-300 focus:bg-white focus:shadow-sm"
             placeholder="Type message..."
             value={input}
             onChange={e => setInput(e.target.value)}
          />
          <button 
            type="submit" 
            disabled={!input.trim()} 
            className="bg-slate-900 text-white p-4 rounded-2xl hover:bg-black transition-all disabled:opacity-50 shadow-lg shadow-slate-200"
          >
             <Send className="w-5 h-5" />
          </button>
       </form>
    </div>
  );
}