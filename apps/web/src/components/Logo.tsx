/** Pendulum wordmark: plain type, heavy rounded sans. Size via `text-*` on the parent. */
export default function Logo({ className = "", light = false }: { className?: string; light?: boolean }) {
  return (
    <span
      className={`font-display font-extrabold tracking-tight leading-none ${light ? "text-white" : "text-ink"} ${className}`}
    >
      Pendulum
    </span>
  );
}
