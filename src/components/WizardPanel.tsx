import { memo } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { WizardData } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";

interface Props {
  data: WizardData;
  onChange: (data: WizardData) => void;
}

const TONE_OPTIONS = ["Professional", "Casual", "Academic", "Creative", "Technical", "Friendly", "Authoritative", "Humorous"];
const FORMAT_OPTIONS = ["Paragraph", "Bullet points", "Step-by-step", "Code", "Table", "Conversation"];

function WizardPanelComponent({ data, onChange }: Props) {
  const update = (field: keyof WizardData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Prompt Context</p>

        <div>
          <label className="text-xs font-medium text-foreground mb-1 block">Intent / Goal</label>
          <Input
            value={data.intent}
            onChange={(e) => update("intent", e.target.value)}
            placeholder="What do you want to achieve? e.g. 'Generate a marketing email'"
            className="text-sm h-9"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-foreground mb-1 block">Target Audience</label>
          <Input
            value={data.audience}
            onChange={(e) => update("audience", e.target.value)}
            placeholder="Who is this for? e.g. 'B2B SaaS decision makers'"
            className="text-sm h-9"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-foreground mb-1 block">Tone</label>
          <div className="flex flex-wrap gap-1.5 mb-1.5">
            {TONE_OPTIONS.map((tone) => (
              <button
                key={tone}
                onClick={() => update("tone", tone.toLowerCase())}
                className={`text-[11px] px-2 py-1 rounded-full border transition-colors ${
                  data.tone === tone.toLowerCase()
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card border-border text-muted-foreground hover:border-primary/40"
                }`}
              >
                {tone}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-foreground mb-1 block">Output Format</label>
          <div className="flex flex-wrap gap-1.5 mb-1.5">
            {FORMAT_OPTIONS.map((fmt) => (
              <button
                key={fmt}
                onClick={() => update("format", fmt.toLowerCase())}
                className={`text-[11px] px-2 py-1 rounded-full border transition-colors ${
                  data.format === fmt.toLowerCase()
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card border-border text-muted-foreground hover:border-primary/40"
                }`}
              >
                {fmt}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-foreground mb-1 block">Constraints (optional)</label>
          <Textarea
            value={data.constraints}
            onChange={(e) => update("constraints", e.target.value)}
            placeholder="Any limits? e.g. 'Max 200 words, avoid jargon, include CTA'"
            className="text-sm resize-none min-h-[60px]"
          />
        </div>
      </CardContent>
    </Card>
  );
}

export const WizardPanel = memo(WizardPanelComponent);
