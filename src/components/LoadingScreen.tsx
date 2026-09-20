import { Logo } from "@/components/Logo";

export function LoadingScreen() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center px-6">
      <div className="flex flex-col items-center justify-center gap-7 text-center">
        <div className="relative w-28 h-28 sm:w-32 sm:h-32">
          <div
            className="absolute inset-0 rounded-full border-[3px] border-rule border-t-cobalt animate-spin"
            style={{ animationDuration: "0.9s" }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <Logo size={48} />
          </div>
        </div>
        <div>
          <p className="text-base sm:text-lg font-medium tracking-[-0.02em] text-ink">
            Skill Note
          </p>
          <p className="text-sm text-ink-faint mt-1 animate-pulse">
            Loading…
          </p>
        </div>
      </div>
    </div>
  );
}
