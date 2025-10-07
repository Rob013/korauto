import { useLanguage, Language } from "@/contexts/LanguageContext";
import { Button } from "./ui/button";

const languages: { code: Language; label: string }[] = [
  { code: "alb", label: "ALB" },
  { code: "en", label: "EN" },
  { code: "de", label: "DE" },
];

export const LanguageSwitcher = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-1 bg-background/50 backdrop-blur-sm rounded-lg p-1 border border-border/50">
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => setLanguage(lang.code)}
          className={`
            px-3 py-1.5 text-xs font-semibold rounded-md
            transition-all duration-300 ease-smooth
            ${
              language === lang.code
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
            }
          `}
        >
          {lang.label}
        </button>
      ))}
    </div>
  );
};
