"use client";

import React from "react";
import { Target, TrendingUp, DollarSign, Package, Calendar, Award } from "lucide-react";

interface MobileTargetViewProps {
  targetProgress: {
    targetValue: number;
    targetQuantity: number;
    achievedValue: number;
    achievedQuantity: number;
  } | null;
  themeClasses: {
    card: string;
    border: string;
    text: string;
  };
  accent: string;
}

const getColorHex = (color: string) => {
  const colors: Record<string, string> = {
    blue: "#2563eb",
    purple: "#9333ea",
    rose: "#e11d48",
    amber: "#d97706"
  };
  return colors[color] || colors.blue;
};

export default function MobileTargetView({ targetProgress, themeClasses, accent }: MobileTargetViewProps) {
  if (!targetProgress) {
    return (
      <div className={`p-12 border text-center ${themeClasses.card} ${themeClasses.border}`}>
        <div
          className="w-16 h-16 mx-auto mb-4 flex items-center justify-center border"
          style={{ backgroundColor: `${getColorHex(accent)}20`, color: getColorHex(accent), borderColor: `${getColorHex(accent)}40` }}
        >
          <Target className="w-8 h-8" />
        </div>
        <h3 className={`text-sm font-black uppercase tracking-widest ${themeClasses.text}`}>No Active Target</h3>
        <p className="text-xs text-slate-500 font-medium mt-2">Your manager has not set a target yet</p>
      </div>
    );
  }

  const { targetValue, targetQuantity, achievedValue, achievedQuantity } = targetProgress;
  
  const valueProgress = targetValue > 0 && achievedValue != null
    ? Math.min((achievedValue / targetValue) * 100, 100)
    : 0;
  const quantityProgress = targetQuantity > 0 && achievedQuantity != null
    ? Math.min((achievedQuantity / targetQuantity) * 100, 100)
    : 0;
  const overallProgress = (valueProgress + quantityProgress) / 2;

  return (
    <div className="space-y-4">
      {/* Achievement Status Card */}
      <div
        className={`p-6 border ${themeClasses.card} ${themeClasses.border}`}
        style={{
          background: overallProgress >= 100 
            ? `linear-gradient(135deg, ${getColorHex(accent)}10 0%, ${getColorHex(accent)}05 100%)`
            : undefined
        }}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 flex items-center justify-center border"
              style={{ backgroundColor: `${getColorHex(accent)}`, color: 'white', borderColor: `${getColorHex(accent)}` }}
            >
              {overallProgress >= 100 ? <Award className="w-6 h-6" /> : <Target className="w-6 h-6" />}
            </div>
            <div>
              <h3 className={`text-lg font-black ${themeClasses.text}`}>
                {overallProgress >= 100 ? 'Target Achieved!' : 'Active Target'}
              </h3>
              <p className="text-xs text-slate-500 font-medium">Performance Tracking</p>
            </div>
          </div>
          <div
            className="text-3xl font-black"
            style={{ color: getColorHex(accent) }}
          >
            {(overallProgress || 0).toFixed(0)}%
          </div>
        </div>

        {/* Overall Progress Bar */}
        <div className="h-3 bg-slate-100 dark:bg-slate-700 overflow-hidden mb-6">
          <div
            className="h-full transition-all duration-500"
            style={{
              width: `${overallProgress}%`,
              backgroundColor: getColorHex(accent)
            }}
          />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/50 dark:bg-slate-800/50 p-4 border border-slate-200/50 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign size={16} className="text-emerald-600" />
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Revenue</p>
            </div>
            <p className={`text-xl font-black ${themeClasses.text}`}>
              ₵{achievedValue.toLocaleString()}
            </p>
            <p className="text-xs text-slate-400 font-medium mt-1">
              of ₵{targetValue.toLocaleString()}
            </p>
          </div>

          <div className="bg-white/50 dark:bg-slate-800/50 p-4 border border-slate-200/50 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <Package size={16} className="text-blue-600" />
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Units Sold</p>
            </div>
            <p className={`text-xl font-black ${themeClasses.text}`}>
              {achievedQuantity}
            </p>
            <p className="text-xs text-slate-400 font-medium mt-1">
              of {targetQuantity} units
            </p>
          </div>
        </div>
      </div>

      {/* Detailed Progress Cards */}
      <div className="space-y-3">
        {/* Revenue Progress */}
        <div className={`p-4 border ${themeClasses.card} ${themeClasses.border}`}>
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <DollarSign size={14} className="text-emerald-600" />
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Sales Target</p>
            </div>
            <p
              className="text-sm font-black"
              style={{ color: valueProgress >= 100 ? '#10b981' : valueProgress >= 50 ? '#f59e0b' : '#64748b' }}
            >
              {(valueProgress || 0).toFixed(1)}%
            </p>
          </div>
          <div className="h-2 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 overflow-hidden">
            <div
              className="h-full transition-all duration-500"
              style={{
                width: `${valueProgress}%`,
                backgroundColor: valueProgress >= 100 ? '#10b981' : valueProgress >= 50 ? '#f59e0b' : '#94a3b8'
              }}
            />
          </div>
        </div>

        {/* Quantity Progress */}
        <div className={`p-4 border ${themeClasses.card} ${themeClasses.border}`}>
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <Package size={14} className="text-blue-600" />
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Volume Target</p>
            </div>
            <p
              className="text-sm font-black"
              style={{ color: quantityProgress >= 100 ? '#10b981' : quantityProgress >= 50 ? '#f59e0b' : '#64748b' }}
            >
              {(quantityProgress || 0).toFixed(1)}%
            </p>
          </div>
          <div className="h-2 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 overflow-hidden">
            <div
              className="h-full transition-all duration-500"
              style={{
                width: `${quantityProgress}%`,
                backgroundColor: quantityProgress >= 100 ? '#10b981' : quantityProgress >= 50 ? '#f59e0b' : '#94a3b8'
              }}
            />
          </div>
        </div>
      </div>

      {/* Motivational Message */}
      <div
        className={`p-4 border ${themeClasses.card} ${themeClasses.border} text-center`}
        style={{ 
          backgroundColor: overallProgress >= 100 
            ? `${getColorHex(accent)}10`
            : overallProgress >= 75
            ? '#fef3c7'
            : undefined 
        }}
      >
        <p className="text-xs font-bold text-slate-600">
          {overallProgress >= 100 ? (
            <>🎉 Outstanding! You've exceeded your target!</>
          ) : overallProgress >= 75 ? (
            <>🔥 Almost there! Keep pushing!</>
          ) : overallProgress >= 50 ? (
            <>💪 Great progress! You're halfway to your goal!</>
          ) : (
            <>🚀 Let's get started! You've got this!</>
          )}
        </p>
      </div>
    </div>
  );
}
