import type { LucideIcon } from 'lucide-react';
import {
  Store,
  MapPin,
  Leaf,
  LineChart,
  Landmark,
  ClipboardList,
  Truck,
  CloudSun,
  ShieldCheck,
  Lock,
  Navigation,
  PiggyBank,
  BadgeIndianRupee,
  Smartphone,
  Users,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Shared types                                                       */
/* ------------------------------------------------------------------ */

export interface Feature {
  icon: LucideIcon;
  titleKey: string;
  descKey: string;
  gradient: string;
  glow: string;
  className?: string;
}

export interface CropListing {
  id: string;
  nameKey: string;
  image: string;
  price: number;
  unit: string;
  quantity: number;
  quantityUnit: string;
  villageKey: string;
  districtKey: string;
  postedKey: string;
  verified: boolean;
}

export interface Testimonial {
  id: string;
  quoteKey: string;
  nameKey: string;
  roleKey: string;
  locationKey: string;
  avatarHue: string;
}

export interface FaqItem {
  id: string;
  questionKey: string;
  answerKey: string;
}

export interface Step {
  number: string;
  icon: LucideIcon;
  titleKey: string;
  descKey: string;
}

export interface Stat {
  value: string;
  labelKey: string;
  icon: LucideIcon;
}

export interface Benefit {
  icon: LucideIcon;
  titleKey: string;
  descKey: string;
}

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

export const NAV_LINKS = [
  { id: 'home', labelKey: 'nav.home' },
  { id: 'marketplace', labelKey: 'nav.marketplace' },
  { id: 'features', labelKey: 'nav.features' },
  { id: 'about', labelKey: 'nav.about' },
  { id: 'contact', labelKey: 'nav.contact' },
] as const;

export const STATS: Stat[] = [
  { value: '1000+', labelKey: 'hero.statFarmers', icon: Users },
  { value: '500+', labelKey: 'hero.statBuyers', icon: Store },
  { value: '100+', labelKey: 'hero.statVillages', icon: MapPin },
];

export const TRUST_FEATURES: Feature[] = [
  {
    icon: ShieldCheck,
    titleKey: 'trust.verifiedFarmers',
    descKey: 'trust.verifiedFarmersDesc',
    gradient: 'from-emerald-500 to-green-600',
    glow: 'shadow-emerald-500/30',
  },
  {
    icon: Lock,
    titleKey: 'trust.secureAuth',
    descKey: 'trust.secureAuthDesc',
    gradient: 'from-green-500 to-emerald-600',
    glow: 'shadow-green-500/30',
  },
  {
    icon: Navigation,
    titleKey: 'trust.locationBased',
    descKey: 'trust.locationBasedDesc',
    gradient: 'from-lime-500 to-green-600',
    glow: 'shadow-lime-500/30',
  },
  {
    icon: Landmark,
    titleKey: 'trust.govtSchemes',
    descKey: 'trust.govtSchemesDesc',
    gradient: 'from-amber-500 to-yellow-600',
    glow: 'shadow-amber-500/30',
  },
  {
    icon: LineChart,
    titleKey: 'trust.livePrices',
    descKey: 'trust.livePricesDesc',
    gradient: 'from-teal-500 to-cyan-600',
    glow: 'shadow-teal-500/30',
  },
];

export const FEATURES: Feature[] = [
  {
    icon: Store,
    titleKey: 'features.marketplace',
    descKey: 'features.marketplaceDesc',
    gradient: 'from-emerald-500 to-green-600',
    glow: 'shadow-emerald-500/40',
    className: 'md:col-span-2 md:row-span-2',
  },
  {
    icon: MapPin,
    titleKey: 'features.nearbyBuyers',
    descKey: 'features.nearbyBuyersDesc',
    gradient: 'from-lime-500 to-green-600',
    glow: 'shadow-lime-500/40',
  },
  {
    icon: Leaf,
    titleKey: 'features.cropInfo',
    descKey: 'features.cropInfoDesc',
    gradient: 'from-green-500 to-emerald-600',
    glow: 'shadow-green-500/40',
  },
  {
    icon: LineChart,
    titleKey: 'features.marketPrices',
    descKey: 'features.marketPricesDesc',
    gradient: 'from-teal-500 to-cyan-600',
    glow: 'shadow-teal-500/40',
  },
  {
    icon: Landmark,
    titleKey: 'features.govtSchemes',
    descKey: 'features.govtSchemesDesc',
    gradient: 'from-amber-500 to-orange-600',
    glow: 'shadow-amber-500/40',
  },
  {
    icon: ClipboardList,
    titleKey: 'features.buyerBoard',
    descKey: 'features.buyerBoardDesc',
    gradient: 'from-emerald-500 to-teal-600',
    glow: 'shadow-emerald-500/40',
  },
  {
    icon: Truck,
    titleKey: 'features.transport',
    descKey: 'features.transportDesc',
    gradient: 'from-green-600 to-lime-600',
    glow: 'shadow-green-600/40',
  },
  {
    icon: CloudSun,
    titleKey: 'features.weather',
    descKey: 'features.weatherDesc',
    gradient: 'from-sky-500 to-blue-600',
    glow: 'shadow-sky-500/40',
    className: 'md:col-span-2',
  },
];

export const STEPS: Step[] = [
  {
    number: '01',
    icon: Smartphone,
    titleKey: 'how.register',
    descKey: 'how.registerDesc',
  },
  {
    number: '02',
    icon: Store,
    titleKey: 'how.postCrop',
    descKey: 'how.postCropDesc',
  },
  {
    number: '03',
    icon: BadgeIndianRupee,
    titleKey: 'how.receiveCalls',
    descKey: 'how.receiveCallsDesc',
  },
  {
    number: '04',
    icon: PiggyBank,
    titleKey: 'how.sellDirect',
    descKey: 'how.sellDirectDesc',
  },
];

export const BENEFITS: Benefit[] = [
  {
    icon: PiggyBank,
    titleKey: 'why.higherIncome',
    descKey: 'why.higherIncomeDesc',
  },
  {
    icon: BadgeIndianRupee,
    titleKey: 'why.noCommission',
    descKey: 'why.noCommissionDesc',
  },
  {
    icon: Navigation,
    titleKey: 'why.nearbyBuyers',
    descKey: 'why.nearbyBuyersDesc',
  },
  {
    icon: LineChart,
    titleKey: 'why.transparentPricing',
    descKey: 'why.transparentPricingDesc',
  },
  {
    icon: Smartphone,
    titleKey: 'why.mobileExperience',
    descKey: 'why.mobileExperienceDesc',
  },
];

export const CROP_LISTINGS: CropListing[] = [
  {
    id: 'wheat',
    nameKey: 'market.wheat',
    image: '/crops/wheat.svg',
    price: 2450,
    unit: 'market.perQuintal',
    quantity: 25,
    quantityUnit: 'market.quintals',
    villageKey: 'market.villageGandevi',
    districtKey: 'market.districtNavsari',
    postedKey: 'market.posted2h',
    verified: true,
  },
  {
    id: 'rice',
    nameKey: 'market.rice',
    image: '/crops/rice.svg',
    price: 2950,
    unit: 'market.perQuintal',
    quantity: 40,
    quantityUnit: 'market.quintals',
    villageKey: 'market.villageVijapur',
    districtKey: 'market.districtMehsana',
    postedKey: 'market.posted4h',
    verified: true,
  },
  {
    id: 'tomato',
    nameKey: 'market.tomato',
    image: '/crops/tomato.svg',
    price: 1800,
    unit: 'market.perTon',
    quantity: 5,
    quantityUnit: 'market.tons',
    villageKey: 'market.villageVadodara',
    districtKey: 'market.districtVadodara',
    postedKey: 'market.posted1h',
    verified: true,
  },
  {
    id: 'onion',
    nameKey: 'market.onion',
    image: '/crops/onion.svg',
    price: 1600,
    unit: 'market.perQuintal',
    quantity: 60,
    quantityUnit: 'market.quintals',
    villageKey: 'market.villageNashik',
    districtKey: 'market.districtNashik',
    postedKey: 'market.posted6h',
    verified: false,
  },
  {
    id: 'potato',
    nameKey: 'market.potato',
    image: '/crops/potato.svg',
    price: 1250,
    unit: 'market.perQuintal',
    quantity: 35,
    quantityUnit: 'market.quintals',
    villageKey: 'market.villageAhmedabad',
    districtKey: 'market.districtAhmedabad',
    postedKey: 'market.posted3h',
    verified: true,
  },
  {
    id: 'mango',
    nameKey: 'market.mango',
    image: '/crops/mango.svg',
    price: 3500,
    unit: 'market.perTon',
    quantity: 12,
    quantityUnit: 'market.tons',
    villageKey: 'market.villageRatnagiri',
    districtKey: 'market.districtRatnagiri',
    postedKey: 'market.posted5h',
    verified: true,
  },
];

export const TESTIMONIALS: Testimonial[] = [
  {
    id: 't1',
    quoteKey: 'testimonials.q1',
    nameKey: 'testimonials.farmerRajesh',
    roleKey: 'testimonials.roleFarmer',
    locationKey: 'testimonials.locGujarat',
    avatarHue: 'from-emerald-500 to-green-600',
  },
  {
    id: 't2',
    quoteKey: 'testimonials.q2',
    nameKey: 'testimonials.buyerPriya',
    roleKey: 'testimonials.roleBuyer',
    locationKey: 'testimonials.locMaharashtra',
    avatarHue: 'from-lime-500 to-emerald-600',
  },
  {
    id: 't3',
    quoteKey: 'testimonials.q3',
    nameKey: 'testimonials.farmerAmit',
    roleKey: 'testimonials.roleFarmer',
    locationKey: 'testimonials.locPunjab',
    avatarHue: 'from-teal-500 to-cyan-600',
  },
  {
    id: 't4',
    quoteKey: 'testimonials.q4',
    nameKey: 'testimonials.buyerSunita',
    roleKey: 'testimonials.roleBuyer',
    locationKey: 'testimonials.locRajasthan',
    avatarHue: 'from-amber-500 to-orange-600',
  },
];

export const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'faq1',
    questionKey: 'faq.q1',
    answerKey: 'faq.q1Answer',
  },
  {
    id: 'faq2',
    questionKey: 'faq.q2',
    answerKey: 'faq.q2Answer',
  },
  {
    id: 'faq3',
    questionKey: 'faq.q3',
    answerKey: 'faq.q3Answer',
  },
  {
    id: 'faq4',
    questionKey: 'faq.q4',
    answerKey: 'faq.q4Answer',
  },
  {
    id: 'faq5',
    questionKey: 'faq.q5',
    answerKey: 'faq.q5Answer',
  },
];

