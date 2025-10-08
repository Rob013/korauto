import { useLanguage, Language } from "@/contexts/LanguageContext";
import { Button } from "./ui/button";
import { ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";

const languages: { code: Language; label: string }[] = [
  { code: "alb", label: "ALB" },
  { code: "en", label: "EN" },
  { code: "de", label: "DE" },
];

export const LanguageSwitcher = () => {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLang = languages.find((lang) => lang.code === language);
  const otherLanguages = languages.filter((lang) => lang.code !== language);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative z-50" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        onTouchEnd={(e) => {
          e.preventDefault();
          setIsOpen(!isOpen);
        }}
        className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg
          bg-background/50 backdrop-blur-sm border border-border/50
          hover:bg-accent/50 transition-all duration-300 ease-smooth relative z-50"
        style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
      >
        {currentLang?.label}
        <ChevronDown className={`h-3 w-3 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-1 right-0 bg-background/95 backdrop-blur-md border border-border rounded-lg shadow-xl overflow-hidden z-[100] min-w-[80px] animate-fade-in">
          {otherLanguages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                setLanguage(lang.code);
                setIsOpen(false);
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                setLanguage(lang.code);
                setIsOpen(false);
              }}
              className="w-full px-3 py-2 text-xs font-semibold text-foreground hover:bg-accent/50 transition-all duration-200 text-left"
              style={{ touchAction: 'manipulation' }}
            >
              {lang.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
