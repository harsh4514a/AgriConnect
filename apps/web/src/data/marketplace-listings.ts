/**
 * Legacy marketplace demo data and shared marketplace types.
 *
 * Production marketplace screens load listing records from the API. Keep the
 * legacy fixture below out of production UI; it remains only for the unused
 * local demo store while that code is reviewed separately.
 *
 * i18n: crop, district and unit labels are translated via keys under
 * `dashboard.marketplaceBrowse.crop`, `.district` and `.unit`.
 */

export type CropKey =
  | 'cotton'
  | 'groundnut'
  | 'wheat'
  | 'rice'
  | 'tomato'
  | 'onion'
  | 'potato'
  | 'chili'
  | 'maize'
  | 'bajra'
  | 'other';

export type UnitKey = 'quintal' | 'ton' | 'kg';

export type ListingStatus = 'active' | 'sold' | 'inactive';

export interface CropListing {
  id: string;
  /** i18n key suffix under `dashboard.marketplaceBrowse.crop`. */
  cropKey: CropKey;
  /** Path to the crop SVG asset. */
  image: string;
  /** Plain-text alt describing the image (not i18n — used for a11y). */
  imageAlt: string;
  farmerName: string;
  farmerNameShort: string;
  /** District name — used both for display and as the i18n dictionary key. */
  district: string;
  village: string;
  /** Taluka (sub-district) — shown in the location line as "Village, Taluka, District". */
  taluka: string;
  quantity: number;
  unit: UnitKey;
  /** Price in Indian Rupees (whole number) — the per-bag/20kg price. */
  price: number;
  /** Price per bag (default 20 kg) label. */
  primaryUnit: string;
  /** Price per 100 kg (quintal) label. */
  secondaryUnit: string;
  /** Market price in ₹ per quintal used for the comparison row. */
  marketPrice: number;
  /** Distance in km used for the "Nearest" sort and display. */
  distanceKm: number;
  /** Posted hours ago (used for relative "posted X ago" label). */
  postedHoursAgo: number;
  availability: 'available' | 'soldOut';
  verified: boolean;
  /** Mobile number used for the tel: "Call Farmer" link. */
  mobileNumber: string;
  /** Short display label for the mobile number (privacy-friendly). */
  phoneLabel: string;
  /** Ready-to-sell badge (e.g. "Ready to Sell"). */
  readyToSell: boolean;
  /** Approx. coordinates for distance calculations (Nearest sort). */
  lat: number;
  lng: number;

  /* ─── Part 2 & 3: Listing Details & Management fields ─── */

  /** Detailed description for "About This Produce" section. */
  description?: string;
  /** Crop variety, e.g. "Shankar-6" for cotton. */
  variety?: string;
  /** Manual crop name when `cropKey` is `other`. */
  customCropName?: string;
  /** Quality classification, e.g. "A Grade", "Premium". */
  qualityGrade?: string;
  /** ISO date string of the crop listing, e.g. "2026-08-10". */
  cropDate?: string;
  /** State (e.g. "Gujarat"). */
  state?: string;
  /** Year the farmer joined the platform. */
  farmerMemberSince?: number;
  /** Number of active listings by this farmer. */
  farmerListingCount?: number;
  /** Additional crop images for the gallery. */
  additionalImages?: string[];
  /** Listing management status (active | sold | inactive) */
  status?: ListingStatus;
  /** Flag for listings created by the current logged-in farmer */
  // isUserCreated?: boolean;
  /** Flag for listings created by the current logged-in farmer */
  isUserCreated?: boolean;

  /** Database creation timestamp used for accurate "Posted X ago". */
  createdAt?: string | Date;

  /** Database update timestamp. */
  updatedAt?: string | Date;
}

/** Supported crops are product taxonomy, not records from the demo fixture. */
export const CROPS: CropKey[] = [
  'bajra',
  'chili',
  'cotton',
  'groundnut',
  'maize',
  'onion',
  'other',
  'potato',
  'rice',
  'tomato',
  'wheat',
];

