import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function NotFound() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="bg-card rounded-lg border border-border p-8 max-w-sm w-full text-center">
        <p className="text-5xl font-bold text-muted-foreground mb-4">404</p>
        <h1 className="text-lg font-semibold mb-2">{t("notFound.title")}</h1>
        <p className="text-sm text-muted-foreground mb-6">
          {t("notFound.description")}
        </p>
        <Link
          to="/"
          className="inline-block bg-primary text-primary-foreground text-sm font-medium rounded-md px-5 py-2 hover:opacity-90 transition-opacity"
        >
          {t("notFound.back")}
        </Link>
      </div>
    </div>
  );
}
