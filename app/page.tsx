"use client";

import { useEffect } from "react";
import SvgSprite from "@/app/components/SvgSprite";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import { HomeCollections } from "@/app/components/HomeCollections";
import { HomeInstagram } from "@/app/components/HomeInstagram";
import { HomeNewsletter } from "@/app/components/HomeNewsletter";
import HomeWidgetZones from "@/app/components/HomeWidgetZones";

export default function HomePage() {
  useEffect(() => {
    const preloader = document.querySelector(".preloader");
    if (preloader) preloader.classList.add("loaded");
  }, []);

  return (
    <>
      <div className="preloader text-white fs-6 text-uppercase overflow-hidden" aria-hidden />
      <SvgSprite />
      <Navbar />
      <main>
        <HomeCollections />
        <HomeWidgetZones />
        <HomeNewsletter />
        <HomeInstagram />
      </main>
      <Footer />
    </>
  );
}
