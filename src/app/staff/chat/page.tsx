"use client";

import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Send, User, CheckCheck } from 'lucide-react';

export default function StaffChat() {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. Setup Realtime Listener
  useEffect(() => {
    const channel = supabase
      .channel('nexus-ops-chat')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ChatMessage' }, (payload) => {
        setMessages((prev) => [...prev, payload.new]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    // In Nexus, we log senderId and receiverId (Admin)
    await supabase.from('ChatMessage').insert([
      { content: newMessage, senderId: 'STAFF_ID', receiverId: 'ADMIN_ID' }
    ]);
    setNewMessage("");
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      <header className="p-4 bg-white border-b border-slate-100 flex items-center gap-4">
        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
          <User size={20} />
        </div>
        <div>
          <h2 className="font-black text-slate-800">Admin Support</h2>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-bold text-slate-400">HQ ONLINE</span>
          </div>
        </div>
      </header>

      {/* Message Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.senderId === 'STAFF_ID' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-4 rounded-3xl shadow-sm ${
              msg.senderId === 'STAFF_ID' 
                ? 'bg-blue-600 text-white rounded-tr-none' 
                : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'
            }`}>
              <p className="text-sm font-medium">{msg.content}</p>
              <div className="flex justify-end items-center gap-1 mt-1 opacity-50">
                <span className="text-[8px] font-bold uppercase">{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                {msg.senderId === 'STAFF_ID' && <CheckCheck size={10} />}
              </div>
            </div>
          </div>
        ))}
        <div ref={scrollRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-100 pb-10">
        <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-200">
          <input 
            className="flex-1 bg-transparent px-4 py-2 focus:outline-none text-sm"
            placeholder="Type operational message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          />
          <button 
            onClick={sendMessage}
            className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 transition-colors"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}