"use client";

import { useEffect, useRef } from "react";

// Lightweight canvas confetti implementation
export default function Confetti({ active = false, duration = 1800, mode = 'standard' }) {
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
    // Standard rain from top
    let particles = Array.from({ length: 80 }).map(() => ({
      x: rand(0, w),
      y: rand(-h, 0),
      vx: rand(-2, 2),
      vy: rand(2, 6),
      size: rand(6, 12),
      color: colors[Math.floor(rand(0, colors.length))],
      rot: rand(0, 360),
      gravity: 0.06,
    }));

    // Add corner blast particles if requested
    if (mode === 'corner-blast') {
      const cornerParticles = [];
      const blastCount = 60;

      // Bottom Left
      for (let i = 0; i < blastCount; i++) {
        cornerParticles.push({
          x: 0,
          y: h,
          vx: rand(5, 15), // Shoot right
          vy: rand(-15, -25), // Shoot up strongly
          size: rand(8, 14),
          color: colors[Math.floor(rand(0, colors.length))],
          rot: rand(0, 360),
          gravity: 0.25, // Heavier gravity for "fountain" arc
        });
      }

      // Bottom Right
      for (let i = 0; i < blastCount; i++) {
        cornerParticles.push({
          x: w,
          y: h,
          vx: rand(-5, -15), // Shoot left
          vy: rand(-15, -25), // Shoot up strongly
          size: rand(8, 14),
          color: colors[Math.floor(rand(0, colors.length))],
          rot: rand(0, 360),
          gravity: 0.25,
        });
      }

      particles = [...particles, ...cornerParticles];
    }

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
        p.vy += p.gravity; // Use per-particle gravity
        p.rot += 6;

        // Simple bounds check to stop computing off-screen particles purely for efficiency?
        // For now just let them fall.

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
  }, [active, duration, mode]);

  // overlay canvas
  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 10005,
      }}
    />
  );
}
