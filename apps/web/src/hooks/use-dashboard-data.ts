'use client';

import { useCallback, useEffect, useState } from 'react';
import type { DashboardUser } from '@/types/dashboard.types';
import type { CropListing } from '@/data/marketplace-listings';
import { getMyListings, getListings, getNearbyListings } from '@/services/api/listings.api';
import { getBuyerRequirements, type BuyerRequirement } from '@/services/api/buyer-requirements.api';
import { getMarketPrices, type MarketPrice } from '@/services/api/market-prices.api';

export interface DashboardDataState<T> {
  data: T;
  isLoading: boolean;
  error: boolean;
  total?: number;
}

export interface DashboardData {
  myListings: DashboardDataState<CropListing[]>;
  activeListingsCount: DashboardDataState<number>;
  buyerRequirements: DashboardDataState<BuyerRequirement[]>;
  marketplace: DashboardDataState<CropListing[]>;
  marketPrices: DashboardDataState<MarketPrice[]> & { latestAvailableDate?: string };
}

const initialState: DashboardData = {
  myListings: { data: [], isLoading: true, error: false },
  activeListingsCount: { data: 0, isLoading: true, error: false },
  buyerRequirements: { data: [], isLoading: true, error: false },
  marketplace: { data: [], isLoading: true, error: false },
  marketPrices: { data: [], latestAvailableDate: undefined, isLoading: true, error: false },
};

export function useDashboardData(
  user: DashboardUser | null,
): DashboardData & { retry: () => void } {
  const [state, setState] = useState<DashboardData>(initialState);
  const [retryKey, setRetryKey] = useState(0);
  const hasUser = user !== null;
  const userId = user?.id;
  const latitude = user?.location?.latitude;
  const longitude = user?.location?.longitude;

  const retry = useCallback(() => setRetryKey((value) => value + 1), []);

  useEffect(() => {
    let cancelled = false;

    if (!hasUser) {
      setState({
        myListings: { data: [], isLoading: false, error: false },
        activeListingsCount: { data: 0, isLoading: false, error: false },
        buyerRequirements: { data: [], isLoading: false, error: false },
        marketplace: { data: [], isLoading: false, error: false },
        marketPrices: { data: [], latestAvailableDate: undefined, isLoading: false, error: false },
      });
      return () => {
        cancelled = true;
      };
    }

    setState((current) => ({
      myListings: { ...current.myListings, isLoading: true, error: false },
      activeListingsCount: { ...current.activeListingsCount, isLoading: true, error: false },
      buyerRequirements: { ...current.buyerRequirements, isLoading: true, error: false },
      marketplace: { ...current.marketplace, isLoading: true, error: false },
      marketPrices: { ...current.marketPrices, isLoading: true, error: false },
    }));

    const load = () => {
      const hasSavedCoordinates =
        Number.isFinite(latitude) &&
        Number.isFinite(longitude) &&
        latitude !== 0 &&
        longitude !== 0;

      const marketplaceRequest = hasSavedCoordinates
        ? getNearbyListings({ radius: 25, page: 1, limit: 3 }).catch(() =>
            getListings({ page: 1, limit: 3 }),
          )
        : getListings({ page: 1, limit: 3 });

      const finish = (update: (current: DashboardData) => DashboardData) => {
        if (!cancelled) setState(update);
      };

      void getMyListings()
        .then((data) => {
          finish((current) => ({
            ...current,
            myListings: { data, isLoading: false, error: false },
          }));
        })
        .catch(() => {
          finish((current) => ({
            ...current,
            myListings: { data: [], isLoading: false, error: true },
          }));
        });

      void getListings({ status: 'active', page: 1, limit: 1 })
        .then((result) => {
          finish((current) => ({
            ...current,
            activeListingsCount: {
              data: result.total,
              isLoading: false,
              error: false,
            },
          }));
        })
        .catch(() => {
          finish((current) => ({
            ...current,
            activeListingsCount: { data: 0, isLoading: false, error: true },
          }));
        });

      void getBuyerRequirements({ page: 1, limit: 3 })
        .then((result) => {
          finish((current) => ({
            ...current,
            buyerRequirements: {
              data: result.items,
              total: result.total,
              isLoading: false,
              error: false,
            },
          }));
        })
        .catch(() => {
          finish((current) => ({
            ...current,
            buyerRequirements: { data: [], isLoading: false, error: true },
          }));
        });

      void marketplaceRequest
        .then((result) => {
          finish((current) => ({
            ...current,
            marketplace: {
              data: result.listings,
              isLoading: false,
              error: false,
            },
          }));
        })
        .catch(() => {
          finish((current) => ({
            ...current,
            marketplace: { data: [], isLoading: false, error: true },
          }));
        });

      void getMarketPrices({ page: 1, limit: 3 })
        .then((result) => {
          finish((current) => ({
            ...current,
            marketPrices: {
              data: result.items,
              latestAvailableDate: result.latestAvailableDate,
              isLoading: false,
              error: false,
            },
          }));
        })
        .catch(() => {
          finish((current) => ({
            ...current,
            marketPrices: {
              data: [],
              latestAvailableDate: undefined,
              isLoading: false,
              error: true,
            },
          }));
        });
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [retryKey, hasUser, userId, latitude, longitude]);

  return { ...state, retry };
}
