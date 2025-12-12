"use client";

import { useEffect, useRef } from "react";

// Lightweight canvas confetti implementation
export default function Confetti({ active = false, duration = 1800 }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    const colors = ["#f97373", "#fb7185", "#f59e0b", "#fbbf24", "#60a5fa", "#7c3aed"];

    function rand(min, max) {
      return Math.random() * (max - min) + min;
    }

    // create particles
    const particles = Array.from({ length: 80 }).map(() => ({
      x: rand(0, w),
      y: rand(-h, 0),
      vx: rand(-2, 2),
      vy: rand(2, 6),
      size: rand(6, 12),
      color: colors[Math.floor(rand(0, colors.length))],
      rot: rand(0, 360),
    }));

    let start = performance.now();

    function onResize() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    }
    window.addEventListener("resize", onResize);

    function draw(t) {
      const dt = t - start;
      ctx.clearRect(0, 0, w, h);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.06; // gravity
        p.rot += 6;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rot * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      });
      rafRef.current = requestAnimationFrame(draw);
    }

    rafRef.current = requestAnimationFrame(draw);

    const stopTimer = setTimeout(() => {
      cancelAnimationFrame(rafRef.current);
      ctx.clearRect(0, 0, w, h);
    }, duration);

    return () => {
      clearTimeout(stopTimer);
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", onResize);
    };
  }, [active, duration]);

  // overlay canvas
  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 9999,
      }}
    />
  );
}
