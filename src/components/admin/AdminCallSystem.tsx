"use client";

import React, { useState, useEffect } from "react";
import { 
  Phone, PhoneOff, Mic, MicOff, Video, 
  Minimize2, User, MapPin, maximize 
} from "lucide-react";

export default function AdminCallSystem() {
  // STATES: 'IDLE' | 'INCOMING' | 'CONNECTED'
  const [callState, setCallState] = useState<'IDLE' | 'INCOMING' | 'CONNECTED'>('IDLE');
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);

  // MOCK DATA: Simulate an incoming call for testing
  useEffect(() => {
    // 💡 TEST TRIGGER: Press 'C' on your keyboard to simulate an incoming call
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'c' && callState === 'IDLE') {
        setCallState('INCOMING');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [callState]);

  // CALL TIMER
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (callState === 'CONNECTED') {
      timer = setInterval(() => setDuration(prev => prev + 1), 1000);
    } else {
      setDuration(0);
    }
    return () => clearInterval(timer);
  }, [callState]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // --- RENDER 1: IDLE (Hidden) ---
  if (callState === 'IDLE') return null;

  // --- RENDER 2: INCOMING CALL (Ringing) ---
  if (callState === 'INCOMING') {
    return (
      <div className="fixed top-6 right-6 z-[100] animate-in slide-in-from-right-10 fade-in duration-500">
        <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-2xl border border-slate-700 w-80 relative overflow-hidden">
          {/* Animated Background Pulse */}
          <div className="absolute inset-0 bg-emerald-500/10 animate-pulse"></div>
          
          <div className="relative z-10 text-center">
            <div className="w-20 h-20 bg-gradient-to-tr from-emerald-500 to-teal-600 rounded-full mx-auto flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(16,185,129,0.4)] animate-bounce">
              <Phone className="w-8 h-8 text-white fill-white" />
            </div>
            
            <h3 className="text-xl font-black tracking-tight">Incoming Call</h3>
            <p className="text-emerald-400 font-bold text-sm uppercase tracking-widest animate-pulse mb-6">Field Uplink Request</p>

            <div className="bg-slate-800/50 rounded-xl p-3 mb-6 border border-slate-700">
              <div className="flex items-center gap-3 justify-center mb-1">
                <User className="w-4 h-4 text-slate-400" />
                <span className="font-bold text-slate-200">Kojo Bonsu</span>
              </div>
              <div className="flex items-center gap-3 justify-center text-xs">
                <MapPin className="w-3 h-3 text-slate-500" />
                <span className="text-slate-500 uppercase font-bold">Melcom Accra Mall</span>
              </div>
            </div>

            <div className="flex gap-4 justify-center">
              <button 
                onClick={() => setCallState('IDLE')}
                className="w-12 h-12 bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white rounded-full flex items-center justify-center transition-all active:scale-90"
              >
                <PhoneOff className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setCallState('CONNECTED')}
                className="w-16 h-16 bg-emerald-500 hover:bg-emerald-400 text-white rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30 transition-all active:scale-90"
              >
                <Phone className="w-8 h-8 fill-white animate-pulse" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- RENDER 3: ACTIVE CALL (Floating Widget) ---
  return (
    <div className={`fixed z-[100] transition-all duration-500 ease-in-out ${
      isMinimized 
        ? "bottom-6 right-6 w-72" 
        : "bottom-6 right-6 w-96"
    }`}>
      <div className="bg-slate-900 text-white rounded-3xl shadow-2xl border border-slate-700 overflow-hidden">
        
        {/* Header / Draggable Area */}
        <div className="bg-slate-800/50 p-4 flex items-center justify-between border-b border-slate-700 cursor-move">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="font-bold text-xs uppercase tracking-widest text-emerald-400">Live Audio</span>
          </div>
          <button onClick={() => setIsMinimized(!isMinimized)} className="text-slate-400 hover:text-white">
            {isMinimized ? <maximize className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>
        </div>

        {/* Main Content */}
        {!isMinimized && (
          <div className="p-6 text-center">
            <h2 className="text-2xl font-black mb-1">Kojo Bonsu</h2>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-6">Connected • {formatTime(duration)}</p>
            
            {/* Audio Visualizer */}
            <div className="flex justify-center items-center gap-1 h-12 mb-8">
              {[1,2,3,4,5,6,7,6,5,4,3,2,1].map((i) => (
                <div 
                  key={Math.random()} 
                  className="w-1.5 bg-emerald-500 rounded-full animate-pulse" 
                  style={{ 
                    height: `${Math.random() * 100}%`, 
                    animationDuration: `${Math.random() * 0.5 + 0.2}s` 
                  }} 
                />
              ))}
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-6">
               <button 
                 onClick={() => setIsMuted(!isMuted)}
                 className={`p-4 rounded-2xl border transition-all ${
                   isMuted ? "bg-white text-slate-900 border-white" : "bg-transparent text-white border-slate-600 hover:bg-slate-800"
                 }`}
               >
                 {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
               </button>
               
               <button 
                 onClick={() => setCallState('IDLE')}
                 className="p-4 bg-red-500 text-white rounded-2xl shadow-lg shadow-red-500/30 hover:bg-red-400 active:scale-90 transition-all"
               >
                 <PhoneOff className="w-6 h-6 fill-white" />
               </button>

               <button className="p-4 rounded-2xl border border-slate-600 text-slate-400 hover:bg-slate-800 hover:text-white transition-all">
                 <Video className="w-5 h-5" />
               </button>
            </div>
          </div>
        )}

        {/* Minimized View */}
        {isMinimized && (
          <div className="p-4 flex items-center justify-between">
            <div>
               <p className="font-bold text-sm">Kojo B.</p>
               <p className="text-emerald-400 text-[10px] font-bold">{formatTime(duration)}</p>
            </div>
            <button 
               onClick={() => setCallState('IDLE')}
               className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center text-white"
            >
               <PhoneOff className="w-4 h-4" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
}