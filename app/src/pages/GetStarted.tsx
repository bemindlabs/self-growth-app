import { useState } from "react";
import { useTranslation } from "react-i18next";
import { BookOpen, ChevronDown, ChevronUp } from "lucide-react";
import Markdown from "@/components/ui/Markdown";

const sectionIds = [
  "vision",
  "welcome",
  "setup",
  "howto",
  "faq",
  "terms",
  "privacy",
] as const;

export default function GetStarted() {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState<string>("vision");

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <BookOpen size={24} className="text-primary" />
        <h2 className="text-2xl font-bold">{t("getStarted.heading")}</h2>
      </div>

      <div className="space-y-2">
        {sectionIds.map((id) => {
          const isOpen = expanded === id;
          return (
            <div key={id} className="bg-card border border-border rounded-lg overflow-hidden">
              <button
                onClick={() => setExpanded(isOpen ? "" : id)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-secondary/50 transition-colors"
              >
                <h3 className="font-medium">{t(`getStarted.${id}.title`)}</h3>
                {isOpen ? (
                  <ChevronUp size={18} className="text-muted-foreground" />
                ) : (
                  <ChevronDown size={18} className="text-muted-foreground" />
                )}
              </button>
              {isOpen && (
                <div className="px-4 pb-4 border-t border-border pt-3">
                  <Markdown className="text-sm">{t(`getStarted.${id}.content`)}</Markdown>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
