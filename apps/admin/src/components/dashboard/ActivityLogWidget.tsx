"use client";

import React, { useState, useEffect } from "react";
import { Activity, User, Clock, ChevronRight } from "lucide-react";
import Link from "next/link";

interface ActivityItem {
  id: string;
  userName: string;
  action: string;
  description: string;
  createdAt: string;
  entity: string;
}

export default function ActivityLogWidget() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  const formatErrorMessage = (errorPayload: unknown, status: number) => {
    if (typeof errorPayload === "string") return errorPayload;

    if (errorPayload && typeof errorPayload === "object") {
      const maybeError = (errorPayload as { error?: { message?: string } }).error;
      if (maybeError?.message) return maybeError.message;
    }

    return `HTTP ${status}`;
  };

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await fetch("/api/activity-log?limit=10");
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(formatErrorMessage(payload?.error ?? payload, response.status));
        }

        const rows = payload?.data?.data ?? payload?.data;

        if (Array.isArray(rows)) {
          setActivities(rows);
        } else {
          setActivities([]);
        }
      } catch (error: any) {
        console.error("❌ Failed to fetch activity log:", error?.message || String(error));
        setActivities([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
    const interval = setInterval(fetchLogs, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const getActionColor = (action: string) => {
    if (action.includes("CREATED")) return "text-emerald-600 bg-emerald-50";
    if (action.includes("UPDATED")) return "text-blue-600 bg-blue-50";
    if (action.includes("DELETED")) return "text-red-600 bg-red-50";
    return "text-slate-600 bg-slate-50";
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 60000); // minutes

    if (diff < 1) return "Just now";
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="bg-white border border-slate-200 h-full flex flex-col rounded-[2.5rem] overflow-hidden shadow-sm">
      <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100">
            <Activity size={16} className="text-slate-600" />
          </div>
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">
            Recent Activity
          </h3>
        </div>
        <Link
          href="/dashboard/activity-log"
          className="text-[10px] text-blue-600 hover:text-blue-700 font-black uppercase tracking-widest flex items-center gap-1 transition-colors"
        >
          View All <ChevronRight size={14} />
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-slate-200 border-t-blue-600 rounded-full mx-auto mb-4"></div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Acquiring Stream...</p>
          </div>
        ) : activities.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="px-6 py-4 hover:bg-slate-50/80 transition-all group"
              >
                <div className="flex items-start gap-4">
                  <div className="pt-0.5">
                    <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center border border-white shadow-sm group-hover:bg-white group-hover:scale-110 transition-all duration-300">
                      <User size={18} className="text-slate-400" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-xs font-black text-slate-900 truncate">
                        {activity.userName}
                      </p>
                      <span
                        className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase border ${getActionColor(
                          activity.action
                        )}`}
                      >
                        {activity.action.replace(/_/g, " ")}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-2 font-medium">
                      {activity.description}
                    </p>
                    <div className="flex items-center gap-1.5 mt-2.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                      <Clock size={12} />
                      {formatTime(activity.createdAt)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center flex flex-col items-center justify-center h-full">
            <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center mb-4 border border-slate-100">
              <Activity size={32} className="text-slate-200" />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No Activity Recorded</p>
          </div>
        )}
      </div>
    </div>
  );
}
