'use client';

export default function SimpleBackground() {
  return (
    <div className="fixed inset-0 w-full h-full pointer-events-none z-0">
      {/* Animated gradient background */}
      <div 
        className="absolute inset-0 opacity-30 animate-pulse"
        style={{
          background: `
            radial-gradient(circle at 20% 50%, rgba(139, 69, 19, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(120, 113, 108, 0.08) 0%, transparent 50%),
            radial-gradient(circle at 40% 80%, rgba(87, 83, 78, 0.06) 0%, transparent 50%)
          `
        }}
      />
      
      {/* Flowing lines */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          background: `
            linear-gradient(45deg, transparent 30%, rgba(120, 113, 108, 0.1) 50%, transparent 70%),
            linear-gradient(-45deg, transparent 30%, rgba(139, 69, 19, 0.08) 50%, transparent 70%)
          `
        }}
      />
    </div>
  );
}
