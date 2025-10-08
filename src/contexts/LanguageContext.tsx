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
    "home.description": "Gjeni makinën tuaj të përsosur nga Koreja e Jugut me çmimin më të mirë dhe cilësinë e lartë",
    "home.features.quality": "Garanci 100%",
    "home.features.qualityDesc": "Të gjitha makinat janë inspektuar dhe certifikuar",
    "home.features.support": "24/7 Mbështetje",
    "home.features.supportDesc": "Ekipi ynë është gjithmonë gati të ndihmojë",
    "home.features.shipping": "Dërgesë e Sigurt",
    "home.features.shippingDesc": "Transport profesional dhe i sigurt",
    
    // Cars Section
    "cars.title": "Makinat e Disponueshme",
    "cars.subtitle": "Zgjidhni nga koleksioni ynë i makinave premium",
    "cars.viewAll": "Shiko të gjitha",
    "cars.addToFavorites": "Shto tek të Preferuarat",
    "cars.removeFromFavorites": "Hiq nga të Preferuarat",
    "cars.available": "Makina të disponueshme",
    "cars.noResults": "Nuk ka makina të disponueshme",
    "cars.apiError": "Problem me lidhjen API: Disa funksione mund të jenë të kufizuara",
    "cars.fallbackNote": "Shfaqen makina të përzgjedhura. Për përditësime të reja, kontaktoni: +38348181116",
    "cars.loading": "Duke ngarkuar...",
    "cars.similar": "Makina të Ngjashme",
    "cars.similarLoading": "Duke ngarkuar makina të ngjashme...",
    
    // Inspection
    "inspection.title": "Shërbim profesional i importit të makinave",
    "inspection.subtitle": "Raporte profesionale inspektimi për çdo makinë",
    "inspection.description": "Kërkoni një inspektim profesional për çdo makinë vetëm për €50. Fitoni qetësinë mendore me shërbimin tonë gjithëpërfshirës të vlerësimit të mjeteve.",
    "inspection.howItWorks": "Si Funksionon",
    "inspection.whatsIncluded": "Çfarë Përfshihet:",
    "inspection.price": "€50",
    "inspection.priceDesc": "për inspektim mjeti",
    "inspection.request": "Kërkesë për Inspektim (€50)",
    "inspection.step1.title": "Vlerësim Profesional",
    "inspection.step1.desc": "Mekanikët e certifikuar kryejnë inspektime gjithëpërfshirëse të mjeteve",
    "inspection.step2.title": "Dokumentim me Foto",
    "inspection.step2.desc": "Dokumentim i detajuar vizual i gjendjes së mjetit",
    "inspection.step3.title": "Raport i Detajuar",
    "inspection.step3.desc": "Raport i plotë i gjendjes me rekomandime",
    "inspection.step4.title": "Përgjigje e Shpejtë",
    "inspection.step4.desc": "Inspektimi programohet brenda 24 orësh",
    "inspection.feature1": "Lista kontrolluese 150-pikëshe",
    "inspection.feature2": "Dokumentim me foto rezolucion të lartë",
    "inspection.feature3": "Raport i detajuar i gjendjes",
    "inspection.feature4": "Vlerësim mekanik",
    "inspection.feature5": "Dorëzimi i raportit të njëjtën ditë",
    "inspection.feature6": "Garanci 100% për MOTOR, TRANSMISION dhe KM me prakontratë",
    "inspection.trustedBy": "I besuar nga mijëra blerës makinash",
    "inspection.rating": "rating",
    
    // Contact
    "contact.title": "Na Kontaktoni",
    "contact.subtitle": "Jemi këtu për t'ju ndihmuar",
    "contact.description": "Dërgoni një mesazh",
    "contact.phone": "Telefoni",
    "contact.email": "Email",
    "contact.address": "Vendndodhja",
    "contact.hours": "Orari",
    "contact.hoursValue": "Çdo ditë: 9:00-18:00",
    "contact.salesAgent": "Agent shitjesh",
    "contact.available": "Jemi të disponueshëm",
    "contact.quickResponse": "Përgjigje e Shpejtë",
    "contact.quickResponseDesc": "Keni nevojë për inspektim? Na kontaktoni dhe ne do të programojmë inspektimin tuaj profesional të makinës brenda 24 orësh. Mekanikët tanë të certifikuar janë gati të ofrojnë vlerësime të detajuara për çdo mjet në listat tona.",
    "contact.form.name": "Emri",
    "contact.form.email": "Email",
    "contact.form.message": "Mesazhi",
    "contact.form.send": "Dërgo Mesazh",
    
    // Footer
    "footer.about": "Rreth Nesh",
    "footer.aboutText": "Partneri juaj i besuar për makina të cilësisë së lartë me shërbime profesionale inspektimi në të gjithë Korenë e jugut.",
    "footer.quickLinks": "Lidhje të Shpejta",
    "footer.services": "Shërbimet",
    "footer.contact": "Kontakti",
    "footer.rights": "Të gjitha të drejtat e rezervuara. Shërbime profesionale inspektimi makinash.",
    "footer.privacy": "Politika e Privatësisë",
    "footer.terms": "Kushtet e Shërbimit",
    
    // Buttons & Actions
    "btn.viewCars": "Shiko Makinat",
    "btn.whatsapp": "Kontakto WhatsApp",
    "btn.learnMore": "Mëso Më Shumë",
    "btn.getStarted": "Fillo Tani",
    "btn.viewDetails": "Shiko Detajet",
    "btn.requestInspection": "Kërko Inspektim",
    "btn.search": "Kërko Makinat",
    "btn.showAdvanced": "Shfaq Filtrat e Avancuara",
    "btn.hideAdvanced": "Fshih Filtrat e Avancuara",
    "btn.showFilters": "Filtrat",
    "btn.hideFilters": "Fshih",
    "btn.clearFilters": "Pastro të Gjitha",
    "btn.applyFilters": "Apliko Filtrat",
    
    // Search & Filters
    "search.placeholder": "Kërko sipas markës, modelit...",
    "search.button": "Kërko",
    "search.title": "Kërko Makinat",
    "search.filters": "Filtrat e Kërkimit",
    "filters.title": "Filtrat",
    "filters.basic": "Filtrat Bazë",
    "filters.advanced": "Filtrat e Avancuar",
    "filters.brand": "Marka",
    "filters.model": "Modeli",
    "filters.year": "Viti",
    "filters.yearFrom": "Nga Viti",
    "filters.yearTo": "Deri në vitin",
    "filters.quickYear": "Zgjedhja e Shpejtë e Vitit",
    "filters.price": "Çmimi (EUR)",
    "filters.priceRange": "Intervali i Çmimit (Blerje direkte)",
    "filters.mileage": "Kilometrazhi (km)",
    "filters.mileageRange": "Intervali i Kilometrazhit (km)",
    "filters.transmission": "Transmisioni",
    "filters.fuel": "Karburanti",
    "filters.color": "Ngjyra",
    "filters.bodyType": "Tipi i Trupit",
    "filters.seats": "Numri i Vendeve",
    "filters.clear": "Pastro Filtrat",
    "filters.apply": "Apliko",
    "filters.show": "Shfaq Filtrat",
    "filters.hide": "Fshih Filtrat",
    "filters.updating": "Duke përditësuar filtrat...",
    "filters.selectBrand": "Për të parë makinat, ju duhet të zgjidhni së paku markën dhe modelin e makinës.",
    "filters.close": "Mbyll filtrat",
    
    // Car Details
    "car.year": "Viti",
    "car.mileage": "Kilometrazhi",
    "car.transmission": "Transmisioni",
    "car.fuel": "Karburanti",
    "car.color": "Ngjyra",
    "car.price": "Çmimi",
    "car.priceKorauto": "Çmimi KORAUTO",
    "car.priceOnRequest": "Çmimi në kërkesë",
    "car.vin": "VIN",
    "car.lot": "LOT",
    "car.status": "Statusi",
    "car.sold": "E Shitur",
    "car.available": "E Disponueshme",
    "car.reserved": "E Rezervuar",
    "car.condition": "Gjendja",
    "car.accidents": "Aksidente",
    "car.seats": "Vende",
    
    // Sorting
    "sort.title": "Renditja",
    "sort.default": "Rekomanduara",
    "sort.priceAsc": "Çmimi: Ulët në Lartë",
    "sort.priceDesc": "Çmimi: Lartë në Ulët",
    "sort.yearDesc": "Viti: Më i Ri",
    "sort.yearAsc": "Viti: Më i Vjetër",
    "sort.mileageAsc": "Kilometrazhi: Ulët në Lartë",
    "sort.mileageDesc": "Kilometrazhi: Lartë në Ulët",
    
    // Messages & Notifications
    "msg.loginRequired": "Ju lutem identifikohuni për të ruajtur makinat e preferuara",
    "msg.addedToFavorites": "Makina u ruajt në të preferuarat tuaja",
    "msg.removedFromFavorites": "Makina u hoq nga të preferuarat tuaja",
    "msg.error": "Ndodhi një gabim",
    "msg.success": "Sukses",
    
    // Common
    "common.loading": "Duke u ngarkuar...",
    "common.viewDetails": "Shiko Detajet",
    "common.price": "Çmimi",
    "common.year": "Viti",
    "common.mileage": "Kilometrazhi",
    "common.sold": "E Shitur",
    "common.available": "E Disponueshme",
    "common.reserved": "E Rezervuar",
    "common.or": "ose",
    "common.km": "km",
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
    "home.description": "Find your perfect car from South Korea with the best price and high quality",
    "home.features.quality": "100% Guarantee",
    "home.features.qualityDesc": "All cars are inspected and certified",
    "home.features.support": "24/7 Support",
    "home.features.supportDesc": "Our team is always ready to help",
    "home.features.shipping": "Secure Shipping",
    "home.features.shippingDesc": "Professional and safe transport",
    
    // Cars Section
    "cars.title": "Available Cars",
    "cars.subtitle": "Choose from our premium car collection",
    "cars.viewAll": "View All",
    "cars.addToFavorites": "Add to Favorites",
    "cars.removeFromFavorites": "Remove from Favorites",
    "cars.available": "Available cars",
    "cars.noResults": "No cars available",
    "cars.apiError": "API connection issue: Some features may be limited",
    "cars.fallbackNote": "Showing selected cars. For new updates, contact: +38348181116",
    "cars.loading": "Loading...",
    "cars.similar": "Similar Cars",
    "cars.similarLoading": "Loading similar cars...",
    
    // Inspection
    "inspection.title": "Professional Car Import Service",
    "inspection.subtitle": "Professional inspection reports for every car",
    "inspection.description": "Request a professional inspection for any car for only €50. Get peace of mind with our comprehensive vehicle assessment service.",
    "inspection.howItWorks": "How It Works",
    "inspection.whatsIncluded": "What's Included:",
    "inspection.price": "€50",
    "inspection.priceDesc": "per vehicle inspection",
    "inspection.request": "Request Inspection (€50)",
    "inspection.step1.title": "Professional Assessment",
    "inspection.step1.desc": "Certified mechanics perform comprehensive vehicle inspections",
    "inspection.step2.title": "Photo Documentation",
    "inspection.step2.desc": "Detailed visual documentation of vehicle condition",
    "inspection.step3.title": "Detailed Report",
    "inspection.step3.desc": "Complete condition report with recommendations",
    "inspection.step4.title": "Quick Response",
    "inspection.step4.desc": "Inspection scheduled within 24 hours",
    "inspection.feature1": "150-point checklist",
    "inspection.feature2": "High-resolution photo documentation",
    "inspection.feature3": "Detailed condition report",
    "inspection.feature4": "Mechanical assessment",
    "inspection.feature5": "Same-day report delivery",
    "inspection.feature6": "100% guarantee for ENGINE, TRANSMISSION and MILEAGE with pre-contract",
    "inspection.trustedBy": "Trusted by thousands of car buyers",
    "inspection.rating": "rating",
    
    // Contact
    "contact.title": "Contact Us",
    "contact.subtitle": "We're here to help",
    "contact.description": "Send a message",
    "contact.phone": "Phone",
    "contact.email": "Email",
    "contact.address": "Location",
    "contact.hours": "Hours",
    "contact.hoursValue": "Every day: 9:00 AM - 6:00 PM",
    "contact.salesAgent": "Sales Agent",
    "contact.available": "We are available",
    "contact.quickResponse": "Quick Response",
    "contact.quickResponseDesc": "Need an inspection? Contact us and we'll schedule your professional car inspection within 24 hours. Our certified mechanics are ready to provide detailed assessments for any vehicle on our listings.",
    "contact.form.name": "Name",
    "contact.form.email": "Email",
    "contact.form.message": "Message",
    "contact.form.send": "Send Message",
    
    // Footer
    "footer.about": "About Us",
    "footer.aboutText": "Your trusted partner for high-quality cars with professional inspection services across South Korea.",
    "footer.quickLinks": "Quick Links",
    "footer.services": "Services",
    "footer.contact": "Contact",
    "footer.rights": "All rights reserved. Professional car inspection services.",
    "footer.privacy": "Privacy Policy",
    "footer.terms": "Terms of Service",
    
    // Buttons & Actions
    "btn.viewCars": "View Cars",
    "btn.whatsapp": "Contact WhatsApp",
    "btn.learnMore": "Learn More",
    "btn.getStarted": "Get Started",
    "btn.viewDetails": "View Details",
    "btn.requestInspection": "Request Inspection",
    "btn.search": "Search Cars",
    "btn.showAdvanced": "Show Advanced Filters",
    "btn.hideAdvanced": "Hide Advanced Filters",
    "btn.showFilters": "Filters",
    "btn.hideFilters": "Hide",
    "btn.clearFilters": "Clear All",
    "btn.applyFilters": "Apply Filters",
    
    // Search & Filters
    "search.placeholder": "Search by brand, model...",
    "search.button": "Search",
    "search.title": "Search Cars",
    "search.filters": "Search Filters",
    "filters.title": "Filters",
    "filters.basic": "Basic Filters",
    "filters.advanced": "Advanced Filters",
    "filters.brand": "Brand",
    "filters.model": "Model",
    "filters.year": "Year",
    "filters.yearFrom": "From Year",
    "filters.yearTo": "To Year",
    "filters.quickYear": "Quick Year Selection",
    "filters.price": "Price (EUR)",
    "filters.priceRange": "Price Range (Buy Now)",
    "filters.mileage": "Mileage (km)",
    "filters.mileageRange": "Mileage Range (km)",
    "filters.transmission": "Transmission",
    "filters.fuel": "Fuel",
    "filters.color": "Color",
    "filters.bodyType": "Body Type",
    "filters.seats": "Seats",
    "filters.clear": "Clear Filters",
    "filters.apply": "Apply",
    "filters.show": "Show Filters",
    "filters.hide": "Hide Filters",
    "filters.updating": "Updating filters...",
    "filters.selectBrand": "To view cars, you must select at least the brand and model.",
    "filters.close": "Close filters",
    
    // Car Details
    "car.year": "Year",
    "car.mileage": "Mileage",
    "car.transmission": "Transmission",
    "car.fuel": "Fuel",
    "car.color": "Color",
    "car.price": "Price",
    "car.priceKorauto": "KORAUTO Price",
    "car.priceOnRequest": "Price on request",
    "car.vin": "VIN",
    "car.lot": "LOT",
    "car.status": "Status",
    "car.sold": "Sold",
    "car.available": "Available",
    "car.reserved": "Reserved",
    "car.condition": "Condition",
    "car.accidents": "Accidents",
    "car.seats": "Seats",
    
    // Sorting
    "sort.title": "Sort",
    "sort.default": "Recommended",
    "sort.priceAsc": "Price: Low to High",
    "sort.priceDesc": "Price: High to Low",
    "sort.yearDesc": "Year: Newest",
    "sort.yearAsc": "Year: Oldest",
    "sort.mileageAsc": "Mileage: Low to High",
    "sort.mileageDesc": "Mileage: High to Low",
    
    // Messages & Notifications
    "msg.loginRequired": "Please log in to save favorite cars",
    "msg.addedToFavorites": "Car added to your favorites",
    "msg.removedFromFavorites": "Car removed from your favorites",
    "msg.error": "An error occurred",
    "msg.success": "Success",
    
    // Common
    "common.loading": "Loading...",
    "common.viewDetails": "View Details",
    "common.price": "Price",
    "common.year": "Year",
    "common.mileage": "Mileage",
    "common.sold": "Sold",
    "common.available": "Available",
    "common.reserved": "Reserved",
    "common.or": "or",
    "common.km": "km",
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
    "home.description": "Finden Sie Ihr perfektes Auto aus Südkorea zum besten Preis und hoher Qualität",
    "home.features.quality": "100% Garantie",
    "home.features.qualityDesc": "Alle Autos sind geprüft und zertifiziert",
    "home.features.support": "24/7 Support",
    "home.features.supportDesc": "Unser Team ist immer bereit zu helfen",
    "home.features.shipping": "Sichere Lieferung",
    "home.features.shippingDesc": "Professioneller und sicherer Transport",
    
    // Cars Section
    "cars.title": "Verfügbare Autos",
    "cars.subtitle": "Wählen Sie aus unserer Premium-Autokollektion",
    "cars.viewAll": "Alle anzeigen",
    "cars.addToFavorites": "Zu Favoriten hinzufügen",
    "cars.removeFromFavorites": "Aus Favoriten entfernen",
    "cars.available": "Verfügbare Autos",
    "cars.noResults": "Keine Autos verfügbar",
    "cars.apiError": "API-Verbindungsproblem: Einige Funktionen können eingeschränkt sein",
    "cars.fallbackNote": "Ausgewählte Autos werden angezeigt. Für neue Updates kontaktieren Sie: +38348181116",
    "cars.loading": "Wird geladen...",
    "cars.similar": "Ähnliche Autos",
    "cars.similarLoading": "Ähnliche Autos werden geladen...",
    
    // Inspection
    "inspection.title": "Professioneller Autoimport-Service",
    "inspection.subtitle": "Professionelle Inspektionsberichte für jedes Auto",
    "inspection.description": "Fordern Sie eine professionelle Inspektion für jedes Auto für nur 50€ an. Erhalten Sie Sicherheit mit unserem umfassenden Fahrzeugbewertungsservice.",
    "inspection.howItWorks": "Wie es funktioniert",
    "inspection.whatsIncluded": "Was ist enthalten:",
    "inspection.price": "€50",
    "inspection.priceDesc": "pro Fahrzeuginspektion",
    "inspection.request": "Inspektion anfordern (€50)",
    "inspection.step1.title": "Professionelle Bewertung",
    "inspection.step1.desc": "Zertifizierte Mechaniker führen umfassende Fahrzeuginspektionen durch",
    "inspection.step2.title": "Fotodokumentation",
    "inspection.step2.desc": "Detaillierte visuelle Dokumentation des Fahrzeugzustands",
    "inspection.step3.title": "Detaillierter Bericht",
    "inspection.step3.desc": "Vollständiger Zustandsbericht mit Empfehlungen",
    "inspection.step4.title": "Schnelle Antwort",
    "inspection.step4.desc": "Inspektion innerhalb von 24 Stunden geplant",
    "inspection.feature1": "150-Punkte-Checkliste",
    "inspection.feature2": "Hochauflösende Fotodokumentation",
    "inspection.feature3": "Detaillierter Zustandsbericht",
    "inspection.feature4": "Mechanische Bewertung",
    "inspection.feature5": "Berichtszustellung am selben Tag",
    "inspection.feature6": "100% Garantie für MOTOR, GETRIEBE und KILOMETERSTAND mit Vorvertrag",
    "inspection.trustedBy": "Vertraut von Tausenden von Autokäufern",
    "inspection.rating": "Bewertung",
    
    // Contact
    "contact.title": "Kontaktieren Sie uns",
    "contact.subtitle": "Wir sind hier um zu helfen",
    "contact.description": "Eine Nachricht senden",
    "contact.phone": "Telefon",
    "contact.email": "E-Mail",
    "contact.address": "Standort",
    "contact.hours": "Öffnungszeiten",
    "contact.hoursValue": "Jeden Tag: 9:00 - 18:00 Uhr",
    "contact.salesAgent": "Verkaufsberater",
    "contact.available": "Wir sind verfügbar",
    "contact.quickResponse": "Schnelle Antwort",
    "contact.quickResponseDesc": "Brauchen Sie eine Inspektion? Kontaktieren Sie uns und wir planen Ihre professionelle Autoinspektion innerhalb von 24 Stunden. Unsere zertifizierten Mechaniker sind bereit, detaillierte Bewertungen für jedes Fahrzeug in unseren Angeboten zu liefern.",
    "contact.form.name": "Name",
    "contact.form.email": "E-Mail",
    "contact.form.message": "Nachricht",
    "contact.form.send": "Nachricht senden",
    
    // Footer
    "footer.about": "Über uns",
    "footer.aboutText": "Ihr vertrauenswürdiger Partner für hochwertige Autos mit professionellen Inspektionsdiensten in ganz Südkorea.",
    "footer.quickLinks": "Schnelllinks",
    "footer.services": "Dienstleistungen",
    "footer.contact": "Kontakt",
    "footer.rights": "Alle Rechte vorbehalten. Professionelle Autoinspektionsdienste.",
    "footer.privacy": "Datenschutzrichtlinie",
    "footer.terms": "Nutzungsbedingungen",
    
    // Buttons & Actions
    "btn.viewCars": "Autos ansehen",
    "btn.whatsapp": "WhatsApp kontaktieren",
    "btn.learnMore": "Mehr erfahren",
    "btn.getStarted": "Jetzt starten",
    "btn.viewDetails": "Details anzeigen",
    "btn.requestInspection": "Inspektion anfordern",
    "btn.search": "Autos suchen",
    "btn.showAdvanced": "Erweiterte Filter anzeigen",
    "btn.hideAdvanced": "Erweiterte Filter ausblenden",
    "btn.showFilters": "Filter",
    "btn.hideFilters": "Ausblenden",
    "btn.clearFilters": "Alle löschen",
    "btn.applyFilters": "Filter anwenden",
    
    // Search & Filters
    "search.placeholder": "Suche nach Marke, Modell...",
    "search.button": "Suchen",
    "search.title": "Autos suchen",
    "search.filters": "Suchfilter",
    "filters.title": "Filter",
    "filters.basic": "Basisfilter",
    "filters.advanced": "Erweiterte Filter",
    "filters.brand": "Marke",
    "filters.model": "Modell",
    "filters.year": "Jahr",
    "filters.yearFrom": "Von Jahr",
    "filters.yearTo": "Bis Jahr",
    "filters.quickYear": "Schnelle Jahresauswahl",
    "filters.price": "Preis (EUR)",
    "filters.priceRange": "Preisspanne (Sofortkauf)",
    "filters.mileage": "Kilometerstand (km)",
    "filters.mileageRange": "Kilometerstandsbereich (km)",
    "filters.transmission": "Getriebe",
    "filters.fuel": "Kraftstoff",
    "filters.color": "Farbe",
    "filters.bodyType": "Karosserietyp",
    "filters.seats": "Sitze",
    "filters.clear": "Filter löschen",
    "filters.apply": "Anwenden",
    "filters.show": "Filter anzeigen",
    "filters.hide": "Filter ausblenden",
    "filters.updating": "Filter werden aktualisiert...",
    "filters.selectBrand": "Um Autos anzuzeigen, müssen Sie mindestens Marke und Modell auswählen.",
    "filters.close": "Filter schließen",
    
    // Car Details
    "car.year": "Jahr",
    "car.mileage": "Kilometerstand",
    "car.transmission": "Getriebe",
    "car.fuel": "Kraftstoff",
    "car.color": "Farbe",
    "car.price": "Preis",
    "car.priceKorauto": "KORAUTO Preis",
    "car.priceOnRequest": "Preis auf Anfrage",
    "car.vin": "FIN",
    "car.lot": "LOT",
    "car.status": "Status",
    "car.sold": "Verkauft",
    "car.available": "Verfügbar",
    "car.reserved": "Reserviert",
    "car.condition": "Zustand",
    "car.accidents": "Unfälle",
    "car.seats": "Sitze",
    
    // Sorting
    "sort.title": "Sortieren",
    "sort.default": "Empfohlen",
    "sort.priceAsc": "Preis: Niedrig bis Hoch",
    "sort.priceDesc": "Preis: Hoch bis Niedrig",
    "sort.yearDesc": "Jahr: Neueste",
    "sort.yearAsc": "Jahr: Älteste",
    "sort.mileageAsc": "Kilometerstand: Niedrig bis Hoch",
    "sort.mileageDesc": "Kilometerstand: Hoch bis Niedrig",
    
    // Messages & Notifications
    "msg.loginRequired": "Bitte melden Sie sich an, um Lieblingsautos zu speichern",
    "msg.addedToFavorites": "Auto zu Ihren Favoriten hinzugefügt",
    "msg.removedFromFavorites": "Auto aus Ihren Favoriten entfernt",
    "msg.error": "Ein Fehler ist aufgetreten",
    "msg.success": "Erfolg",
    
    // Common
    "common.loading": "Wird geladen...",
    "common.viewDetails": "Details anzeigen",
    "common.price": "Preis",
    "common.year": "Jahr",
    "common.mileage": "Kilometerstand",
    "common.sold": "Verkauft",
    "common.available": "Verfügbar",
    "common.reserved": "Reserviert",
    "common.or": "oder",
    "common.km": "km",
  },
};
