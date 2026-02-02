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
    // Wait for AOS to be available
    const waitForAOS = (callback: () => void, maxAttempts = 50) => {
      let attempts = 0;
      const checkAOS = () => {
        if (typeof window !== "undefined" && window.AOS) {
          callback();
        } else if (attempts < maxAttempts) {
          attempts++;
          setTimeout(checkAOS, 100);
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
  }, [pathname]);

  return null;
}
