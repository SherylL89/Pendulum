/** Placeholder product visual: a flat color block derived from the product's hue seed.
 *  Swap for real images once ingestion provides them. */
export default function Swatch({ hue, className = "" }: { hue: number; className?: string }) {
  return (
    <div
      className={`rounded-lg ${className}`}
      style={{
        background: `linear-gradient(135deg, hsl(${hue} 25% 88%), hsl(${hue} 35% 72%))`,
      }}
    />
  );
}
