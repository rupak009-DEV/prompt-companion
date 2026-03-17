import { useState } from "react";
import { PROMPT_TEMPLATES, TEMPLATE_CATEGORIES } from "@/lib/templates";

interface Props {
  onSelect: (prompt: string, model: string) => void;
}

export function PromptTemplates({ onSelect }: Props) {
  const [category, setCategory] = useState<string>("all");

  const filtered = category === "all"
    ? PROMPT_TEMPLATES
    : PROMPT_TEMPLATES.filter((t) => t.category === category);

  return (
    <div className="space-y-3">
      <span className="text-xs font-medium text-muted-foreground">Quick Templates</span>

      {/* Category filter */}
      <div className="flex flex-wrap gap-1.5">
        {TEMPLATE_CATEGORIES.map((c) => (
          <button
            key={c.id}
            onClick={() => setCategory(c.id)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
              category === c.id
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border text-muted-foreground hover:text-foreground hover:border-primary/40"
            }`}
          >
            <span className="text-xs">{c.icon}</span>
            {c.label}
          </button>
        ))}
      </div>

      {/* Template grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {filtered.map((t) => (
          <button
            key={t.label}
            onClick={() => onSelect(t.prompt, t.model)}
            className="flex flex-col items-center gap-1.5 p-3 rounded-lg border border-border bg-card text-center text-xs hover:border-primary/50 hover:bg-primary/5 transition-all group"
          >
            <span className="text-lg group-hover:scale-110 transition-transform">{t.icon}</span>
            <span className="font-medium text-foreground truncate w-full">{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
