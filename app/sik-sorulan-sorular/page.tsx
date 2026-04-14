"use client";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import SvgSprite from "../components/SvgSprite";
import { useEffect } from "react";

export default function SikSorulanSorularPage() {
  useEffect(() => {
    const preloader = document.querySelector(".preloader");
    if (preloader) preloader.classList.add("loaded");
  }, []);

  return (
    <>
      <SvgSprite />
      <Navbar />
      <main className="container" style={{ paddingTop: "120px", paddingBottom: "80px", minHeight: "60vh" }}>
        <h1 className="mb-4" style={{ fontFamily: "var(--font-marcellus)", fontSize: "clamp(1.75rem, 4vw, 2.25rem)" }}>
          Sık sorulan sorular
        </h1>
        <p className="text-muted" style={{ maxWidth: "640px", lineHeight: 1.7 }}>
          Sorular ve yanıtlar yakında burada yer alacaktır.
        </p>
      </main>
      <Footer />
    </>
  );
}
