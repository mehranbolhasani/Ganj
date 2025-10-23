'use client';

import { useEffect, useRef } from 'react';

export default function TestBackground() {
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

    const draw = (time: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw a simple moving circle
      const x = canvas.width / 2 + Math.sin(time * 0.001) * 100;
      const y = canvas.height / 2 + Math.cos(time * 0.001) * 50;
      
      ctx.beginPath();
      ctx.arc(x, y, 30, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(139, 69, 19, 0.3)'; // Stone-700 with opacity
      ctx.fill();
      
      // Draw some flowing lines
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(120, 113, 108, 0.2)'; // Stone-500
      ctx.lineWidth = 2;
      
      for (let i = 0; i < 5; i++) {
        const startX = 0;
        const startY = canvas.height / 5 * (i + 1);
        const endX = canvas.width;
        const endY = startY + Math.sin(time * 0.0005 + i) * 20;
        
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
      }
      ctx.stroke();

      animationId = requestAnimationFrame(draw);
    };

    resizeCanvas();
    draw(0);

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