/** Crop illustrations used by listing creation when the user skips a photo. */
export const CROP_IMAGES: Record<CropKey, string> = {
  cotton: '/crops/cotton.svg',
  groundnut: '/crops/groundnut.svg',
  wheat: '/crops/wheat.svg',
  rice: '/crops/rice.svg',
  tomato: '/crops/tomato.svg',
  onion: '/crops/onion.svg',
  potato: '/crops/potato.svg',
  chili: '/crops/chili.svg',
  maize: '/crops/maize.svg',
  bajra: '/crops/bajra.svg',
  other: '/crops/other.svg',
};

/** Legacy seeded examples retained only for the unused local demo store. */
export const MARKETPLACE_LISTINGS: CropListing[] = [
  {
    id: 'mp-001',
    cropKey: 'cotton',
    image: CROP_IMAGES.cotton,
    imageAlt: 'Cotton',
    farmerName: 'Rameshbhai Patel',
    farmerNameShort: 'Rameshbhai',
    district: 'Rajkot',
    village: 'Jasdan',
    taluka: 'Jasdan',
    quantity: 120,
    unit: 'quintal',
    price: 1500,
    primaryUnit: '20 kg',
    secondaryUnit: 'quintal',
    marketPrice: 1600,
    distanceKm: 8,
    postedHoursAgo: 2,
    availability: 'available',
    verified: true,
    mobileNumber: '+919876500001',
    phoneLabel: 'Rameshbhai',
    readyToSell: true,
    lat: 22.03,
    lng: 71.2,
    description:
      'Premium quality raw cotton picked at optimal maturity. Clean, well-ginned fibre with excellent staple length suitable for spinning mills. Stored in a dry warehouse with no moisture damage.',
    variety: 'Shankar-6',
    qualityGrade: 'A Grade',
    cropDate: '2026-08-05',
    state: 'Gujarat',
    farmerMemberSince: 2024,
    farmerListingCount: 4,
  },
  {
    id: 'mp-002',
    cropKey: 'groundnut',
    image: CROP_IMAGES.groundnut,
    imageAlt: 'Groundnut',
    farmerName: 'Jignesh Solanki',
    farmerNameShort: 'Jignesh',
    district: 'Junagadh',
    village: 'Mangrol',
    taluka: 'Mangrol',
    quantity: 60,
    unit: 'quintal',
    price: 1360,
    primaryUnit: '20 kg',
    secondaryUnit: 'quintal',
    marketPrice: 1400,
    distanceKm: 14,
    postedHoursAgo: 5,
    availability: 'available',
    verified: true,
    mobileNumber: '+919876500002',
    phoneLabel: 'Jignesh',
    readyToSell: true,
    lat: 21.12,
    lng: 70.11,
    description:
      'Naturally dried GG-20 groundnut pods with high oil content and excellent pod filling. Harvested under dry soil conditions, uniform kernel size with minimal moisture.',
    variety: 'GG-20 (Gujarat Groundnut)',
    qualityGrade: 'Grade 1 (Bold)',
    cropDate: '2026-08-01',
    state: 'Gujarat',
    farmerMemberSince: 2023,
    farmerListingCount: 2,
  },
  {
    id: 'mp-003',
    cropKey: 'wheat',
    image: CROP_IMAGES.wheat,
    imageAlt: 'Wheat',
    farmerName: 'Bharatbhai Makwana',
    farmerNameShort: 'Bharatbhai',
    district: 'Mehsana',
    village: 'Vijapur',
    taluka: 'Vijapur',
    quantity: 85,
    unit: 'quintal',
    price: 450,
    primaryUnit: '20 kg',
    secondaryUnit: 'quintal',
    marketPrice: 2300,
    distanceKm: 22,
    postedHoursAgo: 1,
    availability: 'available',
    verified: true,
    mobileNumber: '+919876500003',
    phoneLabel: 'Bharatbhai',
    readyToSell: true,
    lat: 23.64,
    lng: 72.75,
    description:
      'Premium Sharbati wheat grains, golden lustrous color and high protein content. Machine cleaned and graded with zero foreign matter, stored in moisture-proof bags.',
    variety: 'Sharbati Tukdi',
    qualityGrade: 'Premium A+',
    cropDate: '2026-07-28',
    state: 'Gujarat',
    farmerMemberSince: 2022,
    farmerListingCount: 5,
  },
  {
    id: 'mp-004',
    cropKey: 'rice',
    image: CROP_IMAGES.rice,
    imageAlt: 'Rice',
    farmerName: 'Pravinbhai Chaudhary',
    farmerNameShort: 'Pravinbhai',
    district: 'Anand',
    village: 'Borsad',
    taluka: 'Borsad',
    quantity: 40,
    unit: 'quintal',
    price: 620,
    primaryUnit: '20 kg',
    secondaryUnit: 'quintal',
    marketPrice: 3100,
    distanceKm: 6,
    postedHoursAgo: 3,
    availability: 'available',
    verified: false,
    mobileNumber: '+919876500004',
    phoneLabel: 'Pravinbhai',
    readyToSell: true,
    lat: 22.41,
    lng: 72.9,
    description:
      'Gurjari paddy harvested recently from well-irrigated canal-fed fields. Uniform long grain with minimal broken grains, ideal for commercial milling.',
    variety: 'Gurjari (GR-11)',
    qualityGrade: 'Grade A',
    cropDate: '2026-08-08',
    state: 'Gujarat',
    farmerMemberSince: 2024,
    farmerListingCount: 1,
  },
  {
    id: 'mp-005',
    cropKey: 'tomato',
    image: CROP_IMAGES.tomato,
    imageAlt: 'Tomato',
    farmerName: 'Kiranben Patel',
    farmerNameShort: 'Kiranben',
    district: 'Bhavnagar',
    village: 'Talaja',
    taluka: 'Talaja',
    quantity: 25,
    unit: 'quintal',
    price: 370,
    primaryUnit: '20 kg',
    secondaryUnit: 'quintal',
    marketPrice: 1900,
    distanceKm: 11,
    postedHoursAgo: 4,
    availability: 'available',
    verified: true,
    mobileNumber: '+919876500005',
    phoneLabel: 'Kiranben',
    readyToSell: true,
    lat: 21.35,
    lng: 72.04,
    description:
      'Farm fresh Abhinav hybrid tomatoes, firm skin with deep red color. Sorted and crated on harvest morning, ideal for retail markets and long-distance transport.',
    variety: 'Abhinav Hybrid',
    qualityGrade: 'Grade 1 (Table)',
    cropDate: '2026-08-12',
    state: 'Gujarat',
    farmerMemberSince: 2023,
    farmerListingCount: 3,
  },
  {
    id: 'mp-006',
    cropKey: 'onion',
    image: CROP_IMAGES.onion,
    imageAlt: 'Onion',
    farmerName: 'Sureshbhai Gohil',
    farmerNameShort: 'Sureshbhai',
    district: 'Amreli',
    village: 'Savarkundla',
    taluka: 'Savarkundla',
    quantity: 150,
    unit: 'quintal',
    price: 280,
    primaryUnit: '20 kg',
    secondaryUnit: 'quintal',
    marketPrice: 1400,
    distanceKm: 18,
    postedHoursAgo: 6,
    availability: 'available',
    verified: true,
    mobileNumber: '+919876500006',
    phoneLabel: 'Sureshbhai',
    readyToSell: true,
    lat: 21.34,
    lng: 71.3,
    description:
      'Well-cured red onion with tight outer skins and medium-large bulb size (50-60mm). Low moisture content suitable for storage and bulk transport.',
    variety: 'Gujarat Red (N-53)',
    qualityGrade: 'Medium-Large (55mm+)',
    cropDate: '2026-07-20',
    state: 'Gujarat',
    farmerMemberSince: 2021,
    farmerListingCount: 6,
  },
  {
    id: 'mp-007',
    cropKey: 'potato',
    image: CROP_IMAGES.potato,
    imageAlt: 'Potato',
    farmerName: 'Narendrabhai Rathod',
    farmerNameShort: 'Narendrabhai',
    district: 'Surendranagar',
    village: 'Limbdi',
    taluka: 'Limbdi',
    quantity: 70,
    unit: 'quintal',
    price: 520,
    primaryUnit: '20 kg',
    secondaryUnit: 'quintal',
    marketPrice: 2600,
    distanceKm: 25,
    postedHoursAgo: 8,
    availability: 'available',
    verified: false,
    mobileNumber: '+919876500007',
    phoneLabel: 'Narendrabhai',
    readyToSell: true,
    lat: 22.56,
    lng: 71.8,
    description:
      'Kufri Pukhraj table potatoes, smooth skin with uniform oval shape and shallow eyes. Stored in temperature-controlled cold storage, ready for wholesale dispatch.',
    variety: 'Kufri Pukhraj',
    qualityGrade: 'Grade A (Table)',
    cropDate: '2026-07-15',
    state: 'Gujarat',
    farmerMemberSince: 2024,
    farmerListingCount: 2,
  },
  {
    id: 'mp-008',
    cropKey: 'chili',
    image: CROP_IMAGES.chili,
    imageAlt: 'Green chili',
    farmerName: 'Mukeshbhai Vora',
    farmerNameShort: 'Mukeshbhai',
    district: 'Morbi',
    village: 'Wankaner',
    taluka: 'Wankaner',
    quantity: 12,
    unit: 'quintal',
    price: 840,
    primaryUnit: '20 kg',
    secondaryUnit: 'quintal',
    marketPrice: 4200,
    distanceKm: 20,
    postedHoursAgo: 2,
    availability: 'available',
    verified: true,
    mobileNumber: '+919876500008',
    phoneLabel: 'Mukeshbhai',
    readyToSell: false,
    lat: 22.61,
    lng: 70.94,
    description:
      'Freshly plucked G-4 green chilies with high pungency and dark green glossy skin. Packed in ventilated crates directly from the farm.',
    variety: 'G-4 (Bhagyalakshmi)',
    qualityGrade: 'Export Grade',
    cropDate: '2026-08-11',
    state: 'Gujarat',
    farmerMemberSince: 2023,
    farmerListingCount: 1,
  },
  {
    id: 'mp-009',
    cropKey: 'maize',
    image: CROP_IMAGES.maize,
    imageAlt: 'Maize',
    farmerName: 'Vijaybhai Pansuriya',
    farmerNameShort: 'Vijaybhai',
    district: 'Rajkot',
    village: 'Dhoraji',
    taluka: 'Dhoraji',
    quantity: 95,
    unit: 'quintal',
    price: 380,
    primaryUnit: '20 kg',
    secondaryUnit: 'quintal',
    marketPrice: 1900,
    distanceKm: 16,
    postedHoursAgo: 7,
    availability: 'available',
    verified: true,
    mobileNumber: '+919876500009',
    phoneLabel: 'Vijaybhai',
    readyToSell: true,
    lat: 21.73,
    lng: 70.45,
    description:
      'Yellow grain maize suitable for feed and starch industry. Well dried with moisture below 12%, free from fungal infection and weevils.',
    variety: 'Ganga-11 Hybrid',
    qualityGrade: 'Grade A Yellow',
    cropDate: '2026-07-30',
    state: 'Gujarat',
    farmerMemberSince: 2022,
    farmerListingCount: 3,
  },
  {
    id: 'mp-010',
    cropKey: 'bajra',
    image: CROP_IMAGES.bajra,
    imageAlt: 'Bajra (Pearl Millet)',
    farmerName: 'Hiteshbhai Mer',
    farmerNameShort: 'Hiteshbhai',
    district: 'Anand',
    village: 'Khambhat',
    taluka: 'Khambhat',
    quantity: 110,
    unit: 'quintal',
    price: 350,
    primaryUnit: '20 kg',
    secondaryUnit: 'quintal',
    marketPrice: 1750,
    distanceKm: 9,
    postedHoursAgo: 10,
    availability: 'available',
    verified: false,
    mobileNumber: '+919876500010',
    phoneLabel: 'Hiteshbhai',
    readyToSell: true,
    lat: 22.31,
    lng: 72.62,
    description:
      'Bold grain pearl millet (Bajra) harvested from coastal fertile soil. Cleaned and sieved, rich in iron and dietary fibre, ideal for flour mills.',
    variety: 'GHB-558',
    qualityGrade: 'Bold Grain Grade 1',
    cropDate: '2026-08-02',
    state: 'Gujarat',
    farmerMemberSince: 2024,
    farmerListingCount: 2,
  },
  {
    id: 'mp-011',
    cropKey: 'cotton',
    image: CROP_IMAGES.cotton,
    imageAlt: 'Cotton',
    farmerName: 'Dineshbhai Dabhi',
    farmerNameShort: 'Dineshbhai',
    district: 'Surendranagar',
    village: 'Chotila',
    taluka: 'Chotila',
    quantity: 200,
    unit: 'quintal',
    price: 1460,
    primaryUnit: '20 kg',
    secondaryUnit: 'quintal',
    marketPrice: 7300,
    distanceKm: 30,
    postedHoursAgo: 12,
    availability: 'available',
    verified: true,
    mobileNumber: '+919876500011',
    phoneLabel: 'Dineshbhai',
    readyToSell: true,
    lat: 22.42,
    lng: 71.2,
    description:
      'Second pick Shankar-6 raw cotton with bright white luster and low trash content. Stored carefully in covered shed, ready for immediate ginning delivery.',
    variety: 'Shankar-6',
    qualityGrade: 'A Grade',
    cropDate: '2026-08-04',
    state: 'Gujarat',
    farmerMemberSince: 2020,
    farmerListingCount: 8,
  },
  {
    id: 'mp-012',
    cropKey: 'groundnut',
    image: CROP_IMAGES.groundnut,
    imageAlt: 'Groundnut',
    farmerName: 'Ashokbhai Khachar',
    farmerNameShort: 'Ashokbhai',
    district: 'Amreli',
    village: 'Babra',
    taluka: 'Lilia',
    quantity: 55,
    unit: 'quintal',
    price: 1380,
    primaryUnit: '20 kg',
    secondaryUnit: 'quintal',
    marketPrice: 1400,
    distanceKm: 24,
    postedHoursAgo: 15,
    availability: 'available',
    verified: true,
    mobileNumber: '+919876500012',
    phoneLabel: 'Ashokbhai',
    readyToSell: true,
    lat: 21.84,
    lng: 71.3,
    description:
      'J-24 variety groundnut pods, known for excellent sweetness and high edible oil percentage. Cleaned from soil residues and sun-cured.',
    variety: 'J-24 (Semi-Spreading)',
    qualityGrade: 'Premium Oil Grade',
    cropDate: '2026-07-29',
    state: 'Gujarat',
    farmerMemberSince: 2022,
    farmerListingCount: 4,
  },
  {
    id: 'mp-013',
    cropKey: 'wheat',
    image: CROP_IMAGES.wheat,
    imageAlt: 'Wheat',
    farmerName: 'Kantibhai Raval',
    farmerNameShort: 'Kantibhai',
    district: 'Mehsana',
    village: 'Kadi',
    taluka: 'Kadi',
    quantity: 130,
    unit: 'quintal',
    price: 460,
    primaryUnit: '20 kg',
    secondaryUnit: 'quintal',
    marketPrice: 2300,
    distanceKm: 28,
    postedHoursAgo: 18,
    availability: 'available',
    verified: true,
    mobileNumber: '+919876500013',
    phoneLabel: 'Kantibhai',
    readyToSell: true,
    lat: 23.3,
    lng: 72.34,
    description:
      'GW-496 certified variety wheat grains. Highly popular for soft rotis, superior milling yield, and long storage stability.',
    variety: 'GW-496',
    qualityGrade: 'Grade A Premium',
    cropDate: '2026-07-25',
    state: 'Gujarat',
    farmerMemberSince: 2021,
    farmerListingCount: 5,
  },
  {
    id: 'mp-014',
    cropKey: 'rice',
    image: CROP_IMAGES.rice,
    imageAlt: 'Rice',
    farmerName: 'Kamleshbhai Patel',
    farmerNameShort: 'Kamleshbhai',
    district: 'Bharuch',
    village: 'Jhagadia',
    taluka: 'Jhagadia',
    quantity: 48,
    unit: 'quintal',
    price: 650,
    primaryUnit: '20 kg',
    secondaryUnit: 'quintal',
    marketPrice: 3250,
    distanceKm: 35,
    postedHoursAgo: 20,
    availability: 'available',
    verified: false,
    mobileNumber: '+919876500014',
    phoneLabel: 'Kamleshbhai',
    readyToSell: true,
    lat: 21.73,
    lng: 73.14,
    description:
      'Narmada basin fragrant long-grain paddy, grown with organic bio-fertilizers. Cleaned and moisture-tested for milling.',
    variety: 'Mahi Sugandha',
    qualityGrade: 'Aromatic Grade 1',
    cropDate: '2026-08-01',
    state: 'Gujarat',
    farmerMemberSince: 2023,
    farmerListingCount: 2,
  },
  {
    id: 'mp-015',
    cropKey: 'tomato',
    image: CROP_IMAGES.tomato,
    imageAlt: 'Tomato',
    farmerName: 'Rekhaben Dave',
    farmerNameShort: 'Rekhaben',
    district: 'Bhavnagar',
    village: 'Palitana',
    taluka: 'Palitana',
    quantity: 30,
    unit: 'quintal',
    price: 390,
    primaryUnit: '20 kg',
    secondaryUnit: 'quintal',
    marketPrice: 1950,
    distanceKm: 13,
    postedHoursAgo: 24,
    availability: 'available',
    verified: true,
    mobileNumber: '+919876500015',
    phoneLabel: 'Rekhaben',
    readyToSell: true,
    lat: 21.53,
    lng: 71.82,
    description:
      'Himsona variety tomatoes with thick walls and high pulp ratio, perfect for culinary use and pulp processing. Graded uniformly.',
    variety: 'Himsona Hybrid',
    qualityGrade: 'Grade A Firm',
    cropDate: '2026-08-10',
    state: 'Gujarat',
    farmerMemberSince: 2022,
    farmerListingCount: 3,
  },
  {
    id: 'mp-016',
    cropKey: 'onion',
    image: CROP_IMAGES.onion,
    imageAlt: 'Onion',
    farmerName: 'Manishbhai Bariya',
    farmerNameShort: 'Manishbhai',
    district: 'Junagadh',
    village: 'Keshod',
    taluka: 'Keshod',
    quantity: 180,
    unit: 'quintal',
    price: 276,
    primaryUnit: '20 kg',
    secondaryUnit: 'quintal',
    marketPrice: 1380,
    distanceKm: 19,
    postedHoursAgo: 26,
    availability: 'available',
    verified: true,
    mobileNumber: '+919876500016',
    phoneLabel: 'Manishbhai',
    readyToSell: false,
    lat: 21.3,
    lng: 70.25,
    description:
      'Late Kharif red onions, sun dried and graded. Uniform bulb diameter of 45-55 mm, firm necks, ideal for market wholesale.',
    variety: 'Bhima Super',
    qualityGrade: 'Medium (50mm)',
    cropDate: '2026-07-22',
    state: 'Gujarat',
    farmerMemberSince: 2024,
    farmerListingCount: 1,
  },
];

