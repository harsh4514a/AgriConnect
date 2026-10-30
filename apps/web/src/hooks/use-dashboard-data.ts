'use client';

import { useCallback, useEffect, useState } from 'react';
import type { DashboardUser } from '@/types/dashboard.types';
import { getListings, getMyRecentListings, type RecentListingPreview } from '@/services/api/listings.api';
import { getBuyerRequirements, type BuyerRequirement } from '@/services/api/buyer-requirements.api';
import { getMarketPrices, type MarketPrice } from '@/services/api/market-prices.api';

export interface DashboardDataState<T> {
  data: T;
  isLoading: boolean;
  error: boolean;
  total?: number;
}

export interface DashboardData {
  myListings: DashboardDataState<RecentListingPreview[]>;
  activeListingsCount: DashboardDataState<number>;
  buyerRequirements: DashboardDataState<BuyerRequirement[]>;
  marketPrices: DashboardDataState<MarketPrice[]> & { latestAvailableDate?: string };
}

const initialState: DashboardData = {
  myListings: { data: [], isLoading: true, error: false },
  activeListingsCount: { data: 0, isLoading: true, error: false },
  buyerRequirements: { data: [], isLoading: true, error: false },
  marketPrices: { data: [], latestAvailableDate: undefined, isLoading: true, error: false },
};

export function useDashboardData(
  user: DashboardUser | null,
): DashboardData & { retry: () => void } {
  const [state, setState] = useState<DashboardData>(initialState);
  const [retryKey, setRetryKey] = useState(0);
  const hasUser = user !== null;
  const userId = user?.id;

  const retry = useCallback(() => setRetryKey((value) => value + 1), []);

  useEffect(() => {
    let cancelled = false;

    if (!hasUser) {
      setState({
        myListings: { data: [], isLoading: false, error: false },
        activeListingsCount: { data: 0, isLoading: false, error: false },
        buyerRequirements: { data: [], isLoading: false, error: false },
        marketPrices: { data: [], latestAvailableDate: undefined, isLoading: false, error: false },
      });
      return () => {
        cancelled = true;
      };
    }

    const controller = new AbortController();
    setState((current) => ({
      myListings: { ...current.myListings, isLoading: true, error: false },
      activeListingsCount: { ...current.activeListingsCount, isLoading: true, error: false },
      buyerRequirements: { ...current.buyerRequirements, isLoading: true, error: false },
      marketPrices: { ...current.marketPrices, isLoading: true, error: false },
    }));

    const load = () => {
      const finish = (update: (current: DashboardData) => DashboardData) => {
        if (!cancelled) setState(update);
      };

      void getMyRecentListings(controller.signal)
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

      void getListings({ status: 'active', page: 1, limit: 1 }, controller.signal)
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

      void getBuyerRequirements({ page: 1, limit: 3 }, controller.signal)
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

      void getMarketPrices({ page: 1, limit: 3 }, controller.signal)
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
      controller.abort();
    };
  }, [retryKey, hasUser, userId]);

  return { ...state, retry };
}
