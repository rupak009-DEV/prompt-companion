import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EnhancementRecord, TARGET_MODELS } from "@/lib/types";
import * as storage from "@/lib/storage";
import { toast } from "@/hooks/use-toast";
import { Copy, Trash2, Star, Search, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const HistoryPage = () => {
  const [history, setHistory] = useState<EnhancementRecord[]>(storage.getHistory());
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");

  const filtered = history.filter((r) => {
    const matchesSearch = !search || r.originalPrompt.toLowerCase().includes(search.toLowerCase()) || r.enhancedPrompt.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" || (filter === "favorites" && r.isFavorite) || r.targetModel === filter;
    return matchesSearch && matchesFilter;
  });

  const toggleFavorite = (id: string) => {
    const record = history.find((r) => r.id === id);
    if (!record) return;
    const updated = { ...record, isFavorite: !record.isFavorite };
    storage.updateRecord(updated);
    setHistory(storage.getHistory());
  };

  const deleteRecord = (id: string) => {
    storage.deleteRecord(id);
    setHistory(storage.getHistory());
    toast({ title: "Deleted" });
  };

  const copyText = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast({ title: "Copied!" });
  };

  const clearAll = () => {
    storage.clearHistory();
    setHistory([]);
    toast({ title: "History cleared" });
  };

  const modelFromId = (id: string) => TARGET_MODELS.find((m) => m.id === id);

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-3 sm:space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold">History</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">{history.length} enhancements</p>
          </div>
          {history.length > 0 && (
            <Button variant="outline" size="sm" onClick={clearAll} className="text-destructive text-xs shrink-0 h-8 px-2.5 sm:px-3">
              <Trash2 className="h-3 w-3 sm:mr-1.5" />
              <span className="hidden sm:inline">Clear All</span>
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search prompts..."
              className="pl-8 h-9 text-sm"
            />
          </div>
          <div className="flex gap-1 flex-wrap">
            {[{ id: "all", label: "All" }, { id: "favorites", label: "⭐ Fav" }, ...TARGET_MODELS.map((m) => ({ id: m.id, label: m.icon }))].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`text-[10px] sm:text-xs px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-md border transition-colors ${
                  filter === f.id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card border-border text-muted-foreground hover:border-primary/40"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Records */}
        <AnimatePresence>
          {filtered.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 sm:py-16">
                <Clock className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground mb-3 opacity-30" />
                <p className="text-xs sm:text-sm text-muted-foreground">No enhancements yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {filtered.map((record) => {
                const model = modelFromId(record.targetModel);
                return (
                  <motion.div
                    key={record.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <Card>
                      <CardContent className="p-3 sm:p-4 space-y-2 sm:space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                            <span className="text-base sm:text-lg">{model?.icon || "🤖"}</span>
                            <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                              {model?.label || record.targetModel} · {record.mode} · {new Date(record.timestamp).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-0.5 shrink-0">
                            <Button variant="ghost" size="icon" className="h-6 w-6 sm:h-7 sm:w-7" onClick={() => toggleFavorite(record.id)}>
                              <Star className={`h-3 w-3 sm:h-3.5 sm:w-3.5 ${record.isFavorite ? "text-warning fill-warning" : ""}`} />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6 sm:h-7 sm:w-7" onClick={() => deleteRecord(record.id)}>
                              <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-destructive" />
                            </Button>
                          </div>
                        </div>

                        <div className="grid gap-2 sm:gap-3 sm:grid-cols-2">
                          <div className="space-y-1">
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Original</p>
                            <p className="text-[11px] sm:text-xs text-muted-foreground line-clamp-3 bg-muted/50 p-2 rounded-md">{record.originalPrompt}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Enhanced</p>
                            <div className="relative">
                              <p className="text-[11px] sm:text-xs text-foreground line-clamp-3 bg-muted/50 p-2 rounded-md pr-7">{record.enhancedPrompt}</p>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5 sm:h-6 sm:w-6 absolute top-1 right-1"
                                onClick={() => copyText(record.enhancedPrompt)}
                              >
                                <Copy className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
};

export default HistoryPage;
