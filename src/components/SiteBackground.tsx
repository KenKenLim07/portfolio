/**
 * Fixed atmospheric layer — tuned for dark OLED backgrounds (#09090b).
 * Body is transparent so this layer is the visible base behind all sections.
 */
export function SiteBackground() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-background"
      aria-hidden
    >
      <div className="site-grid absolute inset-0 opacity-90" />

      <div className="site-aurora-a absolute -left-[18%] top-[-12%] h-[80vh] w-[80vw] rounded-full mix-blend-screen opacity-70" />
      <div className="site-aurora-b absolute -right-[12%] top-[18%] h-[70vh] w-[65vw] rounded-full mix-blend-screen opacity-60" />
      <div className="site-aurora-c absolute bottom-[-8%] left-[20%] h-[58vh] w-[52vw] rounded-full mix-blend-screen opacity-50" />

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_85%_55%_at_50%_-8%,rgba(99,102,241,0.32),transparent_52%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_45%_at_100%_25%,rgba(139,92,246,0.2),transparent)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_45%_40%_at_0%_60%,rgba(99,102,241,0.12),transparent)]" />

      {/* Soft edge fade — lighter than before so glow stays visible */}
      <div className="absolute inset-x-0 bottom-0 h-[38vh] bg-gradient-to-t from-background via-background/40 to-transparent" />
    </div>
  );
}
