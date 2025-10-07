import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Language = "en" | "alb" | "de";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider = ({ children }: LanguageProviderProps) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem("korauto-language");
    return (saved as Language) || "en";
  });

  useEffect(() => {
    localStorage.setItem("korauto-language", language);
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    return translations[language]?.[key] || translations.en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Header
    "nav.home": "Home",
    "nav.catalog": "Catalog",
    "nav.favorites": "Favorites",
    "nav.inspection": "Inspection",
    "nav.tracking": "Tracking",
    "nav.contacts": "Contacts",
    
    // Hero
    "hero.title": "Premium Cars from South Korea",
    "hero.subtitle": "Discover high-quality vehicles with detailed inspection reports",
    "hero.cta": "Browse Catalog",
    
    // Search
    "search.placeholder": "Search by brand, model...",
    "search.button": "Search",
    
    // Filters
    "filters.title": "Filters",
    "filters.brand": "Brand",
    "filters.model": "Model",
    "filters.year": "Year",
    "filters.price": "Price",
    "filters.mileage": "Mileage",
    "filters.clear": "Clear Filters",
    "filters.apply": "Apply",
    
    // Common
    "common.loading": "Loading...",
    "common.viewDetails": "View Details",
    "common.price": "Price",
    "common.year": "Year",
    "common.mileage": "Mileage",
  },
  alb: {
    // Header
    "nav.home": "Ballina",
    "nav.catalog": "Katalogu",
    "nav.favorites": "Të Preferuarat",
    "nav.inspection": "Inspektimi",
    "nav.tracking": "Gjurmimi",
    "nav.contacts": "Kontaktet",
    
    // Hero
    "hero.title": "Makina Premium nga Koreja e Jugut",
    "hero.subtitle": "Zbuloni automjete me cilësi të lartë me raporte të detajuara inspektimi",
    "hero.cta": "Shfleto Katalogun",
    
    // Search
    "search.placeholder": "Kërko sipas markës, modelit...",
    "search.button": "Kërko",
    
    // Filters
    "filters.title": "Filtrat",
    "filters.brand": "Marka",
    "filters.model": "Modeli",
    "filters.year": "Viti",
    "filters.price": "Çmimi",
    "filters.mileage": "Kilometrazhi",
    "filters.clear": "Pastro Filtrat",
    "filters.apply": "Apliko",
    
    // Common
    "common.loading": "Duke u ngarkuar...",
    "common.viewDetails": "Shiko Detajet",
    "common.price": "Çmimi",
    "common.year": "Viti",
    "common.mileage": "Kilometrazhi",
  },
  de: {
    // Header
    "nav.home": "Startseite",
    "nav.catalog": "Katalog",
    "nav.favorites": "Favoriten",
    "nav.inspection": "Inspektion",
    "nav.tracking": "Verfolgung",
    "nav.contacts": "Kontakte",
    
    // Hero
    "hero.title": "Premium-Autos aus Südkorea",
    "hero.subtitle": "Entdecken Sie hochwertige Fahrzeuge mit detaillierten Inspektionsberichten",
    "hero.cta": "Katalog durchsuchen",
    
    // Search
    "search.placeholder": "Suche nach Marke, Modell...",
    "search.button": "Suchen",
    
    // Filters
    "filters.title": "Filter",
    "filters.brand": "Marke",
    "filters.model": "Modell",
    "filters.year": "Jahr",
    "filters.price": "Preis",
    "filters.mileage": "Kilometerstand",
    "filters.clear": "Filter löschen",
    "filters.apply": "Anwenden",
    
    // Common
    "common.loading": "Wird geladen...",
    "common.viewDetails": "Details anzeigen",
    "common.price": "Preis",
    "common.year": "Jahr",
    "common.mileage": "Kilometerstand",
  },
};
