import type { Recognition, RecognitionCategory } from "@/lib/promptParser";

const CATEGORY_STYLE: Record<RecognitionCategory, { bg: string; border: string; text: string; dot: string; label: string }> = {
  shape:     { bg: "bg-violet-500/10",  border: "border-violet-500/30",  text: "text-violet-300",  dot: "bg-violet-400",  label: "FORME"    },
  material:  { bg: "bg-blue-500/10",    border: "border-blue-500/30",    text: "text-blue-300",    dot: "bg-blue-400",    label: "MATIÈRE"  },
  color:     { bg: "bg-white/5",        border: "border-white/10",       text: "text-white/70",    dot: "bg-white",       label: "COULEUR"  },
  animation: { bg: "bg-green-500/10",   border: "border-green-500/30",   text: "text-green-300",   dot: "bg-green-400",   label: "ANIM"     },
  mood:      { bg: "bg-orange-500/10",  border: "border-orange-500/30",  text: "text-orange-300",  dot: "bg-orange-400",  label: "AMBIANCE" },
  modifier:  { bg: "bg-white/5",        border: "border-white/10",       text: "text-white/40",    dot: "bg-white/40",    label: "MODIF"    },
  scene:     { bg: "bg-yellow-500/10",  border: "border-yellow-500/30",  text: "text-yellow-300",  dot: "bg-yellow-400",  label: "SCÈNE"    },
  count:     { bg: "bg-pink-500/10",    border: "border-pink-500/30",    text: "text-pink-300",    dot: "bg-pink-400",    label: "QTÉ"      },
};

interface Props {
  recognitions: Recognition[];
}

export function RecognitionPanel({ recognitions }: Props) {
  if (recognitions.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 mt-3 max-w-4xl mx-auto">
      <span className="text-[9px] uppercase tracking-[0.25em] text-white/20 shrink-0 pr-1">
        Reconnu
      </span>
      {recognitions.map((rec, i) => {
        const s = CATEGORY_STYLE[rec.category];
        const isColor = rec.category === "color" && rec.hex;
        return (
          <span
            key={i}
            className={`inline-flex items-center gap-1.5 px-2 py-1 rounded border text-[10px] font-mono
              ${s.bg} ${s.border} ${s.text}
              animate-in fade-in slide-in-from-bottom-1 duration-300`}
            style={{ animationDelay: `${i * 40}ms`, animationFillMode: "both" }}
          >
            {isColor ? (
              <span
                className="w-2 h-2 rounded-full border border-white/20 shrink-0"
                style={{ backgroundColor: rec.hex }}
              />
            ) : (
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.dot}`} />
            )}
            <span className="text-white/30 text-[8px] uppercase tracking-wider">{s.label}</span>
            <span className="font-semibold tracking-wide">{rec.label}</span>
          </span>
        );
      })}
    </div>
  );
}
