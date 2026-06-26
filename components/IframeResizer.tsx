"use client";

import { useEffect } from "react";

export default function IframeResizer() {
  useEffect(() => {
    if (typeof window === "undefined" || !window.parent) return;

    const sendHeight = () => {
      const height = document.documentElement.scrollHeight || document.body.scrollHeight;
      window.parent.postMessage(
        { type: "HEMINGWAY_SEARCH_RESIZE", height },
        "*"
      );
    };

    // Send initial height
    sendHeight();

    // Set up a resize observer to capture any dynamic layout shifts, 
    // autocomplete suggestions, or device rotation changes.
    const observer = new ResizeObserver(() => {
      sendHeight();
    });
    
    observer.observe(document.body);

    // Also trigger on load just in case assets like fonts shift the layout
    window.addEventListener("load", sendHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener("load", sendHeight);
    };
  }, []);

  return null;
}
