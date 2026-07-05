/** Pendulum wordmark, faithful to the original: heavy rounded sans with the
 *  chart-line "P" mark. Size via the `text-*` class on the parent. */
export default function Logo({ className = "", light = false }: { className?: string; light?: boolean }) {
  const ink = light ? "#ffffff" : "#141414";
  return (
    <span className={`inline-flex items-center gap-[0.18em] font-display font-extrabold tracking-tight leading-none ${className}`} style={{ color: ink }}>
      {/* P mark: bowl with chart-line cutout */}
      <svg viewBox="0 0 100 118" className="h-[1.05em] w-auto" aria-hidden="true">
        <path
          d="M14 4 h44 a38 38 0 0 1 0 76 h-24 v34 h-20 z"
          fill={ink}
        />
        {/* zigzag chart line through the bowl */}
        <path
          d="M6 46 L34 24 L48 40 L78 16"
          fill="none"
          stroke={light ? "#141414" : "#ffffff"}
          strokeWidth="13"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span>endulum</span>
    </span>
  );
}
