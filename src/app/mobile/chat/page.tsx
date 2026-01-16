"use client";

import React, { useState, useEffect, useRef } from "react";
import { Send, Image, Mic, Phone, Video, PhoneOff, MicOff, Volume2, AlertCircle } from "lucide-react";

export default function MobileChat() {
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  
  // --- CALL STATE ---
  const [callStatus, setCallStatus] = useState<'NONE' | 'DIALING' | 'CONNECTED'>('NONE');
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [micError, setMicError] = useState(""); // Track permission errors
  const scrollRef = useRef<HTMLDivElement>(null);

  // --- MOCK CHAT HISTORY ---
  const [chatHistory, setChatHistory] = useState([
    { id: 1, sender: "ADMIN", text: "Kojo, please confirm when stock for the 55-inch OLED arrives.", time: "09:15 AM" },
    { id: 2, sender: "ME", text: "Sure, the truck just pulled in. Offloading now.", time: "09:17 AM" },
  ]);

  // --- CALL TIMER ---
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (callStatus === 'CONNECTED') {
      timer = setInterval(() => setCallDuration(prev => prev + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [callStatus]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 🎤 REAL MICROPHONE ACCESS LOGIC
  const startCall = async () => {
    setMicError("");
    setCallStatus('DIALING');

    try {
      // This line triggers the browser's "Allow Microphone?" popup
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // If allowed, we simulate the connection success
      setTimeout(() => {
        setCallStatus('CONNECTED');
        // In a real app, we would send this 'stream' to the server here.
      }, 2000);

    } catch (err) {
      // If denied or no mic found
      console.error("Mic Access Denied", err);
      setCallStatus('NONE');
      setMicError("Microphone access denied. Check settings.");
      
      // Clear error after 3 seconds
      setTimeout(() => setMicError(""), 3000);
    }
  };

  const endCall = () => {
    setCallStatus('NONE');
    setCallDuration(0);
    setMicError("");
  };

  // --- CHAT SEND LOGIC ---
  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    const newMsg = { id: Date.now(), sender: "ME", text: message, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setChatHistory(prev => [...prev, newMsg]);
    setMessage("");
    setTimeout(() => setIsTyping(true), 1000);
    setTimeout(() => {
      setIsTyping(false);
      setChatHistory(prev => [...prev, { id: Date.now() + 1, sender: "ADMIN", text: "Copy that. Logged in system.", time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    }, 3500);
  };

  // --- CALL SCREEN OVERLAY ---
  if (callStatus !== 'NONE') {
    return (
      <div className="fixed inset-0 z-[100] bg-slate-900 flex flex-col items-center justify-between py-20 text-white animate-in slide-in-from-bottom duration-300">
        <div className="flex flex-col items-center">
          <div className="w-24 h-24 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-3xl font-black shadow-[0_0_50px_rgba(59,130,246,0.5)] mb-6 animate-pulse">
            HQ
          </div>
          <h2 className="text-2xl font-black tracking-tight">Nexus HQ Command</h2>
          <p className="text-sm font-bold text-blue-300 mt-2 uppercase tracking-widest">
            {callStatus === 'DIALING' ? "Secure Link Establishing..." : formatTime(callDuration)}
          </p>
          
          {callStatus === 'CONNECTED' && (
             <div className="flex items-center gap-1 mt-8 h-8">
               {[1,2,3,4,5,4,3,2,1].map((i) => (
                 <div key={Math.random()} className="w-1 bg-white/50 rounded-full animate-pulse" style={{ height: `${i * 20}%`, animationDuration: '0.5s' }} />
               ))}
             </div>
          )}
        </div>

        <div className="flex items-center gap-6">
           <button onClick={() => setIsMuted(!isMuted)} className={`p-4 rounded-full transition-all ${isMuted ? "bg-white text-slate-900" : "bg-white/10 text-white"}`}>
             {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
           </button>
           <button onClick={endCall} className="p-6 bg-red-500 rounded-full shadow-[0_0_30px_rgba(239,68,68,0.4)] hover:bg-red-600 active:scale-90 transition-all">
             <PhoneOff className="w-8 h-8 fill-white" />
           </button>
           <button className={`p-4 rounded-full transition-all bg-white/10 text-white opacity-50`}>
             <Volume2 className="w-6 h-6" />
           </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-slate-50 relative">
      
      {/* ERROR TOAST (If Mic Denied) */}
      {micError && (
        <div className="absolute top-4 left-4 right-4 bg-red-500 text-white text-xs font-bold p-3 rounded-xl flex items-center gap-2 shadow-lg animate-in slide-in-from-top-2 z-50">
          <AlertCircle className="w-4 h-4" /> {micError}
        </div>
      )}

      {/* CHAT HEADER */}
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-black text-xs">
              HQ
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-slate-50 rounded-full animate-pulse"></span>
          </div>
          <div>
            <h1 className="text-sm font-black text-slate-900">Nexus HQ</h1>
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide">Online</p>
          </div>
        </div>
        <div className="flex gap-2">
           <button onClick={startCall} className="p-3 bg-white border border-slate-200 rounded-xl text-blue-600 shadow-sm active:scale-90 transition-all">
             <Phone className="w-5 h-5 fill-blue-600/10" />
           </button>
           <button className="p-3 bg-white border border-slate-200 rounded-xl text-blue-600 shadow-sm active:scale-90 transition-all opacity-50">
             <Video className="w-5 h-5" />
           </button>
        </div>
      </div>

      {/* MESSAGES */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pr-2 pb-4 scrollbar-hide">
        <div className="flex justify-center my-4">
           <span className="bg-slate-200 text-slate-500 text-[9px] font-bold uppercase px-3 py-1 rounded-full">Today</span>
        </div>
        {chatHistory.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'ME' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[75%] p-4 rounded-2xl text-sm shadow-sm relative ${
              msg.sender === 'ME' 
                ? 'bg-blue-600 text-white rounded-tr-none' 
                : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
            }`}>
              <p className="mb-1 leading-relaxed">{msg.text}</p>
              <p className={`text-[9px] font-bold text-right ${msg.sender === 'ME' ? 'text-blue-200' : 'text-slate-400'}`}>
                {msg.time}
              </p>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 p-4 rounded-2xl rounded-tl-none flex gap-1">
              <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
              <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100"></span>
              <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200"></span>
            </div>
          </div>
        )}
      </div>

      {/* INPUT */}
      <form onSubmit={handleSend} className="mt-4 flex items-center gap-2 bg-white p-2 rounded-full border border-slate-200 shadow-lg">
        <button type="button" className="p-2 text-slate-400 hover:text-blue-600">
           <Image className="w-5 h-5" />
        </button>
        <input 
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type message..."
          className="flex-1 bg-transparent text-sm font-bold text-slate-900 placeholder:text-slate-400 outline-none"
        />
        <button type="submit" className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-md active:scale-90 transition-transform">
           <Send className="w-4 h-4 ml-0.5" />
        </button>
      </form>
    </div>
  );
}