import { memo } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal } from "lucide-react";
import { PromptParameters } from "@/lib/types";

const LANGUAGES = [
  "English", "Spanish", "French", "German", "Italian", "Portuguese",
  "Chinese", "Japanese", "Korean", "Arabic", "Hindi", "Russian",
  "Dutch", "Swedish", "Turkish", "Polish",
];

interface Props {
  data: PromptParameters;
  onChange: (data: PromptParameters) => void;
}

function ParametersPanelComponent({ data, onChange }: Props) {
  const update = (field: keyof PromptParameters, value: string) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="h-10 w-10 shrink-0">
          <SlidersHorizontal className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-4 space-y-4" align="end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider">Parameters</p>
          <p className="text-xs text-muted-foreground mt-0.5">Fine-tune the output prompt.</p>
        </div>

        <div>
          <label className="text-xs font-medium text-foreground mb-1 block">Language</label>
          <Select value={data.language} onValueChange={(v) => update("language", v)}>
            <SelectTrigger className="text-sm h-9">
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((lang) => (
                <SelectItem key={lang} value={lang}>
                  {lang}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-xs font-medium text-foreground mb-1 block">Word Limit</label>
          <Input
            type="number"
            value={data.wordLimit}
            onChange={(e) => update("wordLimit", e.target.value)}
            placeholder="Max words..."
            className="text-sm h-9"
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}

export const ParametersPanel = memo(ParametersPanelComponent);
