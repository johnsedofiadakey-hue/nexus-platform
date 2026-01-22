"use client";

import React from "react";

interface Props {
  reps?: any[];
  shops?: any[];
}

export default function NodeLiveMap({ reps = [], shops = [] }: Props) {
  return (
    <div className="h-full w-full flex items-center justify-center text-slate-400 bg-slate-50">
      <div className="text-center">
        <div className="text-sm font-black uppercase tracking-widest">NodeLiveMap (placeholder)</div>
        <div className="text-xs text-slate-500 mt-2">Interactive map component not present — using lightweight placeholder to allow build.</div>
        <div className="mt-4 text-[10px] text-slate-400">Reps: {reps.length} · Shops: {shops.length}</div>
      </div>
    </div>
  );
}
