// Shared icons for car components to reduce bundle size and duplication
import {
  Car,
  Gauge,
  Settings,
  Fuel,
  Palette,
  Heart,
  Shield,
  Calendar,
  DollarSign,
  MapPin,
  FileText,
  Wrench,
  Award,
  Info,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Key,
  Hash,
  Eye,
  Share2,
  ArrowRight,
  MessageCircle,
  Cog
} from "lucide-react";

// Common car-related icons
export const CarIcons = {
  Car,
  Gauge,
  Settings,
  Fuel,
  Palette,
  Heart,
  Shield,
  Calendar,
  DollarSign,
  MapPin,
  FileText,
  Wrench,
  Award,
  Info,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Key,
  Hash,
  Eye,
  Share2,
  ArrowRight,
  MessageCircle,
  Cog
} as const;

// Icon mapping for car attributes
export const AttributeIcons = {
  mileage: Gauge,
  transmission: Settings,
  fuel: Fuel,
  color: Palette,
  location: MapPin,
  year: Calendar,
  price: DollarSign,
  status: Info,
  accidents: AlertTriangle,
  insurance: Shield,
  keys: Key
} as const;