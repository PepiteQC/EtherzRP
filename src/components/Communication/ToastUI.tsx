// src/components/Communication/ToastUI.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { NotificationData } from "@/systems/communication/types";
import styles from "./ToastUI.module.css";

const ICONS: Record<string, string> = {
  info: "ℹ️",
  warning: "⚠️",
  police: "🚔",
  ambulance: "🚑",
  faction: "🏴",
  phone: "📱",
};

interface Props {
  socket: any;
}

export default function ToastUI({ socket }: Props) {
  const [toasts, setToasts] = useState<NotificationData[]>([]);

  const addToast = useCallback((data: NotificationData) => {
    setToasts((prev) => [...prev, data]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== data.id));
    }, data.duration || 5000);
  }, []);

  useEffect(() => {
    socket.on("notification:toast", addToast);
    socket.on("dispatch:call", (data: any) => {
      addToast({
        id: `dispatch_${Date.now()}`,
        type: "police",
        title: "📻 Appel Dispatch",
        message: `${data.callerName} appelle le 911!`,
        icon: "🚨",
        duration: 8000,
        sound: "dispatch_alert",
        timestamp: Date.now(),
      });
    });

    return () => {
      socket.off("notification:toast");
      socket.off("dispatch:call");
    };
  }, [socket, addToast]);

  return (
    <div className={styles.toastContainer}>
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`${styles.toast} ${styles[toast.type]}`}
        >
          <span className={styles.icon}>
            {ICONS[toast.type] ?? toast.icon}
          </span>
          <div className={styles.body}>
            <strong>{toast.title}</strong>
            <p>{toast.message}</p>
          </div>
          <button
            className={styles.dismiss}
            onClick={() =>
              setToasts((p) => p.filter((t) => t.id !== toast.id))
            }
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}