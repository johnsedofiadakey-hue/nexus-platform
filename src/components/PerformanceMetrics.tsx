"use client";

import React from "react";
import { TrendingUp, Target, Award, AlertTriangle } from "lucide-react";

interface PerformanceMetricsProps {
  metrics: {
    salesTarget: number;
    salesAchieved: number;
    attendanceRate: number;
    disciplinaryIncidents: number;
  };
}

export default function PerformanceMetrics({ metrics }: PerformanceMetricsProps) {
  const salesPercentage = metrics.salesTarget > 0 ? (metrics.salesAchieved / metrics.salesTarget) * 100 : 0;

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm mt-8">
      <div className="p-6 border-b border-slate-100 bg-purple-50/30">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-purple-500" /> Performance Metrics
        </h3>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Sales Performance */}
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-4 rounded-lg border border-emerald-200">
            <div className="flex items-center justify-between mb-2">
              <Target className="w-5 h-5 text-emerald-600" />
              <span className="text-xs font-bold text-emerald-700 uppercase">Sales Target</span>
            </div>
            <div className="text-2xl font-black text-emerald-800 mb-1">
              {salesPercentage.toFixed(1)}%
            </div>
            <div className="text-xs text-emerald-600">
              ${metrics.salesAchieved.toLocaleString()} / ${metrics.salesTarget.toLocaleString()}
            </div>
          </div>

          {/* Attendance Rate */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <Award className="w-5 h-5 text-blue-600" />
              <span className="text-xs font-bold text-blue-700 uppercase">Attendance</span>
            </div>
            <div className="text-2xl font-black text-blue-800 mb-1">
              {metrics.attendanceRate.toFixed(1)}%
            </div>
            <div className="text-xs text-blue-600">
              Monthly average
            </div>
          </div>

          {/* Disciplinary Incidents */}
          <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-lg border border-red-200">
            <div className="flex items-center justify-between mb-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <span className="text-xs font-bold text-red-700 uppercase">Incidents</span>
            </div>
            <div className="text-2xl font-black text-red-800 mb-1">
              {metrics.disciplinaryIncidents}
            </div>
            <div className="text-xs text-red-600">
              This month
            </div>
          </div>

          {/* Overall Rating */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              <span className="text-xs font-bold text-purple-700 uppercase">Rating</span>
            </div>
            <div className="text-2xl font-black text-purple-800 mb-1">
              {((salesPercentage + metrics.attendanceRate) / 2).toFixed(1)}%
            </div>
            <div className="text-xs text-purple-600">
              Overall score
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}