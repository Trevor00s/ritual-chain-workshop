/**
 * Fixed, full-viewport backdrop: two soft drifting aurora blobs over a faint
 * blueprint grid, finished with a vignette. Kept deliberately light so content
 * stays crisp and the page doesn't feel busy.
 */
export function Aurora() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute -left-[15%] -top-[20%] h-[42vmax] w-[42vmax] animate-drift1 rounded-full bg-violet-600/18 blur-[100px]" />
      <div className="absolute -right-[15%] top-[8%] h-[38vmax] w-[38vmax] animate-drift2 rounded-full bg-cyan-500/12 blur-[100px]" />
      <div className="absolute inset-0 bg-grid opacity-50" />
      <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_-10%,transparent_50%,rgba(0,0,0,0.7))]" />
    </div>
  );
}
