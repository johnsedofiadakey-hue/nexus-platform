"use client";

import React, { useEffect, useState, useRef } from 'react';
import { Send, User, CheckCheck } from 'lucide-react';

export default function StaffChat() {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. Load messages from unified API and poll
  useEffect(() => {
    let mounted = true;
    const fetchMessages = async () => {
      try {
        const res = await fetch('/api/messages?t=' + Date.now());
        const data = await res.json();
        if (!mounted) return;
        setMessages(data);
      } catch (e) {
        console.error('Failed to fetch messages', e);
      }
    };

    let es: EventSource | null = null;
    (async () => {
      // determine myId once
      let myId: string | null = null;
      try {
        const pr = await fetch('/api/user/profile');
        myId = pr.ok ? (await pr.json()).id : null;
      } catch (e) { console.warn('Could not load profile for SSE mapping', e); }

      // open SSE first; fallback to polling if SSE doesn't activate
      let sseActive = false;
      try {
        es = new EventSource('/api/messages/stream');
        es.onmessage = (ev) => {
          sseActive = true;
          try {
            const row = JSON.parse(ev.data);
            const mapped = { id: row.id, content: row.content, senderId: row.sender?.id || row.senderId, createdAt: row.createdAt || row.created_at, isMe: myId ? (row.sender?.id === myId || row.senderId === myId) : false };
            setMessages(prev => prev.some(m => m.id === mapped.id) ? prev : [...prev, mapped]);
          } catch (e) { console.error('SSE parse error', e); }
        };
        es.onerror = (e) => { console.error('SSE error', e); if (es) { es.close(); es = null; } };
      } catch (e) { console.error('SSE connect failed', e); }

      setTimeout(() => {
        if (!sseActive) {
          console.warn('SSE inactive, starting polling');
          fetchMessages();
          const poll = setInterval(fetchMessages, 3000);
          // cleanup of interval handled by outer effect
        }
      }, 2000);
    })();

    return () => { mounted = false; if (es) es.close(); };
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    // Optimistic UI update
    const temp = { id: Date.now(), content: newMessage, senderId: 'ME', createdAt: new Date().toISOString() };
    setMessages(prev => [...prev, temp]);
    setNewMessage('');

    try {
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: temp.content, receiverId: 'admin-hq-id' })
      });
    } catch (e) {
      console.error('Failed to send message', e);
      // Optionally mark message as failed in UI
    }
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
        {messages.map((msg) => (
          <div key={msg.id || msg.createdAt} className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-4 rounded-3xl shadow-sm ${msg.isMe
              ? 'bg-blue-600 text-white rounded-tr-none'
              : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'
              }`}>
              <p className="text-sm font-medium">{msg.content}</p>
              <div className="flex justify-end items-center gap-1 mt-1 opacity-50">
                <span className="text-[8px] font-bold uppercase">{new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                {msg.isMe && <CheckCheck size={10} />}
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