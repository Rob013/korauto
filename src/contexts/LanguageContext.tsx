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
    return (saved as Language) || "alb";
  });

  useEffect(() => {
    localStorage.setItem("korauto-language", language);
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    return translations[language]?.[key] || translations.alb[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

const translations: Record<Language, Record<string, string>> = {
  alb: {
    // Header
    "nav.home": "Kryefaqja",
    "nav.catalog": "Katalogu",
    "nav.favorites": "Të Preferuarat",
    "nav.inspection": "Inspektimet",
    "nav.tracking": "Gjurmimi",
    "nav.contacts": "Kontaktet",
    "nav.account": "Llogaria Ime",
    
    // Hero
    "hero.title": "Ankandet Premium të Makinave",
    "hero.subtitle": "Redefinuar",
    "hero.description": "Zbuloni automjete të jashtëzakonshme, bëni oferta me besim, dhe drejtoni makinën tuaj të ëndërruar nga platforma më e besueshme e ankandit në Evropë.",
    "hero.cta.browse": "Shfleto Ankandin",
    "hero.cta.demo": "Shiko Demon",
    "hero.stats.cars": "Makina të Shitura",
    "hero.stats.value": "Vlera Totale",
    "hero.stats.satisfaction": "Kënaqësi",
    "hero.stats.support": "Mbështetje",
    
    // Buttons
    "btn.viewCars": "Shiko Makinat",
    "btn.whatsapp": "Kontakto WhatsApp",
    
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
  en: {
    // Header
    "nav.home": "Home",
    "nav.catalog": "Catalog",
    "nav.favorites": "Favorites",
    "nav.inspection": "Inspection",
    "nav.tracking": "Tracking",
    "nav.contacts": "Contacts",
    "nav.account": "My Account",
    
    // Hero
    "hero.title": "Premium Car Auctions",
    "hero.subtitle": "Redefined",
    "hero.description": "Discover exceptional vehicles, bid with confidence, and drive away with your dream car from Europe's most trusted auction platform.",
    "hero.cta.browse": "Browse Live Auctions",
    "hero.cta.demo": "Watch Demo",
    "hero.stats.cars": "Cars Sold",
    "hero.stats.value": "Total Value",
    "hero.stats.satisfaction": "Satisfaction",
    "hero.stats.support": "Support",
    
    // Buttons
    "btn.viewCars": "View Cars",
    "btn.whatsapp": "Contact WhatsApp",
    
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
  de: {
    // Header
    "nav.home": "Startseite",
    "nav.catalog": "Katalog",
    "nav.favorites": "Favoriten",
    "nav.inspection": "Inspektion",
    "nav.tracking": "Verfolgung",
    "nav.contacts": "Kontakte",
    "nav.account": "Mein Konto",
    
    // Hero
    "hero.title": "Premium-Autoauktionen",
    "hero.subtitle": "Neu Definiert",
    "hero.description": "Entdecken Sie außergewöhnliche Fahrzeuge, bieten Sie mit Vertrauen und fahren Sie mit Ihrem Traumauto von Europas vertrauenswürdigster Auktionsplattform davon.",
    "hero.cta.browse": "Live-Auktionen durchsuchen",
    "hero.cta.demo": "Demo ansehen",
    "hero.stats.cars": "Verkaufte Autos",
    "hero.stats.value": "Gesamtwert",
    "hero.stats.satisfaction": "Zufriedenheit",
    "hero.stats.support": "Unterstützung",
    
    // Buttons
    "btn.viewCars": "Autos ansehen",
    "btn.whatsapp": "WhatsApp kontaktieren",
    
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
