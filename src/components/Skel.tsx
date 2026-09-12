export function Skel({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-rule/70 ${className}`}
      aria-hidden
    />
  );
}
