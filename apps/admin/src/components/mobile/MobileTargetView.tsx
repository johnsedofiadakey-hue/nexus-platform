"use client";

import React from "react";
import { Target, DollarSign, Package, Award } from "lucide-react";

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

                <div className="h-3 bg-slate-100 dark:bg-slate-700 overflow-hidden mb-6">
                    <div
                        className="h-full transition-all duration-500"
                        style={{
                            width: `${overallProgress}%`,
                            backgroundColor: getColorHex(accent)
                        }}
                    />
                </div>

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
        </div>
    );
}
