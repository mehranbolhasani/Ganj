'use client';

import { useEffect, useRef } from 'react';

export default function GradientBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const drawGradient = (time: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Create radial gradient
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = Math.min(canvas.width, canvas.height) * 0.8;

      const gradient = ctx.createRadialGradient(
        centerX + Math.sin(time * 0.001) * 50,
        centerY + Math.cos(time * 0.001) * 50,
        0,
        centerX,
        centerY,
        radius
      );

      // Stone color palette
      gradient.addColorStop(0, 'rgba(250, 250, 249, 0.1)'); // stone-50
      gradient.addColorStop(0.3, 'rgba(245, 245, 244, 0.08)'); // stone-100
      gradient.addColorStop(0.6, 'rgba(231, 229, 228, 0.06)'); // stone-200
      gradient.addColorStop(1, 'rgba(120, 113, 108, 0.04)'); // stone-500

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Add subtle moving orbs
      for (let i = 0; i < 3; i++) {
        const orbX = centerX + Math.sin(time * 0.0005 + i * Math.PI / 3) * 200;
        const orbY = centerY + Math.cos(time * 0.0003 + i * Math.PI / 3) * 150;
        const orbRadius = 80 + Math.sin(time * 0.002 + i) * 20;

        const orbGradient = ctx.createRadialGradient(
          orbX, orbY, 0,
          orbX, orbY, orbRadius
        );
        orbGradient.addColorStop(0, 'rgba(139, 69, 19, 0.1)');
        orbGradient.addColorStop(0.7, 'rgba(120, 113, 108, 0.05)');
        orbGradient.addColorStop(1, 'rgba(87, 83, 78, 0.02)');

        ctx.fillStyle = orbGradient;
        ctx.beginPath();
        ctx.arc(orbX, orbY, orbRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      animationId = requestAnimationFrame(drawGradient);
    };

    resizeCanvas();
    drawGradient(0);

    window.addEventListener('resize', resizeCanvas);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
      style={{ background: 'transparent' }}
    />
  );
}
