// Lazy load icons to reduce initial bundle size
import { lazy } from 'react';
import type { LucideIcon } from 'lucide-react';

// Import only the CheckCircle as default fallback
export { CheckCircle } from 'lucide-react';

// Define icon mappings with keywords
type EquipmentIconMapping = {
  iconName: string;
  keywords: string[];
};

export const EQUIPMENT_ICON_MAPPINGS: EquipmentIconMapping[] = [
  { iconName: 'Bluetooth', keywords: ["bluetooth", "handsfree", "hands-free", "hands free"] },
  { iconName: 'Usb', keywords: ["usb"] },
  { iconName: 'Cable', keywords: ["aux", "auxiliar", "auxiliary"] },
  { iconName: 'Smartphone', keywords: ["carplay", "android auto", "androidauto", "apple carplay", "smartphone", "smart phone", "smartlink", "smart link", "mirrorlink", "mirror link", "wireless charging"] },
  { iconName: 'Wifi', keywords: ["wifi", "wi-fi", "wireless", "hotspot", "hot spot"] },
  { iconName: 'Navigation', keywords: ["navigation", "navigacion", "navigator", "navi", "gps", "map", "maps"] },
  { iconName: 'Speaker', keywords: ["audio", "sound", "speaker", "stereo", "subwoofer", "woofer", "surround", "hi-fi", "hifi"] },
  { iconName: 'Music', keywords: ["cd", "dvd", "mp3", "media", "entertainment", "multimedia"] },
  { iconName: 'Radar', keywords: ["sensor", "radar", "parkimi", "parkim", "parking", "park assist", "park distance", "park pilot", "parktronic", "lane assist", "lane keep", "lane keeping", "blind spot", "distance control"] },
  { iconName: 'Camera', keywords: ["camera", "kamera", "rear view", "rearview", "360", "surround view", "dashcam", "reverse camera"] },
  { iconName: 'Gauge', keywords: ["cruise", "speed control", "kontroll i shpejtesise", "limiter", "adaptive cruise", "pilot assist"] },
  { iconName: 'Power', keywords: ["start stop", "start/stop", "start-stop", "startstop", "start stop system", "push start", "push-button start", "push button start", "start button", "keyless go", "remote start"] },
  { iconName: 'KeyRound', keywords: ["keyless", "key", "kyce", "remote", "bllokim", "locking", "lock", "central locking", "immobilizer"] },
  { iconName: 'ShieldCheck', keywords: ["airbag", "abs", "esp", "esc", "asr", "tcs", "tpms", "safety", "sistemi sigurie", "alarm", "security", "anti theft", "anti-theft", "emergency braking", "collision", "lane departure", "stability control", "kontroll stabiliteti", "monitoring"] },
  { iconName: 'Wind', keywords: ["climat", "clima", "klima", "klime", "climate", "air condition", "aircondition", "a/c", "hvac", "aircon"] },
  { iconName: 'Snowflake', keywords: ["cooling", "cooled", "cooler", "ventilated", "climatizim", "climatization"] },
  { iconName: 'Flame', keywords: ["heated", "ngroh", "heat", "defrost", "defog", "heated seat", "heated steering"] },
  { iconName: 'Fan', keywords: ["ventilated seat", "ventilated seats", "ventilim", "ventiluar", "ventiluara"] },
  { iconName: 'Armchair', keywords: ["seat", "seats", "ulese", "sedilje", "sedile", "chair", "armchair", "leather", "lekure", "lekur", "alcantara"] },
  { iconName: 'Users', keywords: ["pasagjer", "passenger", "family", "rear seats", "row", "isofix", "child"] },
  { iconName: 'Disc3', keywords: ["wheel", "rrota", "rim", "alloy", "tire", "tyre", "gom", "goma", "pneumatic"] },
  { iconName: 'Eye', keywords: ["window", "dritare", "glass", "windshield", "sunshade", "xham"] },
  { iconName: 'Sun', keywords: ["sunroof", "moonroof", "panoram", "panoramik", "panoramic", "tavan"] },
  { iconName: 'Lightbulb', keywords: ["light", "drite", "drita", "headlight", "xenon", "led", "fog", "daylight", "ndricim"] },
  { iconName: 'Fuel', keywords: ["fuel", "diesel", "gasoline", "benzin", "nafte", "battery", "electric", "hybrid", "plug in", "plug-in"] },
  { iconName: 'Cog', keywords: ["engine", "motor", "transmission", "gearbox", "gear", "powertrain", "drivetrain"] },
  { iconName: 'Settings', keywords: ["suspension", "tuning", "mode", "drive mode", "setup", "adjustable"] },
  { iconName: 'DoorClosed', keywords: ["door", "dyer", "mirror", "pasqyre", "pasqyra", "pasqyr"] }
];

const normalizeText = (value: string) =>
  value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const matchesKeyword = (normalizedItem: string, keyword: string) => {
  const normalizedKeyword = normalizeText(keyword.toLowerCase());

  if (/^[a-z0-9]+$/.test(normalizedKeyword)) {
    const keywordRegex = new RegExp(`\\b${normalizedKeyword}\\b`, "i");
    return keywordRegex.test(normalizedItem);
  }

  return normalizedItem.includes(normalizedKeyword);
};

// Dynamic icon loader with caching
const iconCache = new Map<string, LucideIcon>();

export const getEquipmentIconName = (itemName: string): string => {
  const normalizedItem = normalizeText(itemName.toLowerCase());

  for (const { iconName, keywords } of EQUIPMENT_ICON_MAPPINGS) {
    if (keywords.some((keyword) => matchesKeyword(normalizedItem, keyword))) {
      return iconName;
    }
  }

  return 'CheckCircle';
};

// Async icon loader for better performance
export const loadIcon = async (iconName: string): Promise<LucideIcon> => {
  if (iconCache.has(iconName)) {
    return iconCache.get(iconName)!;
  }

  try {
    const module = await import('lucide-react');
    const Icon = module[iconName as keyof typeof module] as LucideIcon;
    if (Icon) {
      iconCache.set(iconName, Icon);
      return Icon;
    }
  } catch (error) {
    console.warn(`Failed to load icon: ${iconName}`, error);
  }

  // Fallback to CheckCircle
  const { CheckCircle } = await import('lucide-react');
  return CheckCircle;
};
