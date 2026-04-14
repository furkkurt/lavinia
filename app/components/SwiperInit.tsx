"use client";

import { useEffect } from "react";
import Swiper from "swiper";
import type { Swiper as SwiperType } from "swiper";
import {
  Autoplay,
  EffectCoverflow,
  EffectFade,
  Navigation,
  Pagination,
  Thumbs,
} from "swiper/modules";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/effect-fade";
import "swiper/css/effect-coverflow";

function destroyInstance(s: SwiperType | null | undefined) {
  if (!s) return;
  try {
    s.destroy(true, true);
  } catch {
    /* already torn down */
  }
}

/**
 * Imperative Swiper setup for legacy theme markup (main billboard, optional product sliders).
 * Only destroys instances created here — never all `.swiper` nodes, so `swiper/react` carousels
 * (e.g. HomeCollections) are not corrupted when `reinitKey` changes.
 */
export default function SwiperInit({ reinitKey }: { reinitKey?: number | string } = {}) {
  useEffect(() => {
    const created: SwiperType[] = [];
    let kickoffDelayId: ReturnType<typeof setTimeout> | null = null;
    let initTimeoutId: ReturnType<typeof setTimeout> | null = null;
    let isMounted = true;
    let isInitialized = false;

    const initSwipers = () => {
      if (typeof window === "undefined" || isInitialized) return;
      isInitialized = true;

      const mainSwiperEls = document.querySelectorAll(".main-swiper");
      mainSwiperEls.forEach((mainSwiperEl) => {
        const el = mainSwiperEl as HTMLElement & { swiper?: SwiperType };
        if (!el.swiper) {
          const instance = new Swiper(el, {
            slidesPerView: 3,
            spaceBetween: 80,
            speed: 700,
            loop: true,
            navigation: false,
            breakpoints: {
              300: { slidesPerView: 1, spaceBetween: 20 },
              768: { slidesPerView: 2, spaceBetween: 20 },
              1200: { slidesPerView: 3, spaceBetween: 80 },
            },
          });
          created.push(instance);
        }
      });

      const productCarousels = document.querySelectorAll(".product-carousel");
      productCarousels.forEach((carousel) => {
        const id = carousel.getAttribute("id");
        const swiperEl = carousel.querySelector(".product-swiper") as (HTMLElement & { swiper?: SwiperType }) | null;
        if (swiperEl && !swiperEl.swiper) {
          const nextArrow = carousel.querySelector(".icon-arrow-right");
          const prevArrow = carousel.querySelector(".icon-arrow-left");
          const paginationEl = swiperEl.querySelector(".swiper-pagination");
          const isThreeSlides = id === "en-son-eklenen" || id === "best-sellers";
          const slides = swiperEl.querySelectorAll(".swiper-slide");
          const slideCount = slides.length;
          const canLoop = slideCount >= (isThreeSlides ? 6 : 8);

          const instance = new Swiper(swiperEl, {
            modules: [Navigation, Pagination],
            slidesPerView: isThreeSlides ? 3 : 4,
            spaceBetween: 20,
            loop: canLoop,
            loopAdditionalSlides: isThreeSlides ? 3 : 4,
            watchSlidesProgress: true,
            navigation:
              nextArrow && prevArrow
                ? {
                    nextEl: nextArrow as HTMLElement,
                    prevEl: prevArrow as HTMLElement,
                  }
                : false,
            pagination: paginationEl
              ? {
                  el: paginationEl as HTMLElement,
                  clickable: true,
                }
              : false,
            breakpoints: {
              0: {
                slidesPerView: 2,
                spaceBetween: 20,
                loop: slideCount >= 4,
                loopAdditionalSlides: 2,
              },
              999: {
                slidesPerView: isThreeSlides ? 3 : 3,
                spaceBetween: isThreeSlides ? 20 : 10,
                loop: slideCount >= 6,
                loopAdditionalSlides: isThreeSlides ? 3 : 3,
              },
              1366: {
                slidesPerView: isThreeSlides ? 3 : 4,
                spaceBetween: isThreeSlides ? 20 : 40,
                loop: isThreeSlides ? slideCount >= 6 : slideCount >= 8,
                loopAdditionalSlides: isThreeSlides ? 3 : 4,
              },
            },
          });
          created.push(instance);
        }
      });

      const testimonialSwiperEl = document.querySelector(".testimonial-swiper") as
        | (HTMLElement & { swiper?: SwiperType })
        | null;
      if (testimonialSwiperEl && !testimonialSwiperEl.swiper) {
        const isMobile = window.innerWidth < 768;
        const instance = new Swiper(".testimonial-swiper", {
          modules: [Autoplay, Pagination, EffectCoverflow],
          effect: isMobile ? "slide" : "coverflow",
          grabCursor: true,
          centeredSlides: true,
          loop: true,
          loopAdditionalSlides: isMobile ? 2 : 5,
          slidesPerView: "auto",
          spaceBetween: isMobile ? 20 : 30,
          autoplay: {
            delay: 3000,
            disableOnInteraction: false,
          },
          speed: 1000,
          coverflowEffect: isMobile
            ? undefined
            : {
                rotate: 0,
                stretch: 0,
                depth: 150,
                modifier: 1.2,
                slideShadows: false,
              },
          pagination: {
            el: ".testimonial-swiper-pagination",
            clickable: true,
          },
          breakpoints: {
            0: { slidesPerView: 1, spaceBetween: 20 },
            768: { slidesPerView: "auto", spaceBetween: 30 },
          },
          on: {
            init(this: SwiperType) {
              this.update();
            },
            slideChange(this: SwiperType) {
              this.update();
            },
            resize(this: SwiperType) {
              const isMobileNow = window.innerWidth < 768;
              if (isMobileNow && this.params.effect === "coverflow") {
                this.params.effect = "slide";
                this.update();
              } else if (!isMobileNow && this.params.effect === "slide") {
                this.params.effect = "coverflow";
                this.update();
              }
            },
          },
        });
        created.push(instance);
      }

      const productLargeSliderEl = document.querySelector(".product-large-slider");
      const productThumbnailSliderEl = document.querySelector(".product-thumbnail-slider");

      if (productLargeSliderEl) {
        let thumbnailSwiper: SwiperType | null = null;

        if (productThumbnailSliderEl) {
          thumbnailSwiper = new Swiper(".product-thumbnail-slider", {
            modules: [Thumbs],
            slidesPerView: 3,
            spaceBetween: 15,
            direction: "horizontal",
            slideToClickedSlide: true,
            watchSlidesProgress: true,
            breakpoints: {
              0: { slidesPerView: 3, spaceBetween: 10 },
              768: { slidesPerView: 4, spaceBetween: 15 },
            },
          });
          created.push(thumbnailSwiper);
        }

        const prevBtn = productLargeSliderEl.querySelector(".product-slider-prev");
        const nextBtn = productLargeSliderEl.querySelector(".product-slider-next");

        const mainInstance = new Swiper(".product-large-slider", {
          modules: [EffectFade, Navigation, Pagination, Thumbs],
          slidesPerView: 1,
          spaceBetween: 0,
          effect: "fade",
          fadeEffect: { crossFade: true },
          thumbs: thumbnailSwiper ? { swiper: thumbnailSwiper } : undefined,
          navigation:
            prevBtn && nextBtn
              ? {
                  prevEl: prevBtn as HTMLElement,
                  nextEl: nextBtn as HTMLElement,
                }
              : false,
          pagination: {
            el: ".product-large-slider .swiper-pagination",
            clickable: true,
          },
        });
        created.push(mainInstance);
      }
    };

    let idleId: ReturnType<typeof requestIdleCallback> | undefined;
    const kickoff = () => {
      if (!isMounted || isInitialized) return;
      initTimeoutId = setTimeout(() => {
        if (isMounted && !isInitialized) initSwipers();
      }, 200);
    };

    if (typeof window !== "undefined" && typeof requestIdleCallback !== "undefined") {
      idleId = requestIdleCallback(() => kickoff(), { timeout: 2500 });
    } else {
      kickoffDelayId = setTimeout(kickoff, 400);
    }

    return () => {
      isMounted = false;
      isInitialized = false;
      if (idleId !== undefined && typeof cancelIdleCallback !== "undefined") {
        cancelIdleCallback(idleId);
      }
      if (kickoffDelayId) clearTimeout(kickoffDelayId);
      if (initTimeoutId) clearTimeout(initTimeoutId);
      for (let i = created.length - 1; i >= 0; i--) {
        destroyInstance(created[i]);
      }
      created.length = 0;
    };
  }, [reinitKey]);

  return null;
}
