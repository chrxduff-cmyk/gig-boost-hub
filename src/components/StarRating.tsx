import { Star } from "lucide-react";
import { useState } from "react";

export function StarRating({
  value,
  onChange,
  size = 20,
  readOnly = false,
}: {
  value: number;
  onChange?: (v: number) => void;
  size?: number;
  readOnly?: boolean;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const display = hover ?? value;
  return (
    <div
      className="inline-flex items-center gap-0.5"
      onMouseLeave={() => setHover(null)}
      role={readOnly ? "img" : "radiogroup"}
      aria-label={`${value} de 5 estrelas`}
    >
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = i <= Math.round(display);
        return (
          <button
            key={i}
            type="button"
            disabled={readOnly}
            onMouseEnter={() => !readOnly && setHover(i)}
            onClick={() => !readOnly && onChange?.(i)}
            className={`${readOnly ? "cursor-default" : "cursor-pointer"} p-0.5 transition`}
            aria-label={`${i} estrela${i > 1 ? "s" : ""}`}
          >
            <Star
              style={{ width: size, height: size }}
              className={filled ? "fill-gold text-gold" : "text-muted-foreground/40"}
            />
          </button>
        );
      })}
    </div>
  );
}

export function StarsDisplay({ value, count, size = 14 }: { value: number; count?: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-sm">
      <Star style={{ width: size, height: size }} className="fill-gold text-gold" />
      <span className="font-semibold">{value > 0 ? value.toFixed(1) : "—"}</span>
      {typeof count === "number" && (
        <span className="text-xs text-muted-foreground">({count})</span>
      )}
    </span>
  );
}
