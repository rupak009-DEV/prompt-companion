import { useI18n, LOCALES, SupportedLocale } from "@/lib/i18n";
import { Globe } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function LocaleSwitcher({ variant = "landing" }: { variant?: "landing" | "app" }) {
  const { locale, setLocale } = useI18n();
  const [open, setOpen] = useState(false);

  const isLanding = variant === "landing";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`gap-1.5 text-xs h-8 px-2 ${
            isLanding
              ? "text-landing-text-muted hover:text-landing-text"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Globe className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{locale.flag} {locale.code.toUpperCase()}</span>
          <span className="sm:hidden">{locale.flag}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={`w-48 p-1 ${isLanding ? "bg-landing-card border-landing-text/10" : ""}`}
        align="end"
      >
        <div className="max-h-64 overflow-y-auto">
          {LOCALES.map((l) => (
            <button
              key={l.code}
              onClick={() => {
                setLocale(l.code as SupportedLocale);
                setOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs rounded-md transition-colors ${
                locale.code === l.code
                  ? isLanding
                    ? "bg-violet-500/20 text-landing-text"
                    : "bg-primary/10 text-foreground"
                  : isLanding
                    ? "text-landing-text-muted hover:text-landing-text hover:bg-landing-text/5"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              <span>{l.flag}</span>
              <span>{l.label}</span>
              <span className="ml-auto text-[10px] opacity-60">{l.currency}</span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
