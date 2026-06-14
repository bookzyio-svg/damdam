import {
  WashingMachine,
  Tv,
  Headphones,
  Laptop,
  Smartphone,
  House,
  BadgePercent,
  Package,
  type LucideIcon,
} from "lucide-react";

/** Icône associée à chaque catégorie de navigation (fallback : colis). */
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  electromenager: WashingMachine,
  "tv-image": Tv,
  audio: Headphones,
  informatique: Laptop,
  telephonie: Smartphone,
  "maison-connectee": House,
  promotions: BadgePercent,
};

export function categoryIcon(slug: string): LucideIcon {
  return CATEGORY_ICONS[slug] ?? Package;
}
