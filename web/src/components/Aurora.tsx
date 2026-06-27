/**
 * Fixed, full-viewport animated backdrop: three drifting aurora blobs over a
 * faint blueprint grid, a film-grain layer, and a vignette. Purely decorative.
 */
export function Aurora() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute -left-1/4 -top-1/3 h-[60vmax] w-[60vmax] animate-drift1 rounded-full bg-violet-600/25 blur-[120px]" />
      <div className="absolute -right-1/4 top-1/4 h-[55vmax] w-[55vmax] animate-drift2 rounded-full bg-fuchsia-600/15 blur-[130px]" />
      <div className="absolute bottom-[-20%] left-1/3 h-[55vmax] w-[55vmax] animate-drift3 rounded-full bg-cyan-500/15 blur-[130px]" />
      <div className="absolute inset-0 bg-grid opacity-70" />
      <div className="grain-layer absolute inset-0" />
      <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_-10%,transparent_45%,rgba(0,0,0,0.6))]" />
    </div>
  );
}
