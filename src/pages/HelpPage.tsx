import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Zap, BookTemplate, BarChart3, Lightbulb, Wand2 } from "lucide-react";

export default function HelpPage() {
  const { t } = useI18n();

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs h-8">
              <ArrowLeft className="h-3.5 w-3.5" />
              {t("backToHome")}
            </Button>
          </Link>
        </div>

        <div>
          <h1 className="text-xl sm:text-2xl font-bold">{t("helpTitle")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("helpSubtitle")}</p>
        </div>

        {/* Getting Started */}
        <Card>
          <CardHeader className="pb-2 px-4 sm:px-6">
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="h-4 w-4 text-violet-500" />
              {t("gettingStartedTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <p className="text-xs text-muted-foreground mb-3">{t("gettingStartedDesc")}</p>
            <ol className="space-y-2 text-xs text-muted-foreground">
              {t("gettingStartedSteps").split("\n").map((step, i) => (
                <li key={i} className="flex gap-2">
                  <span className="font-semibold text-foreground shrink-0">{i + 1}.</span>
                  <span>{step.replace(/^\d+\.\s*/, "")}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        {/* Enhancement Modes */}
        <Card>
          <CardHeader className="pb-2 px-4 sm:px-6">
            <CardTitle className="text-sm flex items-center gap-2">
              <Wand2 className="h-4 w-4 text-fuchsia-500" />
              {t("modesGuideTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 space-y-4">
            {[
              { title: t("quickModeTitle"), desc: t("quickModeDesc"), color: "text-violet-500" },
              { title: t("wizardModeTitle"), desc: t("wizardModeDesc"), color: "text-cyan-500" },
              { title: t("deepDiveTitle"), desc: t("deepDiveDesc"), color: "text-fuchsia-500" },
            ].map((mode, i) => (
              <div key={i}>
                <h4 className={`text-xs font-semibold ${mode.color} mb-1`}>{mode.title}</h4>
                <p className="text-xs text-muted-foreground">{mode.desc}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Templates & History */}
        <Card>
          <CardHeader className="pb-2 px-4 sm:px-6">
            <CardTitle className="text-sm flex items-center gap-2">
              <BookTemplate className="h-4 w-4 text-cyan-500" />
              {t("templatesGuideTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <p className="text-xs text-muted-foreground">{t("templatesGuideDesc")}</p>
          </CardContent>
        </Card>

        {/* Pro Tips */}
        <Card>
          <CardHeader className="pb-2 px-4 sm:px-6">
            <CardTitle className="text-sm flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              {t("tipsTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <ul className="space-y-2">
              {[t("tip1"), t("tip2"), t("tip3"), t("tip4"), t("tip5")].map((tip, i) => (
                <li key={i} className="text-xs text-muted-foreground flex gap-2">
                  <span className="text-amber-500 shrink-0">💡</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
