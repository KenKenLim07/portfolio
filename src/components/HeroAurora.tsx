"use client";

export function HeroAurora() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="hero-aurora-a absolute -left-1/4 top-0 h-[70vh] w-[70vw] rounded-full opacity-40" />
      <div className="hero-aurora-b absolute -right-1/4 top-1/3 h-[60vh] w-[55vw] rounded-full opacity-30" />
      <div className="hero-aurora-c absolute bottom-0 left-1/3 h-[50vh] w-[45vw] rounded-full opacity-25" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/20 to-background" />
    </div>
  );
}
