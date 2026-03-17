import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, Pencil } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { PromptTemplate, saveCustomTemplate, updateCustomTemplate } from "@/lib/templates";
import { TARGET_MODELS } from "@/lib/types";

const ICONS = ["📝", "💡", "🚀", "🔧", "🎨", "📊", "🤖", "⚡", "🧪", "📌"];

interface Props {
  onSaved: () => void;
  editTemplate?: PromptTemplate | null;
  onEditDone?: () => void;
}

export function CreateTemplateDialog({ onSaved, editTemplate, onEditDone }: Props) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [prompt, setPrompt] = useState("");
  const [icon, setIcon] = useState("📝");
  const [model, setModel] = useState("chatgpt");
  const [category, setCategory] = useState<"chat" | "code" | "image" | "marketing">("chat");

  const isEditing = !!editTemplate;

  useEffect(() => {
    if (editTemplate) {
      setLabel(editTemplate.label);
      setPrompt(editTemplate.prompt);
      setIcon(editTemplate.icon);
      setModel(editTemplate.model);
      setCategory(editTemplate.category);
      setOpen(true);
    }
  }, [editTemplate]);

  const resetForm = () => {
    setLabel("");
    setPrompt("");
    setIcon("📝");
    setModel("chatgpt");
    setCategory("chat");
  };

  const handleOpenChange = (value: boolean) => {
    setOpen(value);
    if (!value) {
      resetForm();
      onEditDone?.();
    }
  };

  const handleSave = () => {
    if (!label.trim() || !prompt.trim()) {
      toast({ title: "Please fill in name and prompt", variant: "destructive" });
      return;
    }

    if (isEditing && editTemplate) {
      updateCustomTemplate({
        ...editTemplate,
        icon,
        label: label.trim(),
        prompt: prompt.trim(),
        model,
        category,
      });
      toast({ title: "Template updated!" });
    } else {
      const template: PromptTemplate = {
        id: `custom-${Date.now()}`,
        icon,
        label: label.trim(),
        prompt: prompt.trim(),
        model,
        category,
        isCustom: true,
      };
      saveCustomTemplate(template);
      toast({ title: "Template saved!" });
    }

    onSaved();
    handleOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {!isEditing && (
        <DialogTrigger asChild>
          <button className="flex items-center gap-1.5 w-full px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <Plus className="h-3.5 w-3.5" />
            New Template
          </button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Template" : "Create Custom Template"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          {/* Icon picker */}
          <div>
            <Label className="text-xs">Icon</Label>
            <div className="flex gap-1.5 mt-1.5">
              {ICONS.map((ic) => (
                <button
                  key={ic}
                  onClick={() => setIcon(ic)}
                  className={`w-8 h-8 rounded-md border text-base flex items-center justify-center transition-colors ${
                    icon === ic ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"
                  }`}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <Label htmlFor="tpl-name" className="text-xs">Template Name</Label>
            <Input
              id="tpl-name"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Product Description"
              className="mt-1.5"
            />
          </div>

          {/* Prompt */}
          <div>
            <Label htmlFor="tpl-prompt" className="text-xs">Prompt Text</Label>
            <Textarea
              id="tpl-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Write the detailed prompt that will be used as a starting point..."
              className="mt-1.5 min-h-[120px] text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Category */}
            <div>
              <Label className="text-xs">Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as typeof category)}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="chat">💬 Chat</SelectItem>
                  <SelectItem value="code">⌨️ Code</SelectItem>
                  <SelectItem value="image">🖼️ Image</SelectItem>
                  <SelectItem value="marketing">📣 Marketing</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Target Model */}
            <div>
              <Label className="text-xs">Target Model</Label>
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TARGET_MODELS.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.icon} {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={handleSave} className="w-full">
            {isEditing ? "Update Template" : "Save Template"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
