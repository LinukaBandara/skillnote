export function LoadingScreen() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-5">
      <div className="relative w-16 h-16">
        <div
          className="absolute inset-0 rounded-full border-[3px] border-rule border-t-cobalt animate-spin"
          style={{ animationDuration: "0.9s" }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="stat-serif text-xl text-ink">SN</span>
        </div>
      </div>
      <p className="text-sm text-ink-soft animate-pulse">Loading Skill Note…</p>
    </div>
  );
}
