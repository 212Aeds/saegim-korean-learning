"use client";

import { useEffect } from "react";
import { installCloudflareAnalytics } from "./web-analytics";

export function CloudflareAnalytics() {
  useEffect(() => {
    try {
      installCloudflareAnalytics(document, {
        hostname: window.location.hostname,
        doNotTrack: navigator.doNotTrack,
        globalPrivacyControl: (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl,
      });
    } catch { /* Analytics must never block learning. */ }
  }, []);
  return null;
}
