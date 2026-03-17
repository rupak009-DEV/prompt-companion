import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { ar, pt, ja, zh, ko, ru, it, bn, ta, te, mr, gu, kn, ml, pa, odiaTranslations, assameseTranslations } from "./translations";

export type SupportedLocale = "en" | "es" | "fr" | "de" | "hi" | "ar" | "pt" | "ja" | "zh" | "ko" | "ru" | "it" | "bn" | "ta" | "te" | "mr" | "gu" | "kn" | "ml" | "pa" | "or" | "as";

export interface LocaleInfo {
  code: SupportedLocale;
  label: string;
  flag: string;
  currency: string;
  currencySymbol: string;
  currencyRate: number; // relative to USD
}

export const LOCALES: LocaleInfo[] = [
  { code: "en", label: "English", flag: "🇺🇸", currency: "USD", currencySymbol: "$", currencyRate: 1 },
  { code: "es", label: "Español", flag: "🇪🇸", currency: "EUR", currencySymbol: "€", currencyRate: 0.92 },
  { code: "fr", label: "Français", flag: "🇫🇷", currency: "EUR", currencySymbol: "€", currencyRate: 0.92 },
  { code: "de", label: "Deutsch", flag: "🇩🇪", currency: "EUR", currencySymbol: "€", currencyRate: 0.92 },
  { code: "pt", label: "Português", flag: "🇧🇷", currency: "BRL", currencySymbol: "R$", currencyRate: 5.0 },
  { code: "hi", label: "हिन्दी", flag: "🇮🇳", currency: "INR", currencySymbol: "₹", currencyRate: 83.5 },
  { code: "ar", label: "العربية", flag: "🇸🇦", currency: "SAR", currencySymbol: "﷼", currencyRate: 3.75 },
  { code: "ja", label: "日本語", flag: "🇯🇵", currency: "JPY", currencySymbol: "¥", currencyRate: 149 },
  { code: "zh", label: "中文", flag: "🇨🇳", currency: "CNY", currencySymbol: "¥", currencyRate: 7.25 },
  { code: "ko", label: "한국어", flag: "🇰🇷", currency: "KRW", currencySymbol: "₩", currencyRate: 1330 },
  { code: "ru", label: "Русский", flag: "🇷🇺", currency: "RUB", currencySymbol: "₽", currencyRate: 92 },
  { code: "it", label: "Italiano", flag: "🇮🇹", currency: "EUR", currencySymbol: "€", currencyRate: 0.92 },
  { code: "bn", label: "বাংলা", flag: "🇮🇳", currency: "INR", currencySymbol: "₹", currencyRate: 83.5 },
  { code: "ta", label: "தமிழ்", flag: "🇮🇳", currency: "INR", currencySymbol: "₹", currencyRate: 83.5 },
  { code: "te", label: "తెలుగు", flag: "🇮🇳", currency: "INR", currencySymbol: "₹", currencyRate: 83.5 },
  { code: "mr", label: "मराठी", flag: "🇮🇳", currency: "INR", currencySymbol: "₹", currencyRate: 83.5 },
  { code: "gu", label: "ગુજરાતી", flag: "🇮🇳", currency: "INR", currencySymbol: "₹", currencyRate: 83.5 },
  { code: "kn", label: "ಕನ್ನಡ", flag: "🇮🇳", currency: "INR", currencySymbol: "₹", currencyRate: 83.5 },
  { code: "ml", label: "മലയാളം", flag: "🇮🇳", currency: "INR", currencySymbol: "₹", currencyRate: 83.5 },
  { code: "pa", label: "ਪੰਜਾਬੀ", flag: "🇮🇳", currency: "INR", currencySymbol: "₹", currencyRate: 83.5 },
  { code: "or", label: "ଓଡ଼ିଆ", flag: "🇮🇳", currency: "INR", currencySymbol: "₹", currencyRate: 83.5 },
  { code: "as", label: "অসমীয়া", flag: "🇮🇳", currency: "INR", currencySymbol: "₹", currencyRate: 83.5 },
];

// Base prices in INR (current hardcoded values)
const BASE_PRO_MONTHLY_INR = 1826;
const BASE_PRO_YEARLY_INR = 1553;

// Convert INR to USD first, then to target
function convertPrice(inrPrice: number, targetRate: number): string {
  const usdPrice = inrPrice / 83.5;
  const converted = usdPrice * targetRate;
  // Round nicely
  if (targetRate >= 100) return Math.round(converted).toString();
  if (targetRate >= 10) return Math.round(converted).toString();
  return converted.toFixed(2);
}

export function getPrice(isYearly: boolean, locale: LocaleInfo): string {
  const inr = isYearly ? BASE_PRO_YEARLY_INR : BASE_PRO_MONTHLY_INR;
  if (locale.currency === "INR") return isYearly ? "1,553" : "1,826";
  return convertPrice(inr, locale.currencyRate);
}

// Translations
type TranslationKey = keyof typeof translations.en;

