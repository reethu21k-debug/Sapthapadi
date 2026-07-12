"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import type { ReactNode } from "react";

interface MagneticLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  strength?: number;
}

/**
 * Wraps a Link so it drifts gently toward the cursor on hover,
 * then eases back to rest — a small, professional "magnetic" touch.
 */
export function MagneticLink({ href, children, className = "", strength = 0.35 }: MagneticLinkProps) {
  const ref = useRef<HTMLAnchorElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [pressed, setPressed] = useState(false);

  function handleMouseMove(e: React.MouseEvent<HTMLAnchorElement>) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = e.clientX - (rect.left + rect.width / 2);
    const cy = e.clientY - (rect.top + rect.height / 2);
    setPos({ x: cx * strength, y: cy * strength });
  }

  function handleLeave() {
    setPos({ x: 0, y: 0 });
    setPressed(false);
  }

  return (
    <Link
      ref={ref}
      href={href}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleLeave}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      className={className}
      style={{
        transform: `translate(${pos.x}px, ${pos.y}px) scale(${pressed ? 0.96 : 1})`,
        transition:
          pos.x === 0 && pos.y === 0
            ? "transform 500ms cubic-bezier(0.16,1,0.3,1)"
            : "transform 150ms ease-out",
        display: "inline-flex",
      }}
    >
      {children}
    </Link>
  );
}