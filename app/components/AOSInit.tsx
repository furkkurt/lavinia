"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import AOS from "aos";
import "aos/dist/aos.css";

export default function AOSInit() {
  const pathname = usePathname();

  useEffect(() => {
    AOS.init({
      duration: 1200,
      once: true,
    });
    const id = requestAnimationFrame(() => {
      AOS.refresh();
    });
    return () => cancelAnimationFrame(id);
  }, [pathname]);

  return null;
}
