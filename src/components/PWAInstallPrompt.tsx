import React, { useState, useEffect } from "react";
import { Download, Wifi, ShieldAlert, CheckCircle, Bell, RefreshCw, Smartphone } from "lucide-react";

export default function PWAInstallPrompt() {
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [pushStatus, setPushStatus] = useState<"granted" | "prompt" | "denied">("prompt");
  const [showInAppAlert, setShowInAppAlert] = useState<string | null>(null);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial load check
    if ("Notification" in window) {
      if (Notification.permission === "granted") {
        setPushStatus("granted");
      } else if (Notification.permission === "denied") {
        setPushStatus("denied");
      }
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleInstallSimulate = () => {
    setIsInstalled(true);
    triggerNotification("GoalTracker Installed", "App successfully added to your device homescreen! Offline cache is ready.");
  };

  const handleRequestPush = () => {
    if ("Notification" in window) {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          setPushStatus("granted");
          triggerNotification("Notifications Enabled", "You will now receive milestone, streak, and target alerts!");
        } else {
          setPushStatus("denied");
        }
      });
    } else {
      setPushStatus("granted"); // Mock for browsers lacking standard notification APIs
      setShowInAppAlert("Demo: Push permission simulated successfully!");
      setTimeout(() => setShowInAppAlert(null), 3000);
    }
  };

  // Push Trigger Mock/Reality
  const triggerNotification = (title: string, body: string) => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, {
        body,
        icon: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=100&q=80",
      });
    } else {
      setShowInAppAlert(`${title}: ${body}`);
      setTimeout(() => setShowInAppAlert(null), 4000);
    }
  };

  const handleTriggerMockPush = () => {
    const payloads = [
      { title: "Streak Warning! 🔥", body: "Complete your 'LeetCode daily challenge' now to protect your 14-day streak!" },
      { title: "Course Deadline Alert 💡", body: "AWS Certified Architect - VPC chapter is due in 24 hours." },
      { title: "Interview Challenge! 🎯", body: "DevOps Engineer Interview Goal is coming up. Refresh Linux networking commands!" },
      { title: "Milestone Cleared! 🎉", body: "Mastered Skill: 'Linux TCP diagnostics' level 5 confidence!" },
    ];
    const rand = payloads[Math.floor(Math.random() * payloads.length)];
    triggerNotification(rand.title, rand.body);
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 mb-6 shadow-sm" id="pwa-diagnostic-card">
      <div className="flex flex-col md:flex-row items-center justify-between gap-5">
        
        {/* Diagnostic info */}
        <div className="flex items-start gap-3.5 flex-1 w-full">
          <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl text-indigo-600 shadow-sm shrink-0">
            <Smartphone className="w-6 h-6 text-indigo-500" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                PWA Platform Shell
              </h4>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                isOffline 
                  ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400" 
                  : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400"
              }`}>
                <Wifi className="w-3 h-3" />
                {isOffline ? "Offline Sandbox Mode" : "Online Client Cloud"}
              </span>
              <span className="text-[10px] font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                SW Active
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
              Installable support enabled. This application keeps offline cache indexes inside your browser, enabling instant load metrics with Background Sync enabled.
            </p>
          </div>
        </div>

        {/* Dynamic Buttons Panel */}
        <div className="flex items-center gap-2 flex-wrap md:flex-nowrap w-full md:w-auto shrink-0 justify-end">
          {/* Mock Install */}
          {!isInstalled ? (
            <button
              onClick={handleInstallSimulate}
              className="text-xs font-semibold flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-all cursor-pointer w-full md:w-auto justify-center"
            >
              <Download className="w-4 h-4" />
              Install PWA App
            </button>
          ) : (
            <div className="text-xs text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-950/80 px-4 py-2.5 rounded-xl flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4" />
              Installed on Home Screen
            </div>
          )}

          {/* Notifications Permission */}
          {pushStatus !== "granted" ? (
            <button
              onClick={handleRequestPush}
              className="text-xs font-semibold flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all cursor-pointer w-full md:w-auto justify-center"
            >
              <Bell className="w-4 h-4" />
              Enable Push
            </button>
          ) : (
            <button
              onClick={handleTriggerMockPush}
              className="text-xs font-semibold flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-50 dark:bg-slate-800 hover:bg-indigo-100 dark:hover:bg-slate-700 text-indigo-700 dark:text-slate-200 transition-all cursor-pointer border border-indigo-200 dark:border-slate-700 w-full md:w-auto justify-center"
              title="Click to raise mock push notification alert"
            >
              <Bell className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Test Push Alert
            </button>
          )}
        </div>
      </div>

      {/* In-App Simulated Alert Modal */}
      {showInAppAlert && (
        <div className="mt-4 p-3 rounded-xl bg-indigo-900 border border-indigo-800/80 text-white flex items-center gap-2.5 animate-fadeIn text-xs shadow-md">
          <Bell className="w-4 h-4 text-indigo-200 shrink-0 animate-bounce" />
          <div className="flex-1 min-w-0">
            <span className="font-semibold block">Push Notification Alert:</span>
            <span className="text-indigo-200 font-mono text-[11px] block mt-0.5">{showInAppAlert}</span>
          </div>
        </div>
      )}
    </div>
  );
}
