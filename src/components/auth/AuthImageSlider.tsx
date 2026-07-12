"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

const SLIDE_IMAGES = [
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
    <div className="relative w-full h-full flex flex-col items-center justify-center p-6 lg:p-12">
      {/* Image Container — locked to the source 1085:1449 portrait ratio */}
      <div className="relative w-full max-w-[500px] aspect-[1085/1449] flex items-center justify-center">
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
              className="object-contain drop-shadow-2xl"
            />
          </div>
        ))}

        {/* Navigation Arrow - Left */}
        <button
          onClick={prevSlide}
          aria-label="Previous image"
          className="absolute -left-4 sm:left-2 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-navy-dark/70 hover:bg-navy-dark text-white border border-white/20 shadow-luxury backdrop-blur-md transition-all hover:scale-105 group"
        >
          <ChevronLeft className="w-6 h-6 text-gold group-hover:text-gold-light transition-colors" />
        </button>

        {/* Navigation Arrow - Right */}
        <button
          onClick={nextSlide}
          aria-label="Next image"
          className="absolute -right-4 sm:right-2 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-navy-dark/70 hover:bg-navy-dark text-white border border-white/20 shadow-luxury backdrop-blur-md transition-all hover:scale-105 group"
        >
          <ChevronRight className="w-6 h-6 text-gold group-hover:text-gold-light transition-colors" />
        </button>
      </div>

      {/* Slide Indicators (Dots) */}
      <div className="flex items-center gap-3 mt-6 z-10">
        {SLIDE_IMAGES.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            aria-label={`Go to slide ${index + 1}`}
            className={`h-2.5 rounded-full transition-all duration-300 ${
              index === currentIndex
                ? "w-8 bg-gold shadow-gold"
                : "w-2.5 bg-white/30 hover:bg-white/60"
            }`}
          />
        ))}
      </div>
    </div>
  );
}