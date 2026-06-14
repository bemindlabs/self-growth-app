import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { en } from "./locales/en";
import { th } from "./locales/th";

export const LANGUAGES = ["en", "th"] as const;
export type Language = (typeof LANGUAGES)[number];

function initialLanguage(): Language {
  try {
    const saved = localStorage.getItem("app_language");
    if (saved === "en" || saved === "th") return saved;
  } catch {
    /* localStorage unavailable */
  }
  return "en";
}

// Auto-load per-page translation modules. Each file under locales/pages/*.ts
// exports `en` and `th`, already namespaced, e.g.
//   export const en = { dashboard: { title: "Dashboard" } };
//   export const th = { dashboard: { title: "แดชบอร์ด" } };
const pageModules = import.meta.glob("./locales/pages/*.ts", {
  eager: true,
}) as Record<string, { en?: Record<string, unknown>; th?: Record<string, unknown> }>;

const pagesEn = Object.assign({}, ...Object.values(pageModules).map((m) => m.en ?? {}));
const pagesTh = Object.assign({}, ...Object.values(pageModules).map((m) => m.th ?? {}));

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: { ...en, ...pagesEn } },
    th: { translation: { ...th, ...pagesTh } },
  },
  lng: initialLanguage(),
  fallbackLng: "en",
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
});

// Keep the document language attribute in sync (a11y + correct font shaping).
if (typeof document !== "undefined") {
  document.documentElement.lang = i18n.language;
  i18n.on("languageChanged", (lng) => {
    document.documentElement.lang = lng;
  });
}

export function setLanguage(lng: Language) {
  try {
    localStorage.setItem("app_language", lng);
  } catch {
    /* localStorage unavailable */
  }
  void i18n.changeLanguage(lng);
}

export default i18n;
