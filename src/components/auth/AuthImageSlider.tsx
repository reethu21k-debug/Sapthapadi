"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

const SLIDE_IMAGES = [
  {
    src: "/Love/love-17.png",
    alt: "A bride ready for her journey to find her life partner with Saptapadi",
  },
  {
    src: "/Love/love-1.png",
    alt: "A bride ready for her journey to find her life partner with Saptapadi",
  },
  {
    src: "/Love/love-2.png",
    alt: "A couple finding their life partner through Saptapadi",
  },
  {
    src: "/Love/love-3.png",
    alt: "A couple who found their dream partner with Saptapadi",
  },
];

export function AuthImageSlider() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? SLIDE_IMAGES.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev === SLIDE_IMAGES.length - 1 ? 0 : prev + 1));
  };

  // Optional auto-play every 6 seconds
  useEffect(() => {
    const timer = setInterval(nextSlide, 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full h-full lg:flex lg:flex-col lg:items-center lg:justify-center lg:p-12">
      {/*
        Mobile/tablet: object-contain guarantees the full image is ALWAYS visible,
        never cropped, on any screen shape. When the banner's aspect ratio matches
        the image (the normal portrait-phone case), object-contain fills the box
        edge-to-edge with no visible gap — it only letterboxes on the rare
        short/landscape viewports where the container had to be height-capped.
        Desktop (lg+): unchanged — centered, width-bound, object-contain box.
      */}
      <div className="absolute inset-0 lg:relative lg:w-full lg:max-w-[500px] lg:aspect-[1085/1449] lg:mx-auto">
        {SLIDE_IMAGES.map((image, index) => (
          <div
            key={image.src}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
              index === currentIndex
                ? "opacity-100 pointer-events-auto"
                : "opacity-0 pointer-events-none"
            }`}
          >
            <Image
              src={image.src}
              alt={image.alt}
              fill
              priority={index === 0}
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-contain object-center drop-shadow-2xl"
            />
          </div>
        ))}
      </div>

      {/* Gradient fade so the banner blends into the page below it (mobile/tablet only) */}
      <div className="absolute inset-x-0 bottom-0 h-20 sm:h-24 bg-gradient-to-t from-black/80 via-black/30 to-transparent lg:hidden pointer-events-none" />

      {/* Navigation Arrow - Left */}
      <button
        onClick={prevSlide}
        aria-label="Previous image"
        className="absolute left-2 sm:left-3 lg:left-2 top-1/2 -translate-y-1/2 z-10 p-2 sm:p-3 rounded-full bg-navy-dark/60 hover:bg-navy-dark text-white border border-white/20 shadow-luxury backdrop-blur-md transition-all hover:scale-105 group"
      >
        <ChevronLeft className="w-4 h-4 sm:w-6 sm:h-6 text-gold group-hover:text-gold-light transition-colors" />
      </button>

      {/* Navigation Arrow - Right */}
      <button
        onClick={nextSlide}
        aria-label="Next image"
        className="absolute right-2 sm:right-3 lg:right-2 top-1/2 -translate-y-1/2 z-10 p-2 sm:p-3 rounded-full bg-navy-dark/60 hover:bg-navy-dark text-white border border-white/20 shadow-luxury backdrop-blur-md transition-all hover:scale-105 group"
      >
        <ChevronRight className="w-4 h-4 sm:w-6 sm:h-6 text-gold group-hover:text-gold-light transition-colors" />
      </button>

      {/* Slide Indicators (Dots) — overlaid on image on mobile/tablet, below it on desktop */}
      <div className="absolute bottom-3 sm:bottom-4 left-0 right-0 lg:static lg:mt-6 flex items-center justify-center gap-2 sm:gap-3 z-10">
        {SLIDE_IMAGES.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            aria-label={`Go to slide ${index + 1}`}
            className={`h-2 sm:h-2.5 rounded-full transition-all duration-300 ${
              index === currentIndex
                ? "w-7 sm:w-8 bg-gold shadow-gold"
                : "w-2 sm:w-2.5 bg-white/40 hover:bg-white/70"
            }`}
          />
        ))}
      </div>
    </div>
  );
}