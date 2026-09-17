export function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="9" fill="var(--cobalt)" />
      <path
        d="M10 21V11.5C10 10.7 10.7 10 11.5 10H17"
        stroke="white"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M22 11V20.5C22 21.3 21.3 22 20.5 22H15"
        stroke="var(--lilac)"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <circle cx="16" cy="16" r="2.4" fill="white" />
    </svg>
  );
}
