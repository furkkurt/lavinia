"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    Swiper: any;
    jQuery: any;
  }
}

export default function SwiperInit() {
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    let initTimeoutId: NodeJS.Timeout | null = null;
    let isMounted = true;
    let isInitialized = false; // Prevent multiple initializations

    // Wait for Swiper to be available
    const waitForSwiper = (callback: () => void, maxAttempts = 50) => {
      let attempts = 0;
      const checkSwiper = () => {
        if (!isMounted || isInitialized) return; // Component unmounted or already initialized, stop checking
        if (typeof window !== "undefined" && window.Swiper) {
          callback();
        } else if (attempts < maxAttempts) {
          attempts++;
          timeoutId = setTimeout(checkSwiper, 100);
        }
      };
      checkSwiper();
    };

    const initSwipers = () => {
      if (typeof window === "undefined" || !window.Swiper || isInitialized) return;
      isInitialized = true; // Mark as initialized to prevent re-initialization

      // Initialize all main swipers (new collections and related products)
      const mainSwiperEls = document.querySelectorAll(".main-swiper");
      mainSwiperEls.forEach((mainSwiperEl) => {
        // Check if already initialized
        const existingSwiper = (mainSwiperEl as any).swiper;
        if (!existingSwiper) {
          new window.Swiper(mainSwiperEl as HTMLElement, {
            slidesPerView: 3,
            spaceBetween: 80,
            speed: 700,
            loop: true,
            navigation: false,
            breakpoints: {
              300: {
                slidesPerView: 1,
                spaceBetween: 20,
              },
              768: {
                slidesPerView: 2,
                spaceBetween: 20,
              },
              1200: {
                slidesPerView: 3,
                spaceBetween: 80,
              },
            },
          });
        }
      });

      // Initialize product carousel swipers
      const productCarousels = document.querySelectorAll(".product-carousel");
      productCarousels.forEach((carousel: any) => {
        const id = carousel.getAttribute("id");
        const swiperEl = carousel.querySelector(".product-swiper");
        if (swiperEl && !swiperEl.swiper) {
          const nextArrow = carousel.querySelector(".icon-arrow-right");
          const prevArrow = carousel.querySelector(".icon-arrow-left");
          const paginationEl = swiperEl.querySelector(".swiper-pagination");
          
          // Check if it's best-sellers carousel - show exactly 3 cards
          const isBestSellers = id === "best-sellers";
          
          // Get number of slides to ensure loop works
          const slides = swiperEl.querySelectorAll('.swiper-slide');
          const slideCount = slides.length;
          
          // Loop requires at least slidesPerView * 2 slides to work properly
          const canLoop = slideCount >= (isBestSellers ? 6 : 8);
          
          // Initialize Swiper with custom navigation arrows and loop
          new window.Swiper(swiperEl as HTMLElement, {
            slidesPerView: isBestSellers ? 3 : 4,
            spaceBetween: isBestSellers ? 20 : 20,
            loop: canLoop,
            loopAdditionalSlides: isBestSellers ? 3 : 4,
            loopedSlides: isBestSellers ? 3 : 4,
            watchSlidesProgress: true,
            navigation: nextArrow && prevArrow ? {
              nextEl: nextArrow as HTMLElement,
              prevEl: prevArrow as HTMLElement,
            } : false,
            pagination: paginationEl ? {
              el: paginationEl as HTMLElement,
              clickable: true,
            } : false,
            breakpoints: {
              0: {
                slidesPerView: 2,
                spaceBetween: 20,
                loop: slideCount >= 4,
                loopAdditionalSlides: 2,
                loopedSlides: 2,
              },
              999: {
                slidesPerView: isBestSellers ? 3 : 3,
                spaceBetween: isBestSellers ? 20 : 10,
                loop: isBestSellers ? slideCount >= 6 : slideCount >= 6,
                loopAdditionalSlides: isBestSellers ? 3 : 3,
                loopedSlides: isBestSellers ? 3 : 3,
              },
              1366: {
                slidesPerView: isBestSellers ? 3 : 4,
                spaceBetween: isBestSellers ? 20 : 40,
                loop: isBestSellers ? slideCount >= 6 : slideCount >= 8,
                loopAdditionalSlides: isBestSellers ? 3 : 4,
                loopedSlides: isBestSellers ? 3 : 4,
              },
            },
          });
        }
      });

      // Initialize testimonial swiper with infinite scroll
      const testimonialSwiperEl = document.querySelector(".testimonial-swiper") as
        | (HTMLElement & { swiper?: any })
        | null;
      if (testimonialSwiperEl && !testimonialSwiperEl.swiper) {
        const isMobile = window.innerWidth < 768;
        const swiper = new window.Swiper(".testimonial-swiper", {
          effect: isMobile ? "slide" : "coverflow",
          grabCursor: true,
          centeredSlides: true,
          loop: true,
          loopAdditionalSlides: isMobile ? 2 : 5,
          loopedSlides: isMobile ? 2 : 5,
          slidesPerView: "auto",
          spaceBetween: isMobile ? 20 : 30,
          autoplay: {
            delay: 3000,
            disableOnInteraction: false,
          },
          speed: 1000,
          coverflowEffect: isMobile ? undefined : {
            rotate: 0,
            stretch: 0,
            depth: 150,
            modifier: 1.2,
            slideShadows: false,
            fade: true,
          },
          pagination: {
            el: ".testimonial-swiper-pagination",
            clickable: true,
          },
          breakpoints: {
            0: {
              slidesPerView: 1,
              spaceBetween: 20,
            },
            768: {
              slidesPerView: "auto",
              spaceBetween: 30,
            },
          },
          on: {
            init: function (this: any) {
              // Ensure slides are visible on init
              this.update();
            },
            slideChange: function (this: any) {
              // Ensure slides remain visible during transition
              this.update();
            },
            resize: function (this: any) {
              // Update effect on resize
              const isMobileNow = window.innerWidth < 768;
              if (isMobileNow && this.params.effect === "coverflow") {
                this.changeDirection("horizontal", true);
                this.params.effect = "slide";
                this.update();
              } else if (!isMobileNow && this.params.effect === "slide") {
                this.params.effect = "coverflow";
                this.update();
              }
            },
          },
        });
      }

      // Initialize product detail page sliders
      const productThumbnailSliderEl = document.querySelector(".product-thumbnail-slider");
      const productLargeSliderEl = document.querySelector(".product-large-slider");
      
      if (productThumbnailSliderEl && productLargeSliderEl) {
        // Product thumbnail slider (always horizontal)
        const thumbnailSwiper = new window.Swiper(".product-thumbnail-slider", {
          slidesPerView: 3,
          spaceBetween: 15,
          direction: "horizontal",
          breakpoints: {
            0: {
              slidesPerView: 3,
              spaceBetween: 10,
            },
            768: {
              slidesPerView: 3,
              spaceBetween: 15,
            },
          },
        });

        // Product large slider (main image)
        new window.Swiper(".product-large-slider", {
          slidesPerView: 1,
          spaceBetween: 0,
          effect: "fade",
          fadeEffect: {
            crossFade: true,
          },
          thumbs: {
            swiper: thumbnailSwiper,
          },
          pagination: {
            el: ".product-large-slider .swiper-pagination",
            clickable: true,
          },
        });
      }
    };

    // Wait for Swiper to load, then initialize
    waitForSwiper(() => {
      if (!isMounted || isInitialized) return; // Component unmounted or already initialized, don't initialize
      // Small delay to ensure DOM is fully rendered
      initTimeoutId = setTimeout(() => {
        if (isMounted && !isInitialized) {
          initSwipers();
        }
      }, 200);
    });

    // Cleanup function
    return () => {
      isMounted = false;
      isInitialized = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      if (initTimeoutId) {
        clearTimeout(initTimeoutId);
        initTimeoutId = null;
      }
      // Destroy all Swiper instances on unmount
      if (typeof window !== "undefined" && window.Swiper) {
        document.querySelectorAll(".swiper").forEach((el: any) => {
          if (el.swiper) {
            try {
              el.swiper.destroy(true, true);
            } catch (e) {
              // Ignore errors during cleanup
            }
          }
        });
      }
    };
  }, []);

  return null;
}
