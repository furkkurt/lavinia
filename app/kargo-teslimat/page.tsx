"use client";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import SvgSprite from "../components/SvgSprite";
import { useEffect } from "react";

export default function KargoTeslimatPage() {
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
          Kargo ve teslimat
        </h1>
        <p className="text-muted" style={{ maxWidth: "640px", lineHeight: 1.7 }}>
          Kargo ve teslimat bilgileri yakında güncellenecektir.
        </p>
      </main>
      <Footer />
    </>
  );
}