const translations = {
  en: {
    // Nav
    navHome: "Home",
    navAbout: "About",
    navFeatures: "Features",
    navPricing: "Pricing",
    navContact: "Contact",
    launchApp: "Launch App",
    // Hero
    heroTitle1: "Stop Wasting Time",
    heroTitle2: "Master the AI Revolution",
    heroDesc1: "Did you know? Latest research shows AI users spend",
    heroDesc2: "75% of their time",
    heroDesc3: "just writing and refining prompts! Most think they need to pay for 10 different \"Pro\" subscriptions to get results.",
    heroDesc4: "They're wrong.",
    heroDesc5: "You don't need expensive models; you need",
    heroDesc6: "Better Prompts",
    heroTagline: "🚀 One App. All Platforms. Save Thousands. 🎉",
    tryApp: "Try Prompt Engineer",
    seeHow: "See how it works",
    appPreview: "App Preview Here",
    // Why section
    whyTitle: "Why Prompt Engineering?",
    whyP1: "The quality of AI output is directly proportional to the quality of your prompt. Most users get average results because they speak to AI like it's a search engine.",
    whyP2: "Prompt Engineer uses advanced semantic analysis to restructure your thoughts into structured formats that AI models crave, including audience targeting, tone constraints, and chain-of-thought logic.",
    whyF1: "Contextual enhancement for 10+ models",
    whyF2: "Scientific quality scoring system",
    whyF3: "Structured JSON & Text outputs",
    whyF4: "Template-based reusable logic",
    before: "Before",
    after: "After",
    beforeText: "\"write a blog about space\"",
    afterText: "\"Act as a professional science communicator. Write a 500-word blog post about recent Mars discoveries for a general audience. Use a curious tone and include three bullet points on technological challenges...\"",
    // Modes
    modesTitle: "Powerful Enhancement Modes",
    modesDesc: "Tailored logic for every specific use case.",
    mode1Title: "Clarity & Precision",
    mode1Desc: "Turn vague ideas into sharp, actionable instructions.",
    mode2Title: "Assisted Wizard",
    mode2Desc: "Step-by-step guidance to extract your vision and build perfect logic.",
    mode3Title: "Deep Dive Analysis",
    mode3Desc: "Scientific quality scoring with metrics on clarity, specificity, and tone.",
    mode4Title: "Persona Roleplay",
    mode4Desc: "Craft deep characters and specific expert personas.",
    mode5Title: "Logic Chains",
    mode5Desc: "Structured step-by-step reasoning for complex tasks.",
    mode6Title: "Save Templates",
    mode6Desc: "Build your own library of reusable prompt skeletons for instant generation.",
    mode7Title: "Multi-Language Support",
    mode7Desc: "Enhance prompts in 20+ languages with native-level fluency.",
    mode8Title: "Creative Writing",
    mode8Desc: "Unlock flow and style with creative enhancement.",
    mode9Title: "Coding Optimization",
    mode9Desc: "Perfect code prompts for better generation results.",
    // Everywhere
    everywhereTitle: "Take it everywhere",
    everywhereDesc: "Prompt Engineer is available on all your devices. Sync your history and templates across platforms.",
    mobileApps: "Mobile Apps",
    comingSoon: "COMING SOON",
    iosStore: "iOS App Store",
    googlePlay: "Google Play",
    otherStores: "Other Stores",
    browserExt: "Browser Extensions",
    chromeStore: "Chrome Store",
    firefoxAddons: "Firefox Add-ons",
    otherBrowsers: "For other browsers",
    // Pricing
    pricingTitle: "Simple Pricing",
    pricingDesc: "Free to start, affordable to scale.",
    monthly: "Monthly",
    yearly: "Yearly",
    save15: "Save 15%",
    starter: "Starter",
    free: "Free",
    pro: "Pro",
    enterprise: "Enterprise",
    custom: "Custom",
    perMonth: "/mo",
    billedAnnually: "Billed annually",
    startFree: "Start Free",
    goPro: "Go Pro",
    contactUs: "Contact Us",
    starterF1: "10 Enhancements/day",
    starterF2: "3 User Assisted (15-day trial)",
    starterF3: "1 Deep Drive (15-day trial)",
    starterF4: "Save Limited Templates",
    starterF5: "Advanced Analytics",
    starterF6: "History Access",
    starterF7: "File Downloads included",
    proF1: "Unlimited Enhancements",
    proF2: "Unlimited User Assisted",
    proF3: "Unlimited Deep Drive",
    proF4: "Unlimited Templates",
    proF5: "Download as File (PDF/TXT/JSON)",
    proF6: "Advanced Analytics",
    proF7: "History Access",
    proF8: "Priority Support",
    entF1: "API Access",
    entF2: "Team Collaboration",
    entF3: "Custom Branding",
    entF4: "Dedicated Support",
    entF5: "SLA Guarantee",
    popular: "Popular",
    // FAQ
    faqTitle: "Frequently Asked Questions",
    faq1Q: "Do I need an API key?",
    faq1A: "No. Prompt Engineer connects to all major models (Claude, GPT-4, Gemini, Llama) without requiring your own API keys for enhancement. You can optionally add your own keys for direct usage.",
    faq2Q: "Can I save and reuse prompts?",
    faq2A: "Yes! Save unlimited templates (with Pro plan) and organize them for quick reuse across all modes. Templates sync across your devices.",
    faq3Q: "Does it work offline?",
    faq3A: "The app requires internet to enhance prompts, but your saved templates and history are stored securely and accessible whenever you need them.",
    faq4Q: "Can I use this for coding?",
    faq4A: "Absolutely! We have a dedicated Coding Optimization mode that restructures programming prompts for better code generation on any AI model.",
    // Newsletter
    newsletterTitle: "Stay in the loop",
    newsletterDesc: "Get tips, updates, and early access to new features.",
    newsletterPlaceholder: "Enter your email",
    newsletterButton: "Subscribe",
    newsletterSuccess: "Thanks for subscribing!",
    newsletterInvalid: "Please enter a valid email.",
    // Footer
    footerDesc: "Building the future of human-AI communication through structured prompt engineering and analysis.",
    product: "PRODUCT",
    features: "Features",
    pricing: "Pricing",
    app: "App",
    referral: "Referral Program",
    helpDocs: "Help & Docs",
    support: "SUPPORT",
    contactSupport: "Contact Support",
    adminDash: "Admin Dashboard",
    terms: "Terms of Service",
    privacy: "Privacy Policy",
    submitSuggestion: "Submit Suggestion",
    getInTouch: "GET IN TOUCH",
    contactForm: "Contact Form",
    copyright: "© 2026 Prompt Engineer AI. All rights reserved.",
    builtFor: "Built for the AI era",
    // Help page
    helpTitle: "Help & Documentation",
    helpSubtitle: "Everything you need to get the most out of Prompt Engineer.",
    gettingStartedTitle: "Getting Started",
    gettingStartedDesc: "Learn the basics of prompt engineering and how to use the app effectively.",
    gettingStartedSteps: "1. Open the app and type your raw prompt.\n2. Select your target AI model.\n3. Choose an enhancement mode (Quick, Wizard, or Deep Dive).\n4. Click Enhance and copy your optimized prompt.\n5. Paste it into your AI tool of choice.",
    modesGuideTitle: "Enhancement Modes Guide",
    quickModeTitle: "Quick Enhance",
    quickModeDesc: "Instantly improves your prompt with better structure, clarity, and specificity. Best for everyday use.",
    wizardModeTitle: "Assisted Wizard",
    wizardModeDesc: "A step-by-step questionnaire that captures your intent, audience, tone, and constraints to build a perfect prompt.",
    deepDiveTitle: "Deep Dive Analysis",
    deepDiveDesc: "Provides a scientific quality score with detailed metrics on clarity, specificity, tone, and actionability.",
    templatesGuideTitle: "Templates & History",
    templatesGuideDesc: "Save your best prompts as reusable templates. Access your full enhancement history anytime. Export and import your data for backup.",
    tipsTitle: "Pro Tips",
    tip1: "Be specific about your audience — \"for a 5-year-old\" vs \"for a PhD researcher\" yields very different results.",
    tip2: "Include format requirements — \"respond in bullet points\" or \"write a 3-paragraph essay\" guides the AI structure.",
    tip3: "Set constraints — word limits, tone, and language help the AI stay focused.",
    tip4: "Use the Wizard mode for complex tasks — it extracts details you might forget to include.",
    tip5: "Save frequently used prompts as templates to save time on repetitive tasks.",
    backToHome: "Back to Home",
  },
  es: {
    navHome: "Inicio", navAbout: "Acerca de", navFeatures: "Funciones", navPricing: "Precios", navContact: "Contacto", launchApp: "Abrir App",
    heroTitle1: "Deja de Perder Tiempo", heroTitle2: "Domina la Revolución IA",
    heroDesc1: "¿Sabías? Investigaciones muestran que los usuarios de IA gastan", heroDesc2: "75% de su tiempo", heroDesc3: "solo escribiendo y refinando prompts. La mayoría cree que necesita pagar 10 suscripciones \"Pro\" diferentes.", heroDesc4: "Están equivocados.", heroDesc5: "No necesitas modelos caros; necesitas", heroDesc6: "Mejores Prompts",
    heroTagline: "🚀 Una App. Todas las Plataformas. Ahorra Miles. 🎉", tryApp: "Probar Prompt Engineer", seeHow: "Ver cómo funciona", appPreview: "Vista previa de la App",
    whyTitle: "¿Por qué Prompt Engineering?", whyP1: "La calidad de la salida de IA es directamente proporcional a la calidad de tu prompt.", whyP2: "Prompt Engineer usa análisis semántico avanzado para reestructurar tus pensamientos en formatos estructurados.",
    whyF1: "Mejora contextual para 10+ modelos", whyF2: "Sistema de puntuación de calidad", whyF3: "Salidas JSON y texto estructurado", whyF4: "Lógica reutilizable basada en plantillas",
    before: "Antes", after: "Después", beforeText: "\"escribe un blog sobre el espacio\"", afterText: "\"Actúa como comunicador científico profesional. Escribe un post de 500 palabras sobre descubrimientos recientes en Marte...\"",
    modesTitle: "Modos de Mejora Potentes", modesDesc: "Lógica adaptada para cada caso de uso.",
    mode1Title: "Claridad y Precisión", mode1Desc: "Convierte ideas vagas en instrucciones claras.", mode2Title: "Asistente Guiado", mode2Desc: "Guía paso a paso para construir lógica perfecta.", mode3Title: "Análisis Profundo", mode3Desc: "Puntuación científica de claridad, especificidad y tono.",
    mode4Title: "Roleplay de Persona", mode4Desc: "Crea personajes y personas expertas.", mode5Title: "Cadenas Lógicas", mode5Desc: "Razonamiento paso a paso estructurado.", mode6Title: "Guardar Plantillas", mode6Desc: "Construye tu biblioteca de plantillas reutilizables.",
    mode7Title: "Soporte Multilingüe", mode7Desc: "Mejora prompts en 20+ idiomas.", mode8Title: "Escritura Creativa", mode8Desc: "Desbloquea estilo y fluidez creativa.", mode9Title: "Optimización de Código", mode9Desc: "Prompts perfectos para mejor generación de código.",
    everywhereTitle: "Llévalo a todas partes", everywhereDesc: "Disponible en todos tus dispositivos.", mobileApps: "Apps Móviles", comingSoon: "PRÓXIMAMENTE", iosStore: "iOS App Store", googlePlay: "Google Play", otherStores: "Otras Tiendas", browserExt: "Extensiones de Navegador", chromeStore: "Chrome Store", firefoxAddons: "Firefox Add-ons", otherBrowsers: "Otros navegadores",
    pricingTitle: "Precios Simples", pricingDesc: "Gratis para empezar, accesible para escalar.", monthly: "Mensual", yearly: "Anual", save15: "Ahorra 15%",
    starter: "Inicial", free: "Gratis", pro: "Pro", enterprise: "Empresa", custom: "Personalizado", perMonth: "/mes", billedAnnually: "Facturado anualmente", startFree: "Empezar Gratis", goPro: "Ir a Pro", contactUs: "Contáctenos",
    starterF1: "10 Mejoras/día", starterF2: "3 Asistidas (prueba 15 días)", starterF3: "1 Análisis Profundo (prueba 15 días)", starterF4: "Plantillas Limitadas", starterF5: "Analítica Avanzada", starterF6: "Acceso al Historial", starterF7: "Descargas incluidas",
    proF1: "Mejoras Ilimitadas", proF2: "Asistidas Ilimitadas", proF3: "Análisis Ilimitados", proF4: "Plantillas Ilimitadas", proF5: "Descargar (PDF/TXT/JSON)", proF6: "Analítica Avanzada", proF7: "Acceso al Historial", proF8: "Soporte Prioritario",
    entF1: "Acceso API", entF2: "Colaboración en Equipo", entF3: "Marca Personalizada", entF4: "Soporte Dedicado", entF5: "Garantía SLA", popular: "Popular",
    faqTitle: "Preguntas Frecuentes",
    faq1Q: "¿Necesito una clave API?", faq1A: "No. Prompt Engineer se conecta a todos los modelos principales sin necesitar tus propias claves API.",
    faq2Q: "¿Puedo guardar y reutilizar prompts?", faq2A: "¡Sí! Guarda plantillas ilimitadas (con plan Pro) y organízalas para reutilizarlas.",
    faq3Q: "¿Funciona sin conexión?", faq3A: "La app necesita internet para mejorar prompts, pero tus plantillas e historial se almacenan de forma segura.",
    faq4Q: "¿Puedo usarlo para programar?", faq4A: "¡Por supuesto! Tenemos un modo dedicado de Optimización de Código.",
    newsletterTitle: "Mantente informado", newsletterDesc: "Recibe consejos, actualizaciones y acceso anticipado.", newsletterPlaceholder: "Tu correo electrónico", newsletterButton: "Suscribirse", newsletterSuccess: "¡Gracias por suscribirte!", newsletterInvalid: "Por favor ingresa un correo válido.",
    footerDesc: "Construyendo el futuro de la comunicación humano-IA.", product: "PRODUCTO", features: "Funciones", pricing: "Precios", app: "App", referral: "Programa de Referidos", helpDocs: "Ayuda y Docs",
    support: "SOPORTE", contactSupport: "Soporte", adminDash: "Panel de Admin", terms: "Términos", privacy: "Privacidad", submitSuggestion: "Enviar Sugerencia",
    getInTouch: "CONTACTO", contactForm: "Formulario de Contacto", copyright: "© 2026 Prompt Engineer AI. Todos los derechos reservados.", builtFor: "Hecho para la era de la IA",
  },
  fr: {
    navHome: "Accueil", navAbout: "À propos", navFeatures: "Fonctionnalités", navPricing: "Tarifs", navContact: "Contact", launchApp: "Lancer l'App",
    heroTitle1: "Arrêtez de Perdre du Temps", heroTitle2: "Maîtrisez la Révolution IA",
    heroDesc1: "Saviez-vous ? Les recherches montrent que les utilisateurs d'IA passent", heroDesc2: "75% de leur temps", heroDesc3: "à écrire et affiner leurs prompts. La plupart pensent devoir payer 10 abonnements \"Pro\".", heroDesc4: "Ils ont tort.", heroDesc5: "Vous n'avez pas besoin de modèles coûteux ; vous avez besoin de", heroDesc6: "Meilleurs Prompts",
    heroTagline: "🚀 Une App. Toutes les Plateformes. Économisez des Milliers. 🎉", tryApp: "Essayer Prompt Engineer", seeHow: "Comment ça marche", appPreview: "Aperçu de l'App",
    whyTitle: "Pourquoi le Prompt Engineering ?", whyP1: "La qualité de la sortie IA est proportionnelle à la qualité de votre prompt.", whyP2: "Prompt Engineer utilise une analyse sémantique avancée pour restructurer vos pensées.",
    whyF1: "Amélioration contextuelle pour 10+ modèles", whyF2: "Système de notation scientifique", whyF3: "Sorties JSON & texte structuré", whyF4: "Logique réutilisable par modèles",
    before: "Avant", after: "Après", beforeText: "\"écris un blog sur l'espace\"", afterText: "\"Agis en tant que communicateur scientifique professionnel. Écris un article de 500 mots sur les découvertes récentes sur Mars...\"",
    modesTitle: "Modes d'Amélioration Puissants", modesDesc: "Logique adaptée à chaque cas d'usage.",
    mode1Title: "Clarté & Précision", mode1Desc: "Transformez des idées vagues en instructions claires.", mode2Title: "Assistant Guidé", mode2Desc: "Guidage étape par étape pour construire une logique parfaite.", mode3Title: "Analyse Approfondie", mode3Desc: "Notation scientifique de clarté, spécificité et ton.",
    mode4Title: "Jeu de Rôle Persona", mode4Desc: "Créez des personnages et personas experts.", mode5Title: "Chaînes Logiques", mode5Desc: "Raisonnement structuré étape par étape.", mode6Title: "Sauvegarder des Modèles", mode6Desc: "Construisez votre bibliothèque de modèles réutilisables.",
    mode7Title: "Support Multilingue", mode7Desc: "Améliorez les prompts en 20+ langues.", mode8Title: "Écriture Créative", mode8Desc: "Débloquez le style et la fluidité créative.", mode9Title: "Optimisation du Code", mode9Desc: "Prompts parfaits pour une meilleure génération de code.",
    everywhereTitle: "Emportez-le partout", everywhereDesc: "Disponible sur tous vos appareils.", mobileApps: "Apps Mobiles", comingSoon: "BIENTÔT DISPONIBLE", iosStore: "iOS App Store", googlePlay: "Google Play", otherStores: "Autres Boutiques", browserExt: "Extensions Navigateur", chromeStore: "Chrome Store", firefoxAddons: "Firefox Add-ons", otherBrowsers: "Autres navigateurs",
    pricingTitle: "Tarifs Simples", pricingDesc: "Gratuit pour commencer, abordable pour évoluer.", monthly: "Mensuel", yearly: "Annuel", save15: "Économisez 15%",
    starter: "Débutant", free: "Gratuit", pro: "Pro", enterprise: "Entreprise", custom: "Sur mesure", perMonth: "/mois", billedAnnually: "Facturé annuellement", startFree: "Commencer Gratuitement", goPro: "Passer Pro", contactUs: "Nous Contacter",
    starterF1: "10 Améliorations/jour", starterF2: "3 Assistées (essai 15 jours)", starterF3: "1 Analyse (essai 15 jours)", starterF4: "Modèles Limités", starterF5: "Analytique Avancée", starterF6: "Accès à l'Historique", starterF7: "Téléchargements inclus",
    proF1: "Améliorations Illimitées", proF2: "Assistées Illimitées", proF3: "Analyses Illimitées", proF4: "Modèles Illimités", proF5: "Télécharger (PDF/TXT/JSON)", proF6: "Analytique Avancée", proF7: "Accès à l'Historique", proF8: "Support Prioritaire",
    entF1: "Accès API", entF2: "Collaboration d'Équipe", entF3: "Marque Personnalisée", entF4: "Support Dédié", entF5: "Garantie SLA", popular: "Populaire",
    faqTitle: "Questions Fréquentes",
    faq1Q: "Ai-je besoin d'une clé API ?", faq1A: "Non. Prompt Engineer se connecte à tous les modèles principaux sans nécessiter vos propres clés API.",
    faq2Q: "Puis-je sauvegarder et réutiliser des prompts ?", faq2A: "Oui ! Sauvegardez des modèles illimités (avec le plan Pro).",
    faq3Q: "Ça fonctionne hors ligne ?", faq3A: "L'app nécessite internet pour améliorer les prompts, mais vos modèles et historique sont stockés en sécurité.",
    faq4Q: "Puis-je l'utiliser pour le code ?", faq4A: "Absolument ! Nous avons un mode dédié d'Optimisation du Code.",
    newsletterTitle: "Restez informé", newsletterDesc: "Recevez des conseils et un accès anticipé.", newsletterPlaceholder: "Votre email", newsletterButton: "S'abonner", newsletterSuccess: "Merci de votre inscription !", newsletterInvalid: "Veuillez entrer un email valide.",
    footerDesc: "Construire l'avenir de la communication humain-IA.", product: "PRODUIT", features: "Fonctionnalités", pricing: "Tarifs", app: "App", referral: "Programme de Parrainage", helpDocs: "Aide et Docs",
    support: "SUPPORT", contactSupport: "Support", adminDash: "Tableau de Bord", terms: "Conditions", privacy: "Confidentialité", submitSuggestion: "Soumettre une Suggestion",
    getInTouch: "NOUS CONTACTER", contactForm: "Formulaire de Contact", copyright: "© 2026 Prompt Engineer AI. Tous droits réservés.", builtFor: "Conçu pour l'ère de l'IA",
  },
  de: {
    navHome: "Startseite", navAbout: "Über uns", navFeatures: "Funktionen", navPricing: "Preise", navContact: "Kontakt", launchApp: "App starten",
    heroTitle1: "Hör auf, Zeit zu verschwenden", heroTitle2: "Meistere die KI-Revolution",
    heroDesc1: "Wusstest du? Forschung zeigt, dass KI-Nutzer", heroDesc2: "75% ihrer Zeit", heroDesc3: "nur mit dem Schreiben und Verfeinern von Prompts verbringen.", heroDesc4: "Sie liegen falsch.", heroDesc5: "Du brauchst keine teuren Modelle; du brauchst", heroDesc6: "Bessere Prompts",
    heroTagline: "🚀 Eine App. Alle Plattformen. Tausende sparen. 🎉", tryApp: "Prompt Engineer testen", seeHow: "So funktioniert es", appPreview: "App-Vorschau",
    whyTitle: "Warum Prompt Engineering?", whyP1: "Die Qualität der KI-Ausgabe ist proportional zur Qualität deines Prompts.", whyP2: "Prompt Engineer nutzt semantische Analyse, um deine Gedanken in strukturierte Formate umzuwandeln.",
    whyF1: "Kontextuelle Verbesserung für 10+ Modelle", whyF2: "Wissenschaftliches Qualitätsbewertungssystem", whyF3: "Strukturierte JSON- & Text-Ausgaben", whyF4: "Vorlagenbasierte wiederverwendbare Logik",
    before: "Vorher", after: "Nachher", beforeText: "\"schreibe einen Blog über den Weltraum\"", afterText: "\"Handle als professioneller Wissenschaftskommunikator. Schreibe einen 500-Wörter-Blogbeitrag über aktuelle Mars-Entdeckungen...\"",
    modesTitle: "Leistungsstarke Verbesserungsmodi", modesDesc: "Maßgeschneiderte Logik für jeden Anwendungsfall.",
    mode1Title: "Klarheit & Präzision", mode1Desc: "Verwandle vage Ideen in klare Anweisungen.", mode2Title: "Geführter Assistent", mode2Desc: "Schritt-für-Schritt-Anleitung zum Aufbau perfekter Logik.", mode3Title: "Tiefenanalyse", mode3Desc: "Wissenschaftliche Bewertung von Klarheit und Ton.",
    mode4Title: "Persona-Rollenspiel", mode4Desc: "Erstelle Charaktere und Experten-Personas.", mode5Title: "Logikketten", mode5Desc: "Strukturiertes schrittweises Denken.", mode6Title: "Vorlagen speichern", mode6Desc: "Erstelle deine Bibliothek wiederverwendbarer Vorlagen.",
    mode7Title: "Mehrsprachig", mode7Desc: "Verbessere Prompts in 20+ Sprachen.", mode8Title: "Kreatives Schreiben", mode8Desc: "Entfalte Stil und kreativen Flow.", mode9Title: "Code-Optimierung", mode9Desc: "Perfekte Code-Prompts für bessere Ergebnisse.",
    everywhereTitle: "Überall dabei", everywhereDesc: "Auf allen Geräten verfügbar.", mobileApps: "Mobile Apps", comingSoon: "DEMNÄCHST", iosStore: "iOS App Store", googlePlay: "Google Play", otherStores: "Andere Stores", browserExt: "Browser-Erweiterungen", chromeStore: "Chrome Store", firefoxAddons: "Firefox Add-ons", otherBrowsers: "Andere Browser",
    pricingTitle: "Einfache Preise", pricingDesc: "Kostenlos starten, günstig skalieren.", monthly: "Monatlich", yearly: "Jährlich", save15: "15% sparen",
    starter: "Starter", free: "Kostenlos", pro: "Pro", enterprise: "Unternehmen", custom: "Individuell", perMonth: "/Mo.", billedAnnually: "Jährlich abgerechnet", startFree: "Kostenlos starten", goPro: "Pro werden", contactUs: "Kontaktieren",
    starterF1: "10 Verbesserungen/Tag", starterF2: "3 Assistiert (15-Tage-Test)", starterF3: "1 Tiefenanalyse (15-Tage-Test)", starterF4: "Begrenzte Vorlagen", starterF5: "Erweiterte Analytik", starterF6: "Verlaufszugriff", starterF7: "Downloads inklusive",
    proF1: "Unbegrenzte Verbesserungen", proF2: "Unbegrenzt Assistiert", proF3: "Unbegrenzte Analysen", proF4: "Unbegrenzte Vorlagen", proF5: "Download (PDF/TXT/JSON)", proF6: "Erweiterte Analytik", proF7: "Verlaufszugriff", proF8: "Prioritäts-Support",
    entF1: "API-Zugang", entF2: "Team-Zusammenarbeit", entF3: "Eigenes Branding", entF4: "Dedizierter Support", entF5: "SLA-Garantie", popular: "Beliebt",
    faqTitle: "Häufige Fragen",
    faq1Q: "Brauche ich einen API-Schlüssel?", faq1A: "Nein. Prompt Engineer verbindet sich mit allen großen Modellen ohne eigene API-Schlüssel.",
    faq2Q: "Kann ich Prompts speichern und wiederverwenden?", faq2A: "Ja! Speichere unbegrenzte Vorlagen (mit Pro-Plan).",
    faq3Q: "Funktioniert es offline?", faq3A: "Die App benötigt Internet für Verbesserungen, aber Vorlagen und Verlauf sind sicher gespeichert.",
    faq4Q: "Kann ich es zum Programmieren nutzen?", faq4A: "Absolut! Wir haben einen dedizierten Code-Optimierungsmodus.",
    newsletterTitle: "Bleiben Sie informiert", newsletterDesc: "Tipps, Updates und früher Zugang.", newsletterPlaceholder: "Ihre E-Mail", newsletterButton: "Abonnieren", newsletterSuccess: "Danke fürs Abonnieren!", newsletterInvalid: "Bitte geben Sie eine gültige E-Mail ein.",
    footerDesc: "Die Zukunft der Mensch-KI-Kommunikation gestalten.", product: "PRODUKT", features: "Funktionen", pricing: "Preise", app: "App", referral: "Empfehlungsprogramm", helpDocs: "Hilfe & Doku",
    support: "SUPPORT", contactSupport: "Support kontaktieren", adminDash: "Admin-Dashboard", terms: "AGB", privacy: "Datenschutz", submitSuggestion: "Vorschlag einreichen",
    getInTouch: "KONTAKT", contactForm: "Kontaktformular", copyright: "© 2026 Prompt Engineer AI. Alle Rechte vorbehalten.", builtFor: "Für das KI-Zeitalter gebaut",
  },
  hi: {
    navHome: "होम", navAbout: "परिचय", navFeatures: "सुविधाएँ", navPricing: "मूल्य", navContact: "संपर्क", launchApp: "ऐप खोलें",
    heroTitle1: "समय बर्बाद करना बंद करें", heroTitle2: "AI क्रांति में महारत हासिल करें",
    heroDesc1: "क्या आप जानते हैं? शोध बताते हैं कि AI उपयोगकर्ता अपना", heroDesc2: "75% समय", heroDesc3: "सिर्फ प्रॉम्प्ट लिखने और सुधारने में बिताते हैं।", heroDesc4: "वे गलत हैं।", heroDesc5: "आपको महंगे मॉडल नहीं चाहिए; आपको चाहिए", heroDesc6: "बेहतर प्रॉम्प्ट",
    heroTagline: "🚀 एक ऐप। सभी प्लेटफ़ॉर्म। हज़ारों बचाएँ। 🎉", tryApp: "Prompt Engineer आज़माएँ", seeHow: "देखें कैसे काम करता है", appPreview: "ऐप प्रीव्यू",
    whyTitle: "Prompt Engineering क्यों?", whyP1: "AI आउटपुट की गुणवत्ता आपके प्रॉम्प्ट की गुणवत्ता के सीधे अनुपात में है।", whyP2: "Prompt Engineer उन्नत सिमेंटिक विश्लेषण का उपयोग करता है।",
    whyF1: "10+ मॉडल के लिए संदर्भात्मक सुधार", whyF2: "वैज्ञानिक गुणवत्ता स्कोरिंग", whyF3: "संरचित JSON और टेक्स्ट आउटपुट", whyF4: "टेम्पलेट-आधारित पुन: प्रयोज्य लॉजिक",
    before: "पहले", after: "बाद में", beforeText: "\"अंतरिक्ष के बारे में एक ब्लॉग लिखो\"", afterText: "\"एक पेशेवर विज्ञान संचारक के रूप में कार्य करें। मंगल ग्रह की हालिया खोजों पर 500 शब्दों का ब्लॉग पोस्ट लिखें...\"",
    modesTitle: "शक्तिशाली सुधार मोड", modesDesc: "हर उपयोग के लिए अनुकूलित लॉजिक।",
    mode1Title: "स्पष्टता और सटीकता", mode1Desc: "अस्पष्ट विचारों को स्पष्ट निर्देशों में बदलें।", mode2Title: "सहायक विज़ार्ड", mode2Desc: "चरण-दर-चरण मार्गदर्शन।", mode3Title: "गहन विश्लेषण", mode3Desc: "वैज्ञानिक गुणवत्ता स्कोरिंग।",
    mode4Title: "पर्सोना रोलप्ले", mode4Desc: "गहरे किरदार और विशेषज्ञ पर्सोना बनाएँ।", mode5Title: "लॉजिक चेन", mode5Desc: "संरचित चरण-दर-चरण तर्क।", mode6Title: "टेम्पलेट सहेजें", mode6Desc: "पुन: प्रयोज्य टेम्पलेट की लाइब्रेरी बनाएँ।",
    mode7Title: "बहु-भाषा समर्थन", mode7Desc: "20+ भाषाओं में प्रॉम्प्ट सुधारें।", mode8Title: "रचनात्मक लेखन", mode8Desc: "शैली और प्रवाह को अनलॉक करें।", mode9Title: "कोड अनुकूलन", mode9Desc: "बेहतर कोड जनरेशन के लिए प्रॉम्प्ट।",
    everywhereTitle: "हर जगह ले जाएँ", everywhereDesc: "सभी उपकरणों पर उपलब्ध।", mobileApps: "मोबाइल ऐप्स", comingSoon: "जल्द आ रहा है", iosStore: "iOS App Store", googlePlay: "Google Play", otherStores: "अन्य स्टोर", browserExt: "ब्राउज़र एक्सटेंशन", chromeStore: "Chrome Store", firefoxAddons: "Firefox Add-ons", otherBrowsers: "अन्य ब्राउज़र",
    pricingTitle: "सरल मूल्य निर्धारण", pricingDesc: "शुरू करना मुफ़्त, स्केल करना किफ़ायती।", monthly: "मासिक", yearly: "वार्षिक", save15: "15% बचाएँ",
    starter: "स्टार्टर", free: "मुफ़्त", pro: "प्रो", enterprise: "एंटरप्राइज़", custom: "कस्टम", perMonth: "/माह", billedAnnually: "वार्षिक बिलिंग", startFree: "मुफ़्त शुरू करें", goPro: "प्रो लें", contactUs: "संपर्क करें",
    starterF1: "10 सुधार/दिन", starterF2: "3 सहायक (15-दिन परीक्षण)", starterF3: "1 गहन (15-दिन परीक्षण)", starterF4: "सीमित टेम्पलेट", starterF5: "उन्नत एनालिटिक्स", starterF6: "इतिहास एक्सेस", starterF7: "डाउनलोड शामिल",
    proF1: "असीमित सुधार", proF2: "असीमित सहायक", proF3: "असीमित गहन", proF4: "असीमित टेम्पलेट", proF5: "डाउनलोड (PDF/TXT/JSON)", proF6: "उन्नत एनालिटिक्स", proF7: "इतिहास एक्सेस", proF8: "प्राथमिकता सहायता",
    entF1: "API एक्सेस", entF2: "टीम सहयोग", entF3: "कस्टम ब्रांडिंग", entF4: "समर्पित सहायता", entF5: "SLA गारंटी", popular: "लोकप्रिय",
    faqTitle: "अक्सर पूछे जाने वाले प्रश्न",
    faq1Q: "क्या मुझे API कुंजी चाहिए?", faq1A: "नहीं। Prompt Engineer सभी प्रमुख मॉडल से बिना आपकी API कुंजी के जुड़ता है।",
    faq2Q: "क्या मैं प्रॉम्प्ट सहेज और पुन: उपयोग कर सकता हूँ?", faq2A: "हाँ! प्रो प्लान के साथ असीमित टेम्पलेट सहेजें।",
    faq3Q: "क्या यह ऑफ़लाइन काम करता है?", faq3A: "ऐप को सुधार के लिए इंटरनेट चाहिए, लेकिन आपके टेम्पलेट सुरक्षित रूप से संग्रहीत हैं।",
    faq4Q: "क्या मैं इसे कोडिंग के लिए उपयोग कर सकता हूँ?", faq4A: "बिल्कुल! हमारे पास कोड अनुकूलन मोड है।",
    newsletterTitle: "जुड़े रहें", newsletterDesc: "टिप्स, अपडेट और शुरुआती एक्सेस पाएँ।", newsletterPlaceholder: "आपका ईमेल", newsletterButton: "सदस्यता लें", newsletterSuccess: "सदस्यता के लिए धन्यवाद!", newsletterInvalid: "कृपया एक वैध ईमेल दर्ज करें।",
    footerDesc: "संरचित प्रॉम्प्ट इंजीनियरिंग से मानव-AI संचार का भविष्य बना रहे हैं।", product: "उत्पाद", features: "सुविधाएँ", pricing: "मूल्य", app: "ऐप", referral: "रेफरल प्रोग्राम", helpDocs: "सहायता और दस्तावेज़",
    support: "सहायता", contactSupport: "सहायता संपर्क", adminDash: "एडमिन डैशबोर्ड", terms: "सेवा की शर्तें", privacy: "गोपनीयता नीति", submitSuggestion: "सुझाव भेजें",
    getInTouch: "संपर्क करें", contactForm: "संपर्क फ़ॉर्म", copyright: "© 2026 Prompt Engineer AI. सर्वाधिकार सुरक्षित।", builtFor: "AI युग के लिए निर्मित",
  },
  ar: ar as any,
  pt: pt as any,
  ja: ja as any,
  zh: zh as any,
  ko: ko as any,
  ru: ru as any,
  it: it as any,
  bn: bn as any,
  ta: ta as any,
  te: te as any,
  mr: mr as any,
  gu: gu as any,
  kn: kn as any,
  ml: ml as any,
  pa: pa as any,
  or: odiaTranslations as any,
  as: assameseTranslations as any,
};

