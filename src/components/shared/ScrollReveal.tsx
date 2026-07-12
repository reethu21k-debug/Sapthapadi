"use client";

import { createElement, useEffect, useRef, useState } from "react";
import type { ReactNode, CSSProperties, ElementType } from "react";

type Variant = "fade-up" | "fade-in" | "scale-in" | "draw-line-h" | "draw-line-v";

interface ScrollRevealProps {
  children: ReactNode;
  variant?: Variant;
  delay?: number;
  duration?: number;
  className?: string;
  threshold?: number;
  once?: boolean;
  /** Wrapper element to render — defaults to "div". Use "li" inside lists, etc. */
  as?: ElementType;
}

/**
 * Wraps any content and animates it in once it enters the viewport.
 * Pure CSS transitions driven by a single IntersectionObserver flag —
 * no animation libraries required. Respects prefers-reduced-motion.
 */
export function ScrollReveal({
  children,
  variant = "fade-up",
  delay = 0,
  duration = 700,
  className = "",
  threshold = 0.2,
  once = true,
  as = "div",
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mql.matches);
    if (mql.matches) {
      setVisible(true);
      return;
    }

    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            if (once) observer.unobserve(el);
          } else if (!once) {
            setVisible(false);
          }
        });
      },
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [once, threshold]);

  const easing = "cubic-bezier(0.16, 1, 0.3, 1)";

  const baseStyle: CSSProperties = reducedMotion
    ? {}
    : {
        transitionProperty: "opacity, transform",
        transitionDuration: `${duration}ms`,
        transitionTimingFunction: easing,
        transitionDelay: `${delay}ms`,
        willChange: "opacity, transform",
      };

  let variantStyle: CSSProperties = {};
  if (!reducedMotion) {
    switch (variant) {
      case "fade-up":
        variantStyle = {
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(28px)",
        };
        break;
      case "fade-in":
        variantStyle = { opacity: visible ? 1 : 0 };
        break;
      case "scale-in":
        variantStyle = {
          opacity: visible ? 1 : 0,
          transform: visible ? "scale(1)" : "scale(0.94)",
        };
        break;
      case "draw-line-h":
        variantStyle = {
          transform: visible ? "scaleX(1)" : "scaleX(0)",
          transformOrigin: "center",
        };
        break;
      case "draw-line-v":
        variantStyle = {
          transform: visible ? "scaleY(1)" : "scaleY(0)",
          transformOrigin: "top",
        };
        break;
    }
  }

  return createElement(
    as,
    { ref, className, style: { ...baseStyle, ...variantStyle } },
    children
  );
}