/** Predefined crops shown in Create Listing (excludes the "Other Crop" option). */
export const PREDEFINED_CROPS = CROPS.filter((crop) => crop !== 'other');

/** Price-range buckets (in ₹) used by the filter. */
export const PRICE_RANGES = [
  { key: 'under10k', min: 0, max: 10000 },
  { key: '10to20k', min: 10000, max: 20000 },
  { key: '20to40k', min: 20000, max: 40000 },
  { key: 'above40k', min: 40000, max: Number.POSITIVE_INFINITY },
] as const;

/** Quantity buckets (in quintals) used by the filter. */
export const QUANTITY_RANGES = [
  { key: 'small', min: 0, max: 20 },
  { key: 'medium', min: 20, max: 50 },
  { key: 'large', min: 50, max: Number.POSITIVE_INFINITY },
] as const;

export type SortKey = 'newest' | 'lowestPrice' | 'highestPrice' | 'nearest' | 'mostQty';

export const SORT_OPTIONS: { key: SortKey }[] = [
  { key: 'newest' },
  { key: 'lowestPrice' },
  { key: 'highestPrice' },
  { key: 'nearest' },
  { key: 'mostQty' },
];

/** Look up a listing retained by the legacy local demo store, if any. */
export function getListingById(id: string): CropListing | undefined {
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('agriconnect_marketplace_listings_v2');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const match = parsed.find((item: CropListing) => item.id === id);
          if (match) return match;
        }
      }
    } catch {
      // Ignore stale or invalid demo-store data.
    }
  }
  return undefined;
}