// Fill missing translations with English fallbacks
Object.keys(translations).forEach((lang) => {
  if (lang !== "en") {
    const t = translations[lang as SupportedLocale];
    Object.keys(translations.en).forEach((key) => {
      if (!(key in t)) {
        (t as any)[key] = (translations.en as any)[key];
      }
    });
  }
});

interface I18nContextType {
  locale: LocaleInfo;
  setLocale: (code: SupportedLocale) => void;
  t: (key: TranslationKey) => string;
  formatPrice: (isYearly: boolean) => string;
}

const defaultLocale = LOCALES[0];
const I18nContext = createContext<I18nContextType>({
  locale: defaultLocale,
  setLocale: () => {},
  t: (key: TranslationKey) => translations.en[key] || key,
  formatPrice: (isYearly: boolean) => `${defaultLocale.currencySymbol}${getPrice(isYearly, defaultLocale)}`,
});

function detectLocale(): SupportedLocale {
  const browserLang = navigator.language?.split("-")[0]?.toLowerCase() || "en";
  const match = LOCALES.find((l) => l.code === browserLang);
  return match ? match.code : "en";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [localeCode, setLocaleCode] = useState<SupportedLocale>(() => {
    const saved = localStorage.getItem("pe_locale");
    if (saved && LOCALES.find((l) => l.code === saved)) return saved as SupportedLocale;
    return detectLocale();
  });

  const locale = LOCALES.find((l) => l.code === localeCode)!;

  useEffect(() => {
    localStorage.setItem("pe_locale", localeCode);
  }, [localeCode]);

  const t = (key: TranslationKey) => {
    return translations[localeCode]?.[key] || translations.en[key] || key;
  };

  const formatPrice = (isYearly: boolean) => {
    return `${locale.currencySymbol}${getPrice(isYearly, locale)}`;
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale: setLocaleCode, t, formatPrice }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
