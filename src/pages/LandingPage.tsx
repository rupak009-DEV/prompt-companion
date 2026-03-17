import { useState, useRef, useEffect } from "react";
import logo from "@/assets/logo.png";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { 
  Wand2, ArrowRight, Check, Target, Search, Zap, 
  User, Link2, BookTemplate, Globe, PenTool, Code,
  Smartphone, Chrome, Facebook, Instagram, Youtube, Share2, Mail
} from "lucide-react";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { useAuth } from "@/hooks/use-auth";
import { ProfileDropdown } from "@/components/ProfileDropdown";
import { z } from "zod";

function ScrollReveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function LandingPage() {
  const [isYearly, setIsYearly] = useState(false);
  const [email, setEmail] = useState("");
  const [emailStatus, setEmailStatus] = useState<"idle" | "success" | "error">("idle");
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, -80]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.25], [1, 0]);
  const { t, formatPrice, locale } = useI18n();
  const { user, loading: authLoading } = useAuth();

  const emailSchema = z.string().trim().email().max(255);

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = emailSchema.safeParse(email);
    if (!result.success) {
      setEmailStatus("error");
      return;
    }
    // Store locally for now
    const subs = JSON.parse(localStorage.getItem("pe_newsletter") || "[]");
    if (!subs.includes(result.data)) {
      subs.push(result.data);
      localStorage.setItem("pe_newsletter", JSON.stringify(subs));
    }
    setEmailStatus("success");
    setEmail("");
    setTimeout(() => setEmailStatus("idle"), 3000);
  };

  useEffect(() => {
    document.documentElement.style.scrollBehavior = "smooth";
    return () => { document.documentElement.style.scrollBehavior = ""; };
  }, []);

  return (
    <div className="min-h-screen bg-landing text-landing-text overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-landing/80 backdrop-blur-md border-b border-landing-text/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="#" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <img src={logo} alt="Prompt Engineer" className="h-8 w-auto" />
          </a>
          <div className="hidden md:flex items-center gap-8">
            <a href="#" className="text-sm text-landing-text-muted hover:text-landing-text transition-colors">{t("navHome")}</a>
            <a href="#features" className="text-sm text-landing-text-muted hover:text-landing-text transition-colors">{t("navAbout")}</a>
            <a href="#modes" className="text-sm text-landing-text-muted hover:text-landing-text transition-colors">{t("navFeatures")}</a>
            <a href="#pricing" className="text-sm text-landing-text-muted hover:text-landing-text transition-colors">{t("navPricing")}</a>
            <a href="#contact" className="text-sm text-landing-text-muted hover:text-landing-text transition-colors">{t("navContact")}</a>
          </div>
          <div className="flex items-center gap-2">
            <LocaleSwitcher variant="landing" />
            {!authLoading && !user && (
              <>
                <Link to="/auth">
                  <Button variant="ghost" size="sm" className="text-landing-text-muted hover:text-landing-text text-sm">
                    Sign In
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button size="sm" className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-primary-foreground border-0 text-sm">
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
            {!authLoading && user && (
              <>
                <Link to="/app">
                  <Button size="sm" className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-primary-foreground border-0">
                    {t("launchApp")}
                  </Button>
                </Link>
                <ProfileDropdown />
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6" ref={heroRef}>
        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="max-w-4xl mx-auto text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-5xl md:text-6xl font-bold mb-6 leading-tight text-landing-text"
          >
            {t("heroTitle1")}
            <br />
            <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 text-transparent bg-clip-text">
              {t("heroTitle2")}
            </span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.6 }}
            className="text-lg text-landing-text-muted max-w-2xl mx-auto mb-4"
          >
            {t("heroDesc1")}{" "}
            <span className="text-fuchsia-400 font-semibold">{t("heroDesc2")}</span>{" "}
            {t("heroDesc3")}{" "}
            <span className="text-landing-text font-semibold">{t("heroDesc4")}</span>{" "}
            {t("heroDesc5")}{" "}
            <span className="text-cyan-400 underline underline-offset-2">{t("heroDesc6")}</span>.
          </motion.p>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="text-sm text-landing-text-muted mb-8"
          >
            {t("heroTagline")}
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4"
          >
            <Link to="/app" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-primary-foreground border-0 gap-2">
                {t("tryApp")} <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <a href="#features" className="w-full sm:w-auto">
              <Button variant="ghost" size="lg" className="w-full sm:w-auto text-landing-text-muted hover:text-landing-text">
                {t("seeHow")}
              </Button>
            </a>
          </motion.div>
        </motion.div>

        {/* App Preview */}
        <motion.div 
          initial={{ opacity: 0, y: 60, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.7 }}
          className="max-w-5xl mx-auto mt-16"
        >
          <div className="rounded-2xl border border-landing-text/10 bg-landing-card p-4 shadow-2xl">
            <div className="rounded-xl bg-landing-card-alt h-[400px] flex items-center justify-center text-landing-text-muted">
              {t("appPreview")}
            </div>
          </div>
        </motion.div>
      </section>

      {/* Why Prompt Engineering */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <ScrollReveal>
              <div>
                <h2 className="text-3xl font-bold mb-6 text-landing-text">{t("whyTitle")}</h2>
                <p className="text-landing-text-muted mb-6 leading-relaxed">{t("whyP1")}</p>
                <p className="text-landing-text-muted mb-8 leading-relaxed">{t("whyP2")}</p>
                <ul className="space-y-3">
                  {([t("whyF1"), t("whyF2"), t("whyF3"), t("whyF4")]).map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-landing-text-muted">
                      <div className="h-5 w-5 rounded-full bg-violet-500/20 flex items-center justify-center">
                        <Check className="h-3 w-3 text-violet-400" />
                      </div>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={0.2}>
              <div className="space-y-4">
                <Card className="p-4 bg-landing-card border-landing-text/10">
                  <p className="text-xs text-fuchsia-400 uppercase tracking-wider mb-2">{t("before")}</p>
                  <p className="text-landing-text-muted font-mono text-sm">{t("beforeText")}</p>
                </Card>
                <div className="flex justify-center">
                  <div className="h-8 w-8 rounded-full bg-violet-500/20 flex items-center justify-center">
                    <ArrowRight className="h-4 w-4 text-violet-400 rotate-90" />
                  </div>
                </div>
                <Card className="p-4 bg-landing-card border-landing-text/10">
                  <p className="text-xs text-cyan-400 uppercase tracking-wider mb-2">{t("after")}</p>
                  <p className="text-landing-text-muted font-mono text-sm leading-relaxed">{t("afterText")}</p>
                </Card>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Enhancement Modes */}
      <section id="modes" className="py-20 px-6 bg-landing-alt">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3 text-landing-text">{t("modesTitle")}</h2>
            <p className="text-landing-text-muted">{t("modesDesc")}</p>
          </ScrollReveal>
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {[
              { icon: Target, title: t("mode1Title"), desc: t("mode1Desc") },
              { icon: Search, title: t("mode2Title"), desc: t("mode2Desc") },
              { icon: Zap, title: t("mode3Title"), desc: t("mode3Desc") },
            ].map((mode, i) => (
              <ScrollReveal key={i} delay={i * 0.1}>
                <Card className="p-6 bg-landing-card border-landing-text/10 hover:border-violet-500/30 transition-all hover:-translate-y-1 duration-300">
                  <div className="h-10 w-10 rounded-xl bg-violet-500/10 flex items-center justify-center mb-4">
                    <mode.icon className="h-5 w-5 text-violet-400" />
                  </div>
                  <h3 className="font-semibold text-base mb-2 text-landing-text">{mode.title}</h3>
                  <p className="text-sm text-landing-text-muted">{mode.desc}</p>
                </Card>
              </ScrollReveal>
            ))}
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: User, title: t("mode4Title"), desc: t("mode4Desc") },
              { icon: Link2, title: t("mode5Title"), desc: t("mode5Desc") },
              { icon: BookTemplate, title: t("mode6Title"), desc: t("mode6Desc") },
            ].map((mode, i) => (
              <ScrollReveal key={i} delay={i * 0.1}>
                <Card className="p-6 bg-landing-card border-landing-text/10 hover:border-violet-500/30 transition-all hover:-translate-y-1 duration-300">
                  <div className="h-10 w-10 rounded-xl bg-cyan-500/10 flex items-center justify-center mb-4">
                    <mode.icon className="h-5 w-5 text-cyan-400" />
                  </div>
                  <h3 className="font-semibold text-base mb-2 text-landing-text">{mode.title}</h3>
                  <p className="text-sm text-landing-text-muted">{mode.desc}</p>
                </Card>
              </ScrollReveal>
            ))}
          </div>
          <div className="grid md:grid-cols-3 gap-6 mt-6">
            {[
              { icon: Globe, title: t("mode7Title"), desc: t("mode7Desc") },
              { icon: PenTool, title: t("mode8Title"), desc: t("mode8Desc") },
              { icon: Code, title: t("mode9Title"), desc: t("mode9Desc") },
            ].map((mode, i) => (
              <ScrollReveal key={i} delay={i * 0.1}>
                <Card className="p-6 bg-landing-card border-landing-text/10 hover:border-violet-500/30 transition-all hover:-translate-y-1 duration-300">
                  <div className="h-10 w-10 rounded-xl bg-fuchsia-500/10 flex items-center justify-center mb-4">
                    <mode.icon className="h-5 w-5 text-fuchsia-400" />
                  </div>
                  <h3 className="font-semibold text-base mb-2 text-landing-text">{mode.title}</h3>
                  <p className="text-sm text-landing-text-muted">{mode.desc}</p>
                </Card>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Take it Everywhere */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <ScrollReveal>
            <h2 className="text-3xl font-bold mb-3 text-landing-text">{t("everywhereTitle")}</h2>
            <p className="text-landing-text-muted mb-12">{t("everywhereDesc")}</p>
          </ScrollReveal>
          <div className="grid md:grid-cols-2 gap-6 auto-rows-fr">
            <ScrollReveal delay={0.1}>
              <Card className="p-8 bg-landing-card border-landing-text/10 hover:border-violet-500/30 transition-all duration-300 h-full flex flex-col items-center">
                <div className="h-12 w-12 rounded-xl bg-violet-500/10 flex items-center justify-center mx-auto mb-4">
                  <Smartphone className="h-6 w-6 text-violet-400" />
                </div>
                <h3 className="font-semibold text-lg mb-2 text-landing-text">{t("mobileApps")}</h3>
                <p className="text-xs text-fuchsia-400 mb-4">{t("comingSoon")}</p>
                <div className="flex flex-wrap justify-center gap-2 mt-auto">
                  <Button size="sm" className="text-xs bg-violet-600 hover:bg-violet-500 text-primary-foreground border-0">{t("iosStore")}</Button>
                  <Button size="sm" className="text-xs bg-violet-600 hover:bg-violet-500 text-primary-foreground border-0">{t("googlePlay")}</Button>
                  <Button size="sm" className="text-xs bg-violet-600 hover:bg-violet-500 text-primary-foreground border-0">{t("otherStores")}</Button>
                </div>
              </Card>
            </ScrollReveal>
            <ScrollReveal delay={0.2}>
              <Card className="p-8 bg-landing-card border-landing-text/10 hover:border-cyan-500/30 transition-all duration-300 h-full flex flex-col items-center">
                <div className="h-12 w-12 rounded-xl bg-cyan-500/10 flex items-center justify-center mx-auto mb-4">
                  <Chrome className="h-6 w-6 text-cyan-400" />
                </div>
                <h3 className="font-semibold text-lg mb-2 text-landing-text">{t("browserExt")}</h3>
                <p className="text-xs text-fuchsia-400 mb-4">{t("comingSoon")}</p>
                <div className="flex flex-wrap justify-center gap-2 mt-auto">
                  <Button size="sm" className="text-xs bg-cyan-600 hover:bg-cyan-500 text-primary-foreground border-0">{t("chromeStore")}</Button>
                  <Button size="sm" className="text-xs bg-cyan-600 hover:bg-cyan-500 text-primary-foreground border-0">{t("firefoxAddons")}</Button>
                  <Button size="sm" className="text-xs bg-cyan-600 hover:bg-cyan-500 text-primary-foreground border-0">{t("otherBrowsers")}</Button>
                </div>
              </Card>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-6 bg-landing-alt">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3 text-landing-text">{t("pricingTitle")}</h2>
            <p className="text-landing-text-muted mb-6">{t("pricingDesc")}</p>
            <div className="flex items-center justify-center gap-4">
              <span className={`text-sm font-medium ${!isYearly ? 'text-landing-text' : 'text-landing-text-muted'}`}>{t("monthly")}</span>
              <Switch checked={isYearly} onCheckedChange={setIsYearly} className="data-[state=checked]:bg-violet-600 data-[state=unchecked]:bg-landing-text-muted" />
              <span className={`text-sm font-medium ${isYearly ? 'text-landing-text' : 'text-landing-text-muted'}`}>{t("yearly")}</span>
              {isYearly && <span className="text-xs text-fuchsia-400 font-medium">{t("save15")}</span>}
            </div>
          </ScrollReveal>
          <div className="grid md:grid-cols-3 gap-6 auto-rows-fr">
            <ScrollReveal delay={0}>
              <Card className="p-6 bg-landing-card border-landing-text/10 h-full flex flex-col">
                <p className="text-sm text-landing-text-muted mb-2">{t("starter")}</p>
                <p className="text-4xl font-bold text-landing-text mb-6">{t("free")}</p>
                <ul className="space-y-3 mb-8 text-sm flex-1">
                  {[t("starterF1"), t("starterF2"), t("starterF3"), t("starterF4"), t("starterF5"), t("starterF6"), t("starterF7")].map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-landing-text-muted">
                      <Check className="h-4 w-4 text-violet-400" /> {f}
                    </li>
                  ))}
                </ul>
                <Button className="w-full bg-violet-600/20 text-violet-300 hover:bg-violet-600 hover:text-primary-foreground border border-violet-500/30 transition-colors mt-auto">{t("startFree")}</Button>
              </Card>
            </ScrollReveal>
            <ScrollReveal delay={0.1}>
              <Card className="p-6 bg-landing-card border-violet-500/50 relative h-full flex flex-col">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-primary-foreground text-xs px-3 py-1 rounded-full">{t("popular")}</div>
                <p className="text-sm text-landing-text-muted mb-2">{t("pro")}</p>
                <p className="text-4xl font-bold text-landing-text mb-1">{formatPrice(isYearly)}<span className="text-lg font-normal text-landing-text-muted">{t("perMonth")}</span></p>
                {isYearly && <p className="text-xs text-landing-text-muted mb-4">{t("billedAnnually")}</p>}
                <ul className="space-y-3 mb-8 text-sm mt-4 flex-1">
                  {[t("proF1"), t("proF2"), t("proF3"), t("proF4"), t("proF5"), t("proF6"), t("proF7"), t("proF8")].map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-landing-text-muted">
                      <Check className="h-4 w-4 text-violet-400" /> {f}
                    </li>
                  ))}
                </ul>
                <Button className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-primary-foreground border-0 mt-auto">{t("goPro")}</Button>
              </Card>
            </ScrollReveal>
            <ScrollReveal delay={0.2}>
              <Card className="p-6 bg-landing-card border-landing-text/10 h-full flex flex-col">
                <p className="text-sm text-landing-text-muted mb-2">{t("enterprise")}</p>
                <p className="text-4xl font-bold text-landing-text mb-6">{t("custom")}</p>
                <ul className="space-y-3 mb-8 text-sm flex-1">
                  {[t("entF1"), t("entF2"), t("entF3"), t("entF4"), t("entF5")].map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-landing-text-muted">
                      <Check className="h-4 w-4 text-cyan-400" /> {f}
                    </li>
                  ))}
                </ul>
                <Button className="w-full bg-cyan-600/20 text-cyan-300 hover:bg-cyan-600 hover:text-primary-foreground border border-cyan-500/30 transition-colors mt-auto">{t("contactUs")}</Button>
              </Card>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* FAQ + Newsletter */}
      <section className="py-12 px-6">
        <div className="max-w-3xl mx-auto">
          <ScrollReveal className="text-center mb-8">
            <h2 className="text-2xl font-bold text-landing-text">{t("faqTitle")}</h2>
          </ScrollReveal>
          <Accordion type="single" collapsible className="w-full space-y-2">
            {[
              { q: t("faq1Q"), a: t("faq1A") },
              { q: t("faq2Q"), a: t("faq2A") },
              { q: t("faq3Q"), a: t("faq3A") },
              { q: t("faq4Q"), a: t("faq4A") },
            ].map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border-b border-landing-text/10">
                <AccordionTrigger className="py-3 text-sm font-medium text-landing-text hover:text-landing-text/80">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-xs text-landing-text-muted pb-3">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          {/* Newsletter */}
          <ScrollReveal delay={0.1}>
            <Card className="mt-8 p-6 bg-landing-card border-landing-text/10 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Mail className="h-4 w-4 text-violet-400" />
                <h3 className="font-semibold text-sm text-landing-text">{t("newsletterTitle")}</h3>
              </div>
              <p className="text-xs text-landing-text-muted mb-4">{t("newsletterDesc")}</p>
              <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setEmailStatus("idle"); }}
                  placeholder={t("newsletterPlaceholder")}
                  className="flex-1 h-9 text-sm bg-landing-card-alt border-landing-text/10 text-landing-text placeholder:text-landing-text-muted"
                  maxLength={255}
                />
                <Button type="submit" size="sm" className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-primary-foreground border-0 h-9 px-6">
                  {t("newsletterButton")}
                </Button>
              </form>
              {emailStatus === "success" && (
                <p className="text-xs text-emerald-400 mt-2">{t("newsletterSuccess")}</p>
              )}
              {emailStatus === "error" && (
                <p className="text-xs text-red-400 mt-2">{t("newsletterInvalid")}</p>
              )}
            </Card>
          </ScrollReveal>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="py-16 px-6 border-t border-landing-text/5">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-10">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img src={logo} alt="Prompt Engineer" className="h-8 w-auto" />
              </div>
              <p className="text-sm text-landing-text-muted mb-4">{t("footerDesc")}</p>
              <div className="flex gap-3">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-landing-text-muted hover:text-landing-text">
                  <Facebook className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-landing-text-muted hover:text-landing-text">
                  <Instagram className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-landing-text-muted hover:text-landing-text">
                  <Youtube className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-landing-text-muted hover:text-landing-text">
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-4 text-landing-text">{t("product")}</h4>
              <ul className="space-y-2 text-sm text-landing-text-muted">
                <li><a href="#features" className="hover:text-landing-text transition-colors">{t("features")}</a></li>
                <li><a href="#pricing" className="hover:text-landing-text transition-colors">{t("pricing")}</a></li>
                <li><Link to="/app" className="hover:text-landing-text transition-colors">{t("app")}</Link></li>
                <li><a href="#" className="hover:text-landing-text transition-colors">{t("referral")}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-4 text-landing-text">{t("support")}</h4>
              <ul className="space-y-2 text-sm text-landing-text-muted">
                <li><a href="#" className="hover:text-landing-text transition-colors">{t("contactSupport")}</a></li>
                <li><Link to="/help" className="hover:text-landing-text transition-colors">{t("helpDocs")}</Link></li>
                <li><a href="#" className="hover:text-landing-text transition-colors">{t("terms")}</a></li>
                <li><a href="#" className="hover:text-landing-text transition-colors">{t("privacy")}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-4 text-landing-text">{t("getInTouch")}</h4>
              <ul className="space-y-2 text-sm text-landing-text-muted">
                <li><span className="hover:text-landing-text transition-colors cursor-pointer">{t("contactForm")}</span></li>
                <li><span className="hover:text-landing-text transition-colors cursor-pointer">{t("submitSuggestion")}</span></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-6 border-t border-landing-text/5 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-landing-text-muted">{t("copyright")}</p>
            <p className="text-xs text-landing-text-muted">{t("builtFor")}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
