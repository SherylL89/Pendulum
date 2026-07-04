/** Product visual: real image when ingestion has stored one (R2), hue swatch otherwise. */
export default function Swatch({ hue, src, className = "" }: { hue: number; src?: string; className?: string }) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" className={`rounded-lg object-cover ${className}`} />;
  }
  return (
    <div
      className={`rounded-lg ${className}`}
      style={{
        background: `linear-gradient(135deg, hsl(${hue} 25% 88%), hsl(${hue} 35% 72%))`,
      }}
    />
  );
}
