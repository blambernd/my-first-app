"use client";

import { useState, useEffect, useCallback } from "react";

type PushStatus = "loading" | "unsupported" | "denied" | "granted" | "prompt";

export function usePushNotifications() {
  const [status, setStatus] = useState<PushStatus>("loading");
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("unsupported");
      return;
    }

    const permission = Notification.permission;
    if (permission === "denied") {
      setStatus("denied");
    } else if (permission === "granted") {
      // Check if we have an active subscription
      navigator.serviceWorker.ready.then((reg) => {
        reg.pushManager.getSubscription().then((sub) => {
          setStatus(sub ? "granted" : "prompt");
        });
      });
    } else {
      setStatus("prompt");
    }
  }, []);

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (status === "unsupported" || status === "denied") return false;

    setSubscribing(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("denied");
        return false;
      }

      const reg = await navigator.serviceWorker.ready;

      // Get VAPID public key from server
      const keyRes = await fetch("/api/push/vapid-key");
      if (!keyRes.ok) return false;
      const { publicKey } = await keyRes.json();

      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
      });

      // Send subscription to server
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription.toJSON()),
      });

      if (res.ok) {
        setStatus("granted");
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      setSubscribing(false);
    }
  }, [status]);

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    try {
      const reg = await navigator.serviceWorker.ready;
      const subscription = await reg.pushManager.getSubscription();
      if (subscription) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        await subscription.unsubscribe();
      }
      setStatus("prompt");
      return true;
    } catch {
      return false;
    }
  }, []);

  return { status, subscribing, subscribe, unsubscribe };
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
