import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface RatingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actionType: "copy" | "save" | "export";
  originalPrompt: string;
  enhancedPrompt: string;
  targetModel: string;
  mode: string;
  aiModelUsed?: string;
  generationTimeMs?: number;
  onRated: () => void;
}

export function RatingDialog({
  open,
  onOpenChange,
  actionType,
  originalPrompt,
  enhancedPrompt,
  targetModel,
  mode,
  aiModelUsed,
  generationTimeMs,
  onRated,
}: RatingDialogProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) return;
    setSubmitting(true);

    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from("prompt_ratings" as any).insert({
      user_id: user?.id || null,
      rating,
      original_prompt: originalPrompt?.slice(0, 2000) || null,
      enhanced_prompt: enhancedPrompt.slice(0, 5000),
      target_model: targetModel,
      mode,
      action_type: actionType,
      ai_model_used: aiModelUsed || null,
      generation_time_ms: generationTimeMs || null,
    } as any);

    if (error) {
      toast({ title: "Failed to save rating", variant: "destructive" });
    } else {
      toast({ title: "Thanks for your feedback!" });
    }

    setSubmitting(false);
    setRating(0);
    setHoveredRating(0);
    onOpenChange(false);
    onRated();
  };

  const actionLabel = actionType === "copy" ? "Copy" : actionType === "save" ? "Save" : "Export";
  const displayRating = hoveredRating || rating;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Rate this enhancement</DialogTitle>
          <DialogDescription>
            How would you rate the quality of this enhanced prompt?
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="p-1 transition-transform hover:scale-110 focus:outline-none"
              >
                <Star
                  className={cn(
                    "h-8 w-8 transition-colors",
                    star <= displayRating
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-muted-foreground/30"
                  )}
                />
              </button>
            ))}
          </div>
          {displayRating > 0 && (
            <p className="text-sm text-muted-foreground">
              {displayRating === 1 && "Poor"}
              {displayRating === 2 && "Fair"}
              {displayRating === 3 && "Good"}
              {displayRating === 4 && "Very Good"}
              {displayRating === 5 && "Excellent"}
            </p>
          )}
          <Button
            onClick={handleSubmit}
            disabled={rating === 0 || submitting}
            className="w-full"
          >
            {submitting ? "Submitting..." : `Rate & ${actionLabel}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
