"use client";

import { useEffect } from "react";

// Mendaftarkan service worker sederhana untuk kebutuhan PWA (installable).
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Gagal mendaftar SW tidak mengganggu fungsi aplikasi.
      });
    }
  }, []);
  return null;
}
