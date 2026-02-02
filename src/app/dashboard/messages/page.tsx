"use client";

import React, { useState, useEffect, useRef } from "react";
import {
    Send, Search, User, MoreVertical, Phone, Video,
    Paperclip, Mic, Image as ImageIcon, Loader2
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useSession } from "next-auth/react";

export default function MessagingPage() {
    const { data: session } = useSession();
    const [agents, setAgents] = useState<any[]>([]);
    const [activeChatId, setActiveChatId] = useState<string | null>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [inputText, setInputText] = useState("");
    const [loadingAgents, setLoadingAgents] = useState(true);

    const bottomRef = useRef<HTMLDivElement>(null);

    // 1. Fetch Agents for Sidebar
    useEffect(() => {
        async function fetchAgents() {
            try {
                const res = await fetch('/api/dashboard/agents'); // Reuse existing endpoint
                if (res.ok) setAgents(await res.json());
            } finally {
                setLoadingAgents(false);
            }
        }
        fetchAgents();
    }, []);

    // 2. Poll Messages for Active Chat
    useEffect(() => {
        if (!activeChatId) return;

        const fetchMessages = async () => {
            try {
                const res = await fetch(`/api/messages?userId=${activeChatId}`);
                if (res.ok) setMessages(await res.json());
            } catch (e) {
                console.error("Poll failed", e);
            }
        };

        fetchMessages(); // Initial load
        const interval = setInterval(fetchMessages, 3000); // Poll every 3s
        return () => clearInterval(interval);
    }, [activeChatId]);

    // 3. Scroll to bottom on new message
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!inputText.trim() || !activeChatId) return;

        const tempId = Date.now().toString();
        const tempMsg = {
            id: tempId,
            content: inputText,
            senderId: session?.user?.id,
            createdAt: new Date().toISOString(),
            pending: true
        };

        // Optimistic UI
        setMessages(prev => [...prev, tempMsg]);
        setInputText("");

        try {
            const res = await fetch('/api/messages', {
                method: 'POST',
                body: JSON.stringify({
                    receiverId: activeChatId,
                    content: tempMsg.content
                })
            });

            if (!res.ok) throw new Error("Failed");
        } catch (e) {
            // Revert or show error (Todo)
            console.error("Send failed");
        }
    };

    const activeAgent = agents.find(a => a.id === activeChatId);

    return (
        <div className="flex h-[calc(100vh-80px)] bg-slate-50 overflow-hidden">

            {/* --- SIDEBAR: AGENT LIST --- */}
            <div className="w-80 md:w-96 bg-white border-r border-slate-200 flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                    <h2 className="text-lg font-black text-slate-900 mb-4">Messages</h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 text-slate-400 w-4 h-4" />
                        <input
                            placeholder="Search chats..."
                            className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100"
                        />
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {loadingAgents ? (
                        <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-slate-400" /></div>
                    ) : agents.map(agent => (
                        <div
                            key={agent.id}
                            onClick={() => setActiveChatId(agent.id)}
                            className={`p-4 flex items-center gap-3 cursor-pointer transition-colors border-b border-slate-50 hover:bg-slate-50 ${activeChatId === agent.id ? 'bg-blue-50/50' : ''}`}
                        >
                            <div className="relative">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-black uppercase ${agent.isOnline ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                                    {agent.name.charAt(0)}
                                </div>
                                {agent.isOnline && <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center mb-0.5">
                                    <h3 className="font-bold text-slate-900 truncate">{agent.name}</h3>
                                    {/* <span className="text-[10px] text-slate-400 font-medium">12:30 PM</span> */}
                                </div>
                                <p className="text-xs text-slate-500 truncate font-medium">
                                    {agent.shopName} • {agent.role}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* --- MAIN: CHAT WINDOW --- */}
            <div className="flex-1 flex flex-col bg-[#e5ddd5] relative">
                {/* WhatsApp-like Background Pattern */}
                <div className="absolute inset-0 opacity-[0.06] pointer-events-none"
                    style={{ backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")' }}
                />

                {activeChatId ? (
                    <>
                        {/* Chat Header */}
                        <header className="bg-slate-50/90 backdrop-blur border-b border-slate-200 p-3 px-6 flex justify-between items-center z-10 sticky top-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-black text-slate-500">
                                    {activeAgent?.name.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900">{activeAgent?.name}</h3>
                                    <p className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                                        {activeAgent?.isOnline ? 'Online' : `Last seen ${activeAgent?.lastSeen ? formatDistanceToNow(new Date(activeAgent.lastSeen)) + ' ago' : 'Offline'}`}
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-4 text-slate-400">
                                <Phone className="hover:text-slate-600 cursor-pointer" size={20} />
                                <Video className="hover:text-slate-600 cursor-pointer" size={20} />
                                <MoreVertical className="hover:text-slate-600 cursor-pointer" size={20} />
                            </div>
                        </header>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-6 z-0 space-y-4">
                            {messages.map((msg, idx) => {
                                const isMe = msg.senderId === session?.user?.id;
                                return (
                                    <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[70%] p-3 px-4 rounded-xl shadow-sm text-sm font-medium leading-relaxed relative ${isMe
                                                ? 'bg-emerald-500 text-white rounded-tr-none'
                                                : 'bg-white text-slate-800 rounded-tl-none'
                                            }`}>
                                            {msg.content}
                                            <p className={`text-[9px] mt-1 text-right opacity-70 ${isMe ? 'text-emerald-100' : 'text-slate-400'}`}>
                                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                )
                            })}
                            <div ref={bottomRef} />
                        </div>

                        {/* Input Area */}
                        <form onSubmit={handleSend} className="bg-slate-50 p-4 border-t border-slate-200 z-10 flex items-center gap-3">
                            <button type="button" className="text-slate-400 hover:text-slate-600"><Paperclip size={20} /></button>
                            <input
                                value={inputText}
                                onChange={e => setInputText(e.target.value)}
                                placeholder="Type a message..."
                                className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 placeholder-slate-400"
                            />
                            {inputText.trim() ? (
                                <button type="submit" className="p-3 bg-emerald-500 text-white rounded-full hover:bg-emerald-600 transition-all shadow-md">
                                    <Send size={18} className="translate-x-0.5 translate-y-0.5" />
                                </button>
                            ) : (
                                <button type="button" className="p-3 bg-slate-200 text-slate-500 rounded-full">
                                    <Mic size={20} />
                                </button>
                            )}
                        </form>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center opacity-50 z-0">
                        <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mb-4">
                            <Send className="text-slate-400" size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-500">Select a chat to start messaging</h3>
                    </div>
                )}
            </div>

        </div>
    );
}
