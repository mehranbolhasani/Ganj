'use client';

import { useEffect, useRef } from 'react';

export default function AuroraBackground() {
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

    const drawAurora = (time: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Create gradient
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, 'rgba(139, 69, 19, 0.1)'); // Stone colors
      gradient.addColorStop(0.3, 'rgba(120, 113, 108, 0.08)');
      gradient.addColorStop(0.6, 'rgba(87, 83, 78, 0.06)');
      gradient.addColorStop(1, 'rgba(28, 25, 23, 0.04)');

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw flowing waves
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(139, 69, 19, 0.15)';
      ctx.lineWidth = 2;

      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(0, canvas.height / 2);

        for (let x = 0; x < canvas.width; x += 10) {
          const y = canvas.height / 2 + 
            Math.sin((x * 0.01) + (time * 0.001) + (i * Math.PI / 3)) * 50 +
            Math.sin((x * 0.005) + (time * 0.0005)) * 30;
          
          ctx.lineTo(x, y);
        }

        ctx.stroke();
      }

      animationId = requestAnimationFrame(drawAurora);
    };

    resizeCanvas();
    drawAurora(0);

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
      width={typeof window !== 'undefined' ? window.innerWidth : 800}
      height={typeof window !== 'undefined' ? window.innerHeight : 600}
    />
  );
}
