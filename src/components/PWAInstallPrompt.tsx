"use client";
import React, { useState, useEffect } from 'react';
import Button from './ui/Button';
// Extend Navigator interface for standalone property
declare global {
  interface Navigator {
    standalone?: boolean;
  }
}
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}
export const PWAInstallPrompt: React.FC = () => {
  // Early return if dismissed recently to prevent flicker
  const lastDismissed = typeof window !== 'undefined' ? localStorage.getItem('pwa-prompt-dismissed') : null;
  if (lastDismissed && Date.now() - parseInt(lastDismissed) < 24 * 60 * 60 * 1000) {
    return null;
  }
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  useEffect(() => {
    // Check if already installed using proper type checking
    if (window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true) {
      setIsInstalled(true);
      return;
    }
    // Store timeout ID to clean up on unmount
    let promptTimeout: NodeJS.Timeout;
    // Listen for the install prompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      setIsInstallable(true);
      // Show prompt after 3 seconds with cleanup capability
      promptTimeout = setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
    };
    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setShowPrompt(false);
      setDeferredPrompt(null);
      if (promptTimeout) {
        clearTimeout(promptTimeout);
      }
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    // Cleanup function to clear timeout and remove listeners
    return () => {
      if (promptTimeout) {
        clearTimeout(promptTimeout);
      }
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);
  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        // Request notification permission ONLY after user accepts install
        if ('Notification' in window && Notification.permission === 'default') {
          Notification.requestPermission();
        }
      } else {
      }
    } catch (error) {
      console.error('Installation error:', error);
    }
    setDeferredPrompt(null);
    setShowPrompt(false);
  };
  const handleDismiss = () => {
    setShowPrompt(false);
    // Show again after 24 hours
    localStorage.setItem('pwa-prompt-dismissed', Date.now().toString());
  };
  // Don't show if already installed or not installable
  if (isInstalled || !isInstallable || !showPrompt) {
    return null;
  }
  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm">
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-4 animate-slide-up">
        <div className="flex items-start gap-3">

          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-1">
              Install Project Aqua
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              प्रोजेक्ट अक्वा को अपने फोन में इंस्टॉल करें। ऑफलाइन उपयोग, तेज़ लोडिंग और पुश नोटिफिकेशन पाएं।
            </p>
            <p className="text-xs text-gray-500 mb-3">
              Install for offline access, faster loading, and notifications.
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleInstallClick}
                className="bg-blue-600 hover:bg-blue-700 text-white flex-1"
              >
                Install App
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={handleDismiss}
                className="px-3"
              >
                ✕
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
// Hook for checking PWA installation status
export const usePWAInstallStatus = () => {
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);
  useEffect(() => {
    // Check if already installed using proper type checking
    if (window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true) {
      setIsInstalled(true);
    }
    const handleBeforeInstallPrompt = () => {
      setIsInstallable(true);
    };
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);
  return { isInstalled, isInstallable };
}; 