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
    
    // Home Section
    "home.welcome": "Mirë se vini në",
    "home.subtitle": "Platforma juaj e besuar për makina premium",
    "home.description": "Ne ofrojmë zgjedhjen më të mirë të automjeteve me cilësi të lartë nga Koreja e Jugut. Çdo makinë inspektohet me kujdes dhe vjen me raporte të detajuara.",
    "home.features.quality": "Cilësi e Garantuar",
    "home.features.qualityDesc": "Të gjitha makinat janë inspektuar dhe certifikuar",
    "home.features.support": "Mbështetje 24/7",
    "home.features.supportDesc": "Ekipi ynë është gjithmonë gati të ndihmojë",
    "home.features.shipping": "Dërgesë e Sigurt",
    "home.features.shippingDesc": "Transport profesional dhe i sigurt",
    
    // Cars Section
    "cars.title": "Makinat Tona",
    "cars.subtitle": "Zgjidhni nga koleksioni ynë i makinave premium",
    "cars.viewAll": "Shiko të Gjitha",
    "cars.addToFavorites": "Shto tek të Preferuarat",
    "cars.removeFromFavorites": "Hiq nga të Preferuarat",
    
    // Inspection
    "inspection.title": "Shërbimi i Inspektimit",
    "inspection.subtitle": "Raporte profesionale inspektimi për çdo makinë",
    "inspection.description": "Ne ofrojmë shërbime të plota inspektimi për të garantuar që ju po blini një makinë me cilësi të lartë. Inspektorët tanë profesionistë kontrollojnë çdo detaj.",
    "inspection.features.comprehensive": "Inspektim i Plotë",
    "inspection.features.comprehensiveDesc": "Kontroll i detajuar i të gjitha sistemeve",
    "inspection.features.photos": "Foto të Detajuara",
    "inspection.features.photosDesc": "Imazhe me rezolucion të lartë nga çdo kënd",
    "inspection.features.report": "Raport i Detajuar",
    "inspection.features.reportDesc": "Dokumentim i plotë i gjendjes",
    "inspection.request": "Kërko Inspektim",
    
    // Contact
    "contact.title": "Na Kontaktoni",
    "contact.subtitle": "Jemi këtu për t'ju ndihmuar",
    "contact.description": "Keni pyetje? Dëshironi të mësoni më shumë? Na kontaktoni dhe do t'ju përgjigjemi sa më shpejt.",
    "contact.phone": "Telefoni",
    "contact.email": "Email",
    "contact.address": "Adresa",
    "contact.hours": "Orari i Punës",
    "contact.hoursValue": "E Hënë - E Shtunë: 9:00 - 18:00",
    "contact.form.name": "Emri",
    "contact.form.email": "Email",
    "contact.form.message": "Mesazhi",
    "contact.form.send": "Dërgo Mesazh",
    
    // Footer
    "footer.about": "Rreth Nesh",
    "footer.aboutText": "KORAUTO është platforma juaj e besuar për blerjen e makinave premium nga Koreja e Jugut. Ne ofrojmë transparencë të plotë dhe shërbim profesional.",
    "footer.quickLinks": "Lidhje të Shpejta",
    "footer.services": "Shërbimet",
    "footer.contact": "Kontakti",
    "footer.rights": "Të gjitha të drejtat e rezervuara.",
    "footer.privacy": "Politika e Privatësisë",
    "footer.terms": "Kushtet e Shërbimit",
    
    // Buttons
    "btn.viewCars": "Shiko Makinat",
    "btn.whatsapp": "Kontakto WhatsApp",
    "btn.learnMore": "Mëso Më Shumë",
    "btn.getStarted": "Fillo Tani",
    
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
    "filters.show": "Shfaq Filtrat",
    "filters.hide": "Fshih Filtrat",
    
    // Common
    "common.loading": "Duke u ngarkuar...",
    "common.viewDetails": "Shiko Detajet",
    "common.price": "Çmimi",
    "common.year": "Viti",
    "common.mileage": "Kilometrazhi",
    "common.sold": "E Shitur",
    "common.available": "E Disponueshme",
    "common.reserved": "E Rezervuar",
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
    
    // Home Section
    "home.welcome": "Welcome to",
    "home.subtitle": "Your trusted platform for premium cars",
    "home.description": "We offer the finest selection of high-quality vehicles from South Korea. Every car is carefully inspected and comes with detailed reports.",
    "home.features.quality": "Guaranteed Quality",
    "home.features.qualityDesc": "All cars are inspected and certified",
    "home.features.support": "24/7 Support",
    "home.features.supportDesc": "Our team is always ready to help",
    "home.features.shipping": "Secure Shipping",
    "home.features.shippingDesc": "Professional and safe transport",
    
    // Cars Section
    "cars.title": "Our Cars",
    "cars.subtitle": "Choose from our premium car collection",
    "cars.viewAll": "View All",
    "cars.addToFavorites": "Add to Favorites",
    "cars.removeFromFavorites": "Remove from Favorites",
    
    // Inspection
    "inspection.title": "Inspection Service",
    "inspection.subtitle": "Professional inspection reports for every car",
    "inspection.description": "We provide comprehensive inspection services to ensure you're buying a high-quality vehicle. Our professional inspectors check every detail.",
    "inspection.features.comprehensive": "Comprehensive Inspection",
    "inspection.features.comprehensiveDesc": "Detailed check of all systems",
    "inspection.features.photos": "Detailed Photos",
    "inspection.features.photosDesc": "High-resolution images from every angle",
    "inspection.features.report": "Detailed Report",
    "inspection.features.reportDesc": "Complete documentation of condition",
    "inspection.request": "Request Inspection",
    
    // Contact
    "contact.title": "Contact Us",
    "contact.subtitle": "We're here to help",
    "contact.description": "Have questions? Want to learn more? Contact us and we'll respond as soon as possible.",
    "contact.phone": "Phone",
    "contact.email": "Email",
    "contact.address": "Address",
    "contact.hours": "Working Hours",
    "contact.hoursValue": "Monday - Saturday: 9:00 AM - 6:00 PM",
    "contact.form.name": "Name",
    "contact.form.email": "Email",
    "contact.form.message": "Message",
    "contact.form.send": "Send Message",
    
    // Footer
    "footer.about": "About Us",
    "footer.aboutText": "KORAUTO is your trusted platform for buying premium cars from South Korea. We offer complete transparency and professional service.",
    "footer.quickLinks": "Quick Links",
    "footer.services": "Services",
    "footer.contact": "Contact",
    "footer.rights": "All rights reserved.",
    "footer.privacy": "Privacy Policy",
    "footer.terms": "Terms of Service",
    
    // Buttons
    "btn.viewCars": "View Cars",
    "btn.whatsapp": "Contact WhatsApp",
    "btn.learnMore": "Learn More",
    "btn.getStarted": "Get Started",
    
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
    "filters.show": "Show Filters",
    "filters.hide": "Hide Filters",
    
    // Common
    "common.loading": "Loading...",
    "common.viewDetails": "View Details",
    "common.price": "Price",
    "common.year": "Year",
    "common.mileage": "Mileage",
    "common.sold": "Sold",
    "common.available": "Available",
    "common.reserved": "Reserved",
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
    
    // Home Section
    "home.welcome": "Willkommen bei",
    "home.subtitle": "Ihre vertrauenswürdige Plattform für Premium-Autos",
    "home.description": "Wir bieten die beste Auswahl an hochwertigen Fahrzeugen aus Südkorea. Jedes Auto wird sorgfältig geprüft und kommt mit detaillierten Berichten.",
    "home.features.quality": "Garantierte Qualität",
    "home.features.qualityDesc": "Alle Autos sind geprüft und zertifiziert",
    "home.features.support": "24/7 Support",
    "home.features.supportDesc": "Unser Team ist immer bereit zu helfen",
    "home.features.shipping": "Sichere Lieferung",
    "home.features.shippingDesc": "Professioneller und sicherer Transport",
    
    // Cars Section
    "cars.title": "Unsere Autos",
    "cars.subtitle": "Wählen Sie aus unserer Premium-Autokollektion",
    "cars.viewAll": "Alle anzeigen",
    "cars.addToFavorites": "Zu Favoriten hinzufügen",
    "cars.removeFromFavorites": "Aus Favoriten entfernen",
    
    // Inspection
    "inspection.title": "Inspektionsservice",
    "inspection.subtitle": "Professionelle Inspektionsberichte für jedes Auto",
    "inspection.description": "Wir bieten umfassende Inspektionsdienste, um sicherzustellen, dass Sie ein hochwertiges Fahrzeug kaufen. Unsere professionellen Inspektoren prüfen jedes Detail.",
    "inspection.features.comprehensive": "Umfassende Inspektion",
    "inspection.features.comprehensiveDesc": "Detaillierte Prüfung aller Systeme",
    "inspection.features.photos": "Detaillierte Fotos",
    "inspection.features.photosDesc": "Hochauflösende Bilder aus jedem Winkel",
    "inspection.features.report": "Detaillierter Bericht",
    "inspection.features.reportDesc": "Vollständige Dokumentation des Zustands",
    "inspection.request": "Inspektion anfordern",
    
    // Contact
    "contact.title": "Kontaktieren Sie uns",
    "contact.subtitle": "Wir sind hier um zu helfen",
    "contact.description": "Haben Sie Fragen? Möchten Sie mehr erfahren? Kontaktieren Sie uns und wir werden so schnell wie möglich antworten.",
    "contact.phone": "Telefon",
    "contact.email": "E-Mail",
    "contact.address": "Adresse",
    "contact.hours": "Arbeitszeiten",
    "contact.hoursValue": "Montag - Samstag: 9:00 - 18:00 Uhr",
    "contact.form.name": "Name",
    "contact.form.email": "E-Mail",
    "contact.form.message": "Nachricht",
    "contact.form.send": "Nachricht senden",
    
    // Footer
    "footer.about": "Über uns",
    "footer.aboutText": "KORAUTO ist Ihre vertrauenswürdige Plattform für den Kauf von Premium-Autos aus Südkorea. Wir bieten vollständige Transparenz und professionellen Service.",
    "footer.quickLinks": "Schnelllinks",
    "footer.services": "Dienstleistungen",
    "footer.contact": "Kontakt",
    "footer.rights": "Alle Rechte vorbehalten.",
    "footer.privacy": "Datenschutzrichtlinie",
    "footer.terms": "Nutzungsbedingungen",
    
    // Buttons
    "btn.viewCars": "Autos ansehen",
    "btn.whatsapp": "WhatsApp kontaktieren",
    "btn.learnMore": "Mehr erfahren",
    "btn.getStarted": "Jetzt starten",
    
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
    "filters.show": "Filter anzeigen",
    "filters.hide": "Filter ausblenden",
    
    // Common
    "common.loading": "Wird geladen...",
    "common.viewDetails": "Details anzeigen",
    "common.price": "Preis",
    "common.year": "Jahr",
    "common.mileage": "Kilometerstand",
    "common.sold": "Verkauft",
    "common.available": "Verfügbar",
    "common.reserved": "Reserviert",
  },
};
