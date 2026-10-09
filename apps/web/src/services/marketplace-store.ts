'use client';

import { create } from 'zustand';
import {
  MARKETPLACE_LISTINGS,
  CROP_IMAGES,
  type CropListing,
  type ListingStatus,
  type CropKey,
  type UnitKey,
} from '@/data/marketplace-listings';

const STORAGE_KEY = 'agriconnect_marketplace_listings_v2';

/** Initial seed user listing IDs for immediate testing on My Listings page. */
const SEED_USER_LISTING_IDS = ['mp-001', 'mp-003'];

function getInitialListings(): CropListing[] {
  if (typeof window === 'undefined') {
    return MARKETPLACE_LISTINGS.map((l) => ({
      ...l,
      status: (l.status || (l.availability === 'soldOut' ? 'sold' : 'active')) as ListingStatus,
      isUserCreated: SEED_USER_LISTING_IDS.includes(l.id),
    }));
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // ignore parsing errors
  }

  const seeded = MARKETPLACE_LISTINGS.map((l) => ({
    ...l,
    status: (l.status || (l.availability === 'soldOut' ? 'sold' : 'active')) as ListingStatus,
    isUserCreated: SEED_USER_LISTING_IDS.includes(l.id),
  }));

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
  } catch {
    // ignore
  }

  return seeded;
}

export interface CreateListingInput {
  cropKey: CropKey;
  image?: string;
  imageAlt?: string;
  variety?: string;
  customCropName?: string;
  qualityGrade?: string;
  quantity: number;
  unit: UnitKey;
  price: number;
  primaryUnit?: string;
  village: string;
  district: string;
  taluka?: string;
  state?: string;
  cropDate?: string;
  description?: string;
  additionalImages?: string[];
  farmerName?: string;
  farmerNameShort?: string;
  mobileNumber?: string;
}

interface MarketplaceStore {
  listings: CropListing[];
  isHydrated: boolean;
  init: () => void;
  createListing: (input: CreateListingInput) => CropListing;
  updateListing: (id: string, input: Partial<CropListing>) => boolean;
  updateListingStatus: (id: string, status: ListingStatus) => boolean;
  deleteListing: (id: string) => boolean;
  getListing: (id: string) => CropListing | undefined;
  getUserListings: () => CropListing[];
}

export const useMarketplaceStore = create<MarketplaceStore>((set, get) => ({
  listings: getInitialListings(),
  isHydrated: false,

  init: () => {
    if (typeof window === 'undefined') return;
    const initial = getInitialListings();
    set({ listings: initial, isHydrated: true });
  },

  createListing: (input: CreateListingInput) => {
    const id = `mp-user-${Date.now()}`;
    const image = input.image || CROP_IMAGES[input.cropKey] || '/crops/wheat.svg';
    const trimmedCustomName = input.customCropName?.trim();
    const imageAlt =
      input.imageAlt ||
      (input.cropKey === 'other' && trimmedCustomName ? trimmedCustomName : input.cropKey);
    const farmerName = input.farmerName || 'Rameshbhai Patel';
    const farmerNameShort = input.farmerNameShort || 'Rameshbhai';
    const mobileNumber = input.mobileNumber || '+919876500001';
    const primaryUnit = input.primaryUnit || (input.unit === 'kg' ? 'kg' : '20 kg');
    const secondaryUnit = 'quintal';
    const marketPrice = Math.round(input.price * 1.1);

    const newListing: CropListing = {
      id,
      cropKey: input.cropKey,
      image,
      imageAlt,
      farmerName,
      farmerNameShort,
      district: input.district,
      village: input.village,
      taluka: input.taluka || input.village,
      quantity: Number(input.quantity),
      unit: input.unit,
      price: Number(input.price),
      primaryUnit,
      secondaryUnit,
      marketPrice,
      distanceKm: 8,
      postedHoursAgo: 0,
      availability: 'available',
      verified: true,
      mobileNumber,
      phoneLabel: farmerNameShort,
      readyToSell: true,
      lat: 22.03,
      lng: 71.2,
      variety: input.variety || undefined,
      customCropName: trimmedCustomName,
      qualityGrade: input.qualityGrade || 'A Grade',
      cropDate: input.cropDate || new Date().toISOString().split('T')[0],
      state: input.state || 'Gujarat',
      farmerMemberSince: 2024,
      farmerListingCount: 1,
      description: input.description || '',
      additionalImages: input.additionalImages || [],
      status: 'active',
      isUserCreated: true,
    };

    set((state) => {
      const updated = [newListing, ...state.listings];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return { listings: updated };
    });

    return newListing;
  },

  updateListing: (id: string, input: Partial<CropListing>) => {
    let success = false;
    set((state) => {
      const updated = state.listings.map((item) => {
        if (item.id === id) {
          success = true;
          return {
            ...item,
            ...input,
            // Sync availability with status if status is changed
            availability:
              input.status === 'sold'
                ? 'soldOut'
                : input.status === 'active'
                  ? 'available'
                  : item.availability,
          };
        }
        return item;
      });

      if (success) {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch {
          // ignore
        }
      }

      return { listings: updated };
    });
    return success;
  },

  updateListingStatus: (id: string, status: ListingStatus) => {
    let success = false;
    set((state) => {
      const updated = state.listings.map((item) => {
        if (item.id === id) {
          success = true;
          return {
            ...item,
            status,
            availability: status === 'sold' ? ('soldOut' as const) : ('available' as const),
          };
        }
        return item;
      });

      if (success) {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch {
          // ignore
        }
      }

      return { listings: updated };
    });
    return success;
  },

  deleteListing: (id: string) => {
    let success = false;
    set((state) => {
      const updated = state.listings.filter((item) => {
        if (item.id === id) {
          success = true;
          return false;
        }
        return true;
      });

      if (success) {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch {
          // ignore
        }
      }

      return { listings: updated };
    });
    return success;
  },

  getListing: (id: string) => {
    return get().listings.find((item) => item.id === id);
  },

  getUserListings: () => {
    return get().listings.filter((item) => Boolean(item.isUserCreated));
  },
}));
