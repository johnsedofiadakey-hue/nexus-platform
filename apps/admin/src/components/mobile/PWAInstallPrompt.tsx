"use client";

import { useEffect, useState } from "react";
import { X, Download, Smartphone } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showPrompt, setShowPrompt] = useState(false);

    useEffect(() => {
        if (window.matchMedia('(display-mode: standalone)').matches) return;

        const dismissed = localStorage.getItem('pwa-install-dismissed');
        if (dismissed) {
            const dismissedTime = parseInt(dismissed, 10);
            const daysSince = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
            if (daysSince < 7) return;
        }

        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            setTimeout(() => setShowPrompt(true), 5000);
        };

        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') console.log('✅ PWA installed');
        setDeferredPrompt(null);
        setShowPrompt(false);
    };

    const handleDismiss = () => {
        localStorage.setItem('pwa-install-dismissed', Date.now().toString());
        setShowPrompt(false);
    };

    if (!showPrompt || !deferredPrompt) return null;

    return (
        <div className="fixed bottom-20 left-4 right-4 z-50 animate-in slide-in-from-bottom-4 duration-300">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl shadow-2xl p-4 text-white">
                <button onClick={handleDismiss} className="absolute top-2 right-2 p-1 hover:bg-white/20 rounded-full transition-colors">
                    <X className="w-4 h-4" />
                </button>
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Smartphone className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-black text-sm mb-1">Install Nexus POS</h3>
                        <p className="text-xs text-blue-100 mb-3">Add to home screen for instant access & offline mode</p>
                        <button onClick={handleInstall} className="w-full bg-white text-blue-600 font-bold text-sm py-2.5 px-4 rounded-xl hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 shadow-lg">
                            <Download className="w-4 h-4" /> Install App
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
