"use client";

import { useEffect } from "react";

export default function IframeResizer() {
  useEffect(() => {
    if (typeof window === "undefined" || !window.parent) return;

    const sendHeight = () => {
      let height = document.documentElement.scrollHeight || document.body.scrollHeight;

      // Ensure that if the autocomplete dropdown is open, the iframe grows to show it
      const suggestionsEl = document.querySelector(".search-suggestions") as HTMLElement;
      if (suggestionsEl) {
        const rect = suggestionsEl.getBoundingClientRect();
        const suggestionsBottom = rect.bottom + window.scrollY;
        if (suggestionsBottom > height) {
          height = Math.ceil(suggestionsBottom) + 16; // 16px padding buffer
        }
      }

      window.parent.postMessage(
        { type: "HEMINGWAY_SEARCH_RESIZE", height },
        "*"
      );
    };

    // Send initial height
    sendHeight();

    // Watch for size changes
    const resizeObserver = new ResizeObserver(() => {
      sendHeight();
    });
    resizeObserver.observe(document.body);

    // Watch for DOM mutations (like showing/hiding suggestions)
    const mutationObserver = new MutationObserver(() => {
      sendHeight();
    });
    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    window.addEventListener("load", sendHeight);

    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener("load", sendHeight);
    };
  }, []);

  return null;
}
