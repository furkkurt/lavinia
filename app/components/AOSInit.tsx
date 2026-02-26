"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

declare global {
  interface Window {
    AOS: any;
    jQuery: any;
  }
}

export default function AOSInit() {
  const pathname = usePathname();

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    let isMounted = true;

    // Wait for AOS to be available
    const waitForAOS = (callback: () => void, maxAttempts = 50) => {
      let attempts = 0;
      const checkAOS = () => {
        if (!isMounted) return; // Component unmounted, stop checking
        if (typeof window !== "undefined" && window.AOS) {
          callback();
        } else if (attempts < maxAttempts) {
          attempts++;
          timeoutId = setTimeout(checkAOS, 100);
        }
      };
      checkAOS();
    };

    const initAOS = () => {
      if (typeof window === "undefined" || !window.AOS) return;

      // Refresh AOS to detect new elements
      window.AOS.refresh();
      
      // Initialize AOS with the same settings as script.min.js
      window.AOS.init({
        duration: 1200,
        once: true,
      });
    };

    // Initialize AOS when component mounts or pathname changes
    waitForAOS(initAOS);

    // Cleanup function
    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      // AOS doesn't need explicit cleanup, but we can refresh it on unmount
      if (typeof window !== "undefined" && window.AOS) {
        try {
          window.AOS.refresh();
        } catch (e) {
          // Ignore errors during cleanup
        }
      }
    };
  }, [pathname]);

  return null;
}
