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

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await fetch("/api/activity-log?limit=10");
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const text = await response.text();
        if (!text) {
          console.warn("Empty response from activity log API");
          setActivities([]);
          return;
        }
        const data = JSON.parse(text);
        if (data.success && Array.isArray(data.data)) {
          setActivities(data.data);
        } else {
          setActivities([]);
        }
      } catch (error) {
        console.error("Failed to fetch activity log:", error);
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
    <div className="bg-white border border-slate-200 h-full flex flex-col">
      <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50">
        <div className="flex items-center gap-2">
          <Activity size={14} className="text-slate-600" />
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
            Recent Activity
          </h3>
        </div>
        <Link 
          href="/dashboard/activity-log"
          className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
        >
          View All <ChevronRight size={12} />
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-6 h-6 border-2 border-slate-200 border-t-slate-600 rounded-full mx-auto mb-2"></div>
            <p className="text-xs text-slate-400">Loading...</p>
          </div>
        ) : activities.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="px-4 py-3 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="pt-0.5">
                    <div className="w-7 h-7 rounded bg-slate-100 flex items-center justify-center">
                      <User size={14} className="text-slate-500" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-xs font-semibold text-slate-900 truncate">
                        {activity.userName}
                      </p>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${getActionColor(
                          activity.action
                        )}`}
                      >
                        {activity.action.replace(/_/g, " ")}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-snug line-clamp-2">
                      {activity.description}
                    </p>
                    <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-400">
                      <Clock size={10} />
                      {formatTime(activity.createdAt)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <Activity size={32} className="text-slate-200 mx-auto mb-2" />
            <p className="text-xs text-slate-400">No recent activity</p>
          </div>
        )}
      </div>
    </div>
  );
}
