'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Database,
  Filter,
  MapPin,
  RefreshCw,
  Search,
  Sprout,
  Store,
} from 'lucide-react';
import { useParams, useSearchParams } from 'next/navigation';
import { useTranslations, type TranslationValues } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  getLocalizedCropName,
  getLocalizedDistrictName,
  getLocalizedGrade,
  getLocalizedMarketName,
  getLocalizedRegionName,
  getLocalizedVariety,
} from './market-prices-i18n';
import {
  getCropMarketComparison,
  getMarketPriceCrops,
  getMarketPriceFilters,
  getMarketPriceRegions,
  getMarketPrices,
  getMarketYardPrices,
  getMarketYardsByRegion,
  type MarketPrice,
  type MarketPriceCrop,
  type MarketPriceCropMarketComparison,
  type MarketPriceFiltersResponse,
  type MarketPriceMarket,
  type MarketPriceMarketCrop,
  type MarketPriceRegion,
} from '@/services/api/market-prices.api';

type View =
  | 'home'
  | 'regions'
  | 'regionMarkets'
  | 'marketPrices'
  | 'crops'
  | 'cropMarkets'
  | 'advanced';

const EMPTY_FILTERS: MarketPriceFiltersResponse = {
  districts: [],
  markets: [],
  marketYardCount: 0,
  commodities: [],
  varieties: [],
};

function getLocale(locale: string) {
  return locale === 'gu' ? 'gu-IN' : locale === 'hi' ? 'hi-IN' : 'en-IN';
}

function formatDate(value: string | undefined, locale: string) {
  if (!value) return '—';
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(getLocale(locale), {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function formatPricePer20Kg(value: number | null | undefined, locale: string) {
  if (value == null || !Number.isFinite(Number(value))) return '—';
  return new Intl.NumberFormat(getLocale(locale), {
    maximumFractionDigits: 2,
  }).format(Number(value) / 5);
}

function getPriceUnitText(locale: string) {
  if (locale === 'gu') return '20 કિલો દીઠ ભાવ';
  if (locale === 'hi') return '20 किलोग्राम प्रति भाव';
  return 'Price per 20 kg';
}

function getPriceUnitLabel() {
  return '₹/20 kg';
}

function LoadingRows() {
  return (
    <div className="space-y-2 rounded-2xl border border-gray-200 bg-white p-4">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="h-12 animate-pulse rounded-xl bg-gray-100" />
      ))}
    </div>
  );
}

function LoadingCards() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="h-28 animate-pulse rounded-2xl bg-gray-100" />
      ))}
    </div>
  );
}

function ErrorState({
  t,
  onRetry,
}: {
  t: (key: string, values?: TranslationValues) => string;
  onRetry: () => void;
}) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
      <AlertCircle className="mx-auto h-8 w-8 text-red-600" />
      <h2 className="mt-3 font-semibold text-red-900">{t('errorTitle')}</h2>
      <p className="mt-1 text-sm text-red-700">{t('errorDescription')}</p>
      <Button className="mt-4" variant="secondary" onClick={onRetry}>
        <RefreshCw className="mr-2 h-4 w-4" />
        {t('retry')}
      </Button>
    </div>
  );
}

function EmptyState({
  t,
  title,
  description,
}: {
  t: (key: string, values?: TranslationValues) => string;
  title?: string;
  description?: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
      <h2 className="font-semibold text-gray-900">{title ?? t('emptyTitle')}</h2>
      <p className="mt-1 text-sm text-gray-500">
        {description ?? t('emptyDescription')}
      </p>
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  onChange,
  t,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  t: (key: string, values?: TranslationValues) => string;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-3">
      <p className="text-sm text-gray-500">
        {t('pageOf', { page, totalPages })}
      </p>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
          aria-label={t('previous')}
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          {t('previous')}
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
          aria-label={t('next')}
        >
          {t('next')}
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function MarketPricesPage() {
  const t = useTranslations('marketPrices');
  const params = useParams();
  const searchParams = useSearchParams();
  const marketPricesQuery = searchParams.toString();
  const locale = (params?.locale as string) || 'en';

  const [view, setView] = useState<View>('home');
  const [regions, setRegions] = useState<MarketPriceRegion[]>([]);
  const [markets, setMarkets] = useState<MarketPriceMarket[]>([]);
  const [marketCrops, setMarketCrops] = useState<MarketPriceMarketCrop[]>([]);
  const [crops, setCrops] = useState<MarketPriceCrop[]>([]);
  const [cropMarkets, setCropMarkets] = useState<MarketPriceCropMarketComparison[]>([]);
  const [filters, setFilters] = useState<MarketPriceFiltersResponse>(EMPTY_FILTERS);
  const [advancedItems, setAdvancedItems] = useState<MarketPrice[]>([]);
  const [latestAvailableDate, setLatestAvailableDate] = useState<string>();

  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedMarket, setSelectedMarket] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedCrop, setSelectedCrop] = useState('');

  const [marketSearch, setMarketSearch] = useState('');
  const [cropSearch, setCropSearch] = useState('');
  const [detailSearch, setDetailSearch] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedVariety, setSelectedVariety] = useState('');

  const [advancedSearch, setAdvancedSearch] = useState('');
  const [advancedDistrict, setAdvancedDistrict] = useState('');
  const [advancedMarket, setAdvancedMarket] = useState('');
  const [advancedCommodity, setAdvancedCommodity] = useState('');
  const [advancedVariety, setAdvancedVariety] = useState('');
  const [advancedDate, setAdvancedDate] = useState('');

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [restored, setRestored] = useState(false);

  const writeUrl = useCallback((next: Record<string, string | undefined>) => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    const keys = ['view', 'region', 'market', 'district', 'crop', 'date', 'variety', 'search', 'page'];
    keys.forEach((key) => url.searchParams.delete(key));
    Object.entries(next).forEach(([key, value]) => {
      if (value) url.searchParams.set(key, value);
    });
    window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
  }, []);

  const loadHome = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [regionData, filterData] = await Promise.all([
        getMarketPriceRegions(),
        getMarketPriceFilters(),
      ]);
      const safeFilters: MarketPriceFiltersResponse = {
        districts: Array.isArray(filterData?.districts) ? filterData.districts : [],
        markets: Array.isArray(filterData?.markets) ? filterData.markets : [],
        marketYardCount: filterData?.marketYardCount ?? 0,
        commodities: Array.isArray(filterData?.commodities) ? filterData.commodities : [],
        varieties: Array.isArray(filterData?.varieties) ? filterData.varieties : [],
        latestAvailableDate: filterData?.latestAvailableDate,
      };
      setRegions(Array.isArray(regionData) ? regionData : []);
      setFilters(safeFilters);
      setLatestAvailableDate(safeFilters.latestAvailableDate);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadRegions = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      setRegions(await getMarketPriceRegions());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadFilters = useCallback(async () => {
    try {
      const data = await getMarketPriceFilters();
      setFilters({
        districts: Array.isArray(data?.districts) ? data.districts : [],
        markets: Array.isArray(data?.markets) ? data.markets : [],
        marketYardCount: data?.marketYardCount ?? 0,
        commodities: Array.isArray(data?.commodities) ? data.commodities : [],
        varieties: Array.isArray(data?.varieties) ? data.varieties : [],
        latestAvailableDate: data?.latestAvailableDate,
      });
    } catch {
    }
  }, []);

  const loadRegionMarkets = useCallback(async (region: string, nextPage = 1) => {
    setLoading(true);
    setError(false);
    setView('regionMarkets');
    setSelectedRegion(region);
    setPage(nextPage);
    try {
      const data = await getMarketYardsByRegion(region, {
        page: nextPage,
        limit: 21,
      });
      setMarkets(Array.isArray(data.items) ? data.items : []);
      setTotal(data.total ?? 0);
      setTotalPages(data.totalPages ?? 0);
    } catch {
      setMarkets([]);
      setTotal(0);
      setTotalPages(0);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMarketPrices = useCallback(async (
    market: string,
    district: string,
    nextPage = 1,
    options?: { search?: string; date?: string; variety?: string },
  ) => {
    setLoading(true);
    setError(false);
    setView('marketPrices');
    setSelectedMarket(market);
    setSelectedDistrict(district);
    setPage(nextPage);
    try {
      const data = await getMarketYardPrices(market, {
        district,
        page: nextPage,
        limit: 20,
        search: options?.search || undefined,
        date: options?.date || undefined,
        variety: options?.variety || undefined,
      });
      setMarketCrops(Array.isArray(data.items) ? data.items : []);
      setTotal(data.total ?? 0);
      setTotalPages(data.totalPages ?? 0);
      setLatestAvailableDate(data.latestAvailableDate);
    } catch {
      setMarketCrops([]);
      setTotal(0);
      setTotalPages(0);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCrops = useCallback(async () => {
    setLoading(true);
    setError(false);
    setView('crops');
    try {
      const data = await getMarketPriceCrops();
      setCrops(Array.isArray(data.items) ? data.items : []);
      setTotal(data.total ?? 0);
    } catch {
      setCrops([]);
      setTotal(0);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCropMarkets = useCallback(async (
    crop: string,
    nextPage = 1,
    options?: { search?: string; date?: string; variety?: string },
  ) => {
    setLoading(true);
    setError(false);
    setView('cropMarkets');
    setSelectedCrop(crop);
    setPage(nextPage);
    try {
      const data = await getCropMarketComparison(crop, {
        page: nextPage,
        limit: 20,
        search: options?.search || undefined,
        date: options?.date || undefined,
        variety: options?.variety || undefined,
      });
      setCropMarkets(Array.isArray(data.items) ? data.items : []);
      setTotal(data.total ?? 0);
      setTotalPages(data.totalPages ?? 0);
      setLatestAvailableDate(data.latestAvailableDate);
    } catch {
      setCropMarkets([]);
      setTotal(0);
      setTotalPages(0);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAdvanced = useCallback(async (nextPage = 1) => {
    setLoading(true);
    setError(false);
    setView('advanced');
    setPage(nextPage);
    try {
      const data = await getMarketPrices({
        page: nextPage,
        limit: 20,
        search: advancedSearch || undefined,
        district: advancedDistrict || undefined,
        market: advancedMarket || undefined,
        commodity: advancedCommodity || undefined,
        variety: advancedVariety || undefined,
        date: advancedDate || undefined,
      });
      setAdvancedItems(Array.isArray(data.items) ? data.items : []);
      setTotal(data.total ?? 0);
      setTotalPages(data.totalPages ?? 0);
      setLatestAvailableDate(data.latestAvailableDate);
    } catch {
      setAdvancedItems([]);
      setTotal(0);
      setTotalPages(0);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [advancedSearch, advancedDistrict, advancedMarket, advancedCommodity, advancedVariety, advancedDate]);

  /**
   * Return to the main Market Prices screen when the sidebar navigates to
   * the same pathname without any Market Prices query parameters.
   *
   * The sidebar uses Next.js <Link>, so the URL changes without a full
   * browser reload. Because this component can remain mounted, its local
   * `view` state would otherwise still show the previously opened deep page.
   * Watching useSearchParams() lets us reset the client state immediately.
   *
   * IMPORTANT: Do not replace writeUrl() with router/history logic here.
   * The existing deep-page navigation and refresh restoration remain unchanged.
   */
  useEffect(() => {
    const params = new URLSearchParams(marketPricesQuery);

    if (params.get('view')) return;

    setView('home');
    setSelectedRegion('');
    setSelectedMarket('');
    setSelectedDistrict('');
    setSelectedCrop('');
    setMarketSearch('');
    setCropSearch('');
    setDetailSearch('');
    setSelectedDate('');
    setSelectedVariety('');
    setAdvancedSearch('');
    setAdvancedDistrict('');
    setAdvancedMarket('');
    setAdvancedCommodity('');
    setAdvancedVariety('');
    setAdvancedDate('');
    setMarkets([]);
    setMarketCrops([]);
    setCropMarkets([]);
    setAdvancedItems([]);
    setPage(1);
    setTotal(0);
    setTotalPages(0);
    setError(false);
  }, [marketPricesQuery]);

  // Restore the exact view after browser refresh.
  useEffect(() => {
    if (restored || typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const savedView = (params.get('view') || 'home') as View;
    const region = params.get('region') || '';
    const market = params.get('market') || '';
    const district = params.get('district') || '';
    const crop = params.get('crop') || '';
    const date = params.get('date') || '';
    const variety = params.get('variety') || '';
    const search = params.get('search') || '';
    const savedPage = Math.max(1, Number(params.get('page') || '1') || 1);

    setSelectedRegion(region);
    setSelectedMarket(market);
    setSelectedDistrict(district);
    setSelectedCrop(crop);
    setSelectedDate(date);
    setSelectedVariety(variety);
    setDetailSearch(search);
    setPage(savedPage);
    setView(['home', 'regions', 'regionMarkets', 'marketPrices', 'crops', 'cropMarkets', 'advanced'].includes(savedView) ? savedView : 'home');

    setRestored(true);

    void loadFilters();

    if (savedView === 'home') {
      void loadHome();
    } else if (savedView === 'regions') {
      void loadRegions();
    } else if (savedView === 'regionMarkets' && region) {
      void loadRegionMarkets(region, savedPage);
    } else if (savedView === 'marketPrices' && market && district) {
      void loadMarketPrices(market, district, savedPage, {
        search,
        date,
        variety,
      });
    } else if (savedView === 'crops') {
      void loadCrops();
    } else if (savedView === 'cropMarkets' && crop) {
      void loadCropMarkets(crop, savedPage, {
        search,
        date,
        variety,
      });
    } else if (savedView === 'advanced') {
      void loadAdvanced(savedPage);
    } else {
      void loadHome();
      setView('home');
    }
  }, [
    restored,
    loadHome,
    loadRegions,
    loadRegionMarkets,
    loadMarketPrices,
    loadCrops,
    loadCropMarkets,
    loadAdvanced,
    loadFilters,
  ]);

  const openRegions = () => {
    setView('regions');
    setPage(1);
    setError(false);
    writeUrl({ view: 'regions', page: '1' });
    void loadRegions();
  };

  const openRegionMarkets = async (region: string) => {
    setSelectedRegion(region);
    setMarketSearch('');
    setPage(1);
    writeUrl({ view: 'regionMarkets', region, page: '1' });
    await loadRegionMarkets(region, 1);
  };

  const openMarketPrices = async (market: MarketPriceMarket) => {
    setDetailSearch('');
    setSelectedDate('');
    setSelectedVariety('');
    setPage(1);
    setMarketCrops([]);
    setCropMarkets([]);
    writeUrl({
      view: 'marketPrices',
      region: selectedRegion,
      market: market.market,
      district: market.district,
      page: '1',
    });
    await loadMarketPrices(market.market, market.district, 1);
  };

  const openCrops = async () => {
    setCropSearch('');
    setPage(1);
    setCropMarkets([]);
    setMarketCrops([]);
    writeUrl({ view: 'crops', page: '1' });
    await loadCrops();
  };

  const openCropMarkets = async (crop: string) => {
    setSelectedCrop(crop);
    setDetailSearch('');
    setSelectedDate('');
    setSelectedVariety('');
    setPage(1);
    setCropMarkets([]);
    setMarketCrops([]);
    writeUrl({ view: 'cropMarkets', crop, page: '1' });
    await loadCropMarkets(crop, 1);
  };

  const goBack = () => {
    if (view === 'regions') {
      setView('home');
      writeUrl({ view: 'home' });
      void loadHome();
    } else if (view === 'regionMarkets') {
      setView('regions');
      writeUrl({ view: 'regions', page: '1' });
      void loadRegions();
    } else if (view === 'marketPrices') {
      setView('regionMarkets');
      writeUrl({ view: 'regionMarkets', region: selectedRegion, page: '1' });
      void loadRegionMarkets(selectedRegion, 1);
    } else if (view === 'crops') {
      setView('home');
      writeUrl({ view: 'home' });
      void loadHome();
    } else if (view === 'cropMarkets') {
      setView('crops');
      writeUrl({ view: 'crops', page: '1' });
      void loadCrops();
    } else {
      setView('home');
      writeUrl({ view: 'home' });
      void loadHome();
    }
  };

  const handleMarketDateChange = (date: string) => {
    setSelectedDate(date);
    setPage(1);
    writeUrl({
      view: 'marketPrices',
      region: selectedRegion,
      market: selectedMarket,
      district: selectedDistrict,
      date,
      variety: selectedVariety,
      search: detailSearch,
      page: '1',
    });
    void loadMarketPrices(selectedMarket, selectedDistrict, 1, {
      date,
      variety: selectedVariety,
      search: detailSearch,
    });
  };

  const handleMarketVarietyChange = (variety: string) => {
    setSelectedVariety(variety);
    setPage(1);
    writeUrl({
      view: 'marketPrices',
      region: selectedRegion,
      market: selectedMarket,
      district: selectedDistrict,
      date: selectedDate,
      variety,
      search: detailSearch,
      page: '1',
    });
    void loadMarketPrices(selectedMarket, selectedDistrict, 1, {
      date: selectedDate,
      variety,
      search: detailSearch,
    });
  };

  const handleCropDateChange = (date: string) => {
    setSelectedDate(date);
    setPage(1);
    writeUrl({
      view: 'cropMarkets',
      crop: selectedCrop,
      date,
      variety: selectedVariety,
      search: detailSearch,
      page: '1',
    });
    void loadCropMarkets(selectedCrop, 1, {
      date,
      variety: selectedVariety,
      search: detailSearch,
    });
  };

  const handleCropVarietyChange = (variety: string) => {
    setSelectedVariety(variety);
    setPage(1);
    writeUrl({
      view: 'cropMarkets',
      crop: selectedCrop,
      date: selectedDate,
      variety,
      search: detailSearch,
      page: '1',
    });
    void loadCropMarkets(selectedCrop, 1, {
      date: selectedDate,
      variety,
      search: detailSearch,
    });
  };

  const handleMarketSearch = () => {
    setPage(1);
    writeUrl({
      view: 'marketPrices',
      region: selectedRegion,
      market: selectedMarket,
      district: selectedDistrict,
      date: selectedDate,
      variety: selectedVariety,
      search: detailSearch,
      page: '1',
    });
    void loadMarketPrices(selectedMarket, selectedDistrict, 1, {
      date: selectedDate,
      variety: selectedVariety,
      search: detailSearch,
    });
  };

  const handleCropSearch = () => {
    setPage(1);
    writeUrl({
      view: 'cropMarkets',
      crop: selectedCrop,
      date: selectedDate,
      variety: selectedVariety,
      search: detailSearch,
      page: '1',
    });
    void loadCropMarkets(selectedCrop, 1, {
      date: selectedDate,
      variety: selectedVariety,
      search: detailSearch,
    });
  };

  const handleMarketPage = (nextPage: number) => {
    writeUrl({
      view: 'marketPrices',
      region: selectedRegion,
      market: selectedMarket,
      district: selectedDistrict,
      date: selectedDate,
      variety: selectedVariety,
      search: detailSearch,
      page: String(nextPage),
    });
    void loadMarketPrices(selectedMarket, selectedDistrict, nextPage, {
      date: selectedDate,
      variety: selectedVariety,
      search: detailSearch,
    });
  };

  const handleCropPage = (nextPage: number) => {
    writeUrl({
      view: 'cropMarkets',
      crop: selectedCrop,
      date: selectedDate,
      variety: selectedVariety,
      search: detailSearch,
      page: String(nextPage),
    });
    void loadCropMarkets(selectedCrop, nextPage, {
      date: selectedDate,
      variety: selectedVariety,
      search: detailSearch,
    });
  };

  const filteredMarkets = useMemo(
    () => markets.filter((item) => `${item.market} ${item.district} ${getLocalizedMarketName(item.market, locale)} ${getLocalizedDistrictName(item.district, locale)}`.toLowerCase().includes(marketSearch.toLowerCase())),
    [markets, marketSearch, locale],
  );

  const filteredCrops = useMemo(
    () => crops.filter((item) => `${item.name} ${getLocalizedCropName(item.name, locale)}`.toLowerCase().includes(cropSearch.toLowerCase())),
    [crops, cropSearch, locale],
  );

  const viewTitle =
    view === 'home'
      ? t('title')
      : view === 'regions'
        ? t('marketYardPrice')
        : view === 'regionMarkets'
          ? selectedRegion
          : view === 'marketPrices'
            ? selectedMarket
            : view === 'crops'
              ? t('cropPrice')
              : view === 'cropMarkets'
                ? selectedCrop
                : t('advancedFilters');

  const priceUnitText = getPriceUnitText(locale);
  const priceUnit = getPriceUnitLabel();

  return (
    <div className="space-y-5">
      <div className="rounded-3xl bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 p-5 text-white shadow-sm md:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-brand-100">
              <Database className="h-4 w-4" />
              {t('source')}
            </div>
            <h1 className="mt-2 text-2xl font-bold md:text-3xl">{viewTitle}</h1>
            <p className="mt-2 max-w-2xl text-sm text-white/70">{t('description')}</p>
            <div className="mt-4 inline-flex rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs font-medium text-white/90">
              {priceUnitText} · {priceUnit}
            </div>
          </div>
          <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm">
            <p className="text-white/60">{t('latestAvailable')}</p>
            <p className="mt-1 font-semibold">{formatDate(latestAvailableDate, locale)}</p>
          </div>
        </div>
      </div>

      {view !== 'home' && (
        <button type="button" onClick={goBack} className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700 hover:text-brand-900">
          <ArrowLeft className="h-4 w-4" />
          {t('back')}
        </button>
      )}

      {error ? (
        <ErrorState
          t={t}
          onRetry={() => {
            if (view === 'home') void loadHome();
            else if (view === 'regions') void loadRegions();
            else if (view === 'regionMarkets') void loadRegionMarkets(selectedRegion, page);
            else if (view === 'marketPrices') void loadMarketPrices(selectedMarket, selectedDistrict, page, { date: selectedDate, variety: selectedVariety, search: detailSearch });
            else if (view === 'crops') void loadCrops();
            else if (view === 'cropMarkets') void loadCropMarkets(selectedCrop, page, { date: selectedDate, variety: selectedVariety, search: detailSearch });
            else void loadAdvanced(page);
          }}
        />
      ) : null}

      {!error && view === 'home' && (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <button type="button" onClick={openRegions} className="group rounded-3xl border border-gray-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md">
              <div className="flex items-start justify-between">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-700"><Store className="h-6 w-6" /></span>
                <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-brand-700" />
              </div>
              <h2 className="mt-5 text-xl font-bold text-gray-900">{t('marketYardPrice')}</h2>
              <p className="mt-2 text-sm text-gray-500">{t('marketYardPriceDescription')}</p>
              <p className="mt-3 text-xs font-semibold text-brand-700">{priceUnitText}</p>
            </button>
            <button type="button" onClick={() => void openCrops()} className="group rounded-3xl border border-gray-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md">
              <div className="flex items-start justify-between">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700"><Sprout className="h-6 w-6" /></span>
                <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-brand-700" />
              </div>
              <h2 className="mt-5 text-xl font-bold text-gray-900">{t('cropPrice')}</h2>
              <p className="mt-2 text-sm text-gray-500">{t('cropPriceDescription')}</p>
              <p className="mt-3 text-xs font-semibold text-emerald-700">{priceUnitText}</p>
            </button>
          </div>
          {loading ? <LoadingCards /> : (
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-gray-200 bg-white p-4"><p className="text-xs text-gray-500">{t('markets')}</p><p className="mt-1 text-2xl font-bold">{(filters.marketYardCount ?? 0).toLocaleString()}</p></div>
              <div className="rounded-2xl border border-gray-200 bg-white p-4"><p className="text-xs text-gray-500">{t('commodities')}</p><p className="mt-1 text-2xl font-bold">{filters.commodities.length.toLocaleString()}</p></div>
              <div className="rounded-2xl border border-gray-200 bg-white p-4"><p className="text-xs text-gray-500">{t('latestAvailable')}</p><p className="mt-1 text-lg font-bold">{formatDate(latestAvailableDate, locale)}</p></div>
            </div>
          )}
          <button type="button" onClick={() => { setView('advanced'); writeUrl({ view: 'advanced', page: '1' }); void loadAdvanced(1); }} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-gray-300 bg-white p-4 text-sm font-semibold text-gray-700 hover:border-brand-300 hover:text-brand-700">
            <Filter className="h-4 w-4" />
            {t('advancedFilters')}
          </button>
        </>
      )}

      {!error && view === 'regions' && (loading ? <LoadingCards /> : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {regions.map((region) => (
            <button key={region.name} type="button" onClick={() => void openRegionMarkets(region.name)} className="group rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm hover:border-brand-200 hover:shadow-md">
              <div className="flex items-center justify-between"><MapPin className="h-5 w-5 text-brand-700" /><ArrowRight className="h-4 w-4 text-gray-400" /></div>
              <h2 className="mt-4 font-bold text-gray-900">{getLocalizedRegionName(region.name, locale)}</h2>
              <p className="mt-1 text-sm text-gray-500">{region.marketCount} {t('marketYards')} · {region.districtCount} {t('districts')}</p>
            </button>
          ))}
        </div>
      ))}

      {!error && view === 'regionMarkets' && (
        <div className="space-y-4">
          <Input value={marketSearch} onChange={(e) => setMarketSearch(e.target.value)} placeholder={t('searchMarketYard')} leftIcon={<Search className="h-4 w-4" />} />
          {loading ? <LoadingCards /> : filteredMarkets.length ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredMarkets.map((market) => (
                <button key={`${market.market}-${market.district}`} type="button" onClick={() => void openMarketPrices(market)} className="group rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm hover:border-brand-200 hover:shadow-md">
                  <div className="flex items-center justify-between"><Store className="h-5 w-5 text-brand-700" /><ArrowRight className="h-4 w-4 text-gray-400" /></div>
                  <h2 className="mt-3 font-bold text-gray-900">{getLocalizedMarketName(market.market, locale)}</h2>
                  <p className="mt-1 text-sm text-gray-500">{getLocalizedDistrictName(market.district, locale)}</p>
                </button>
              ))}
            </div>
          ) : <EmptyState t={t} title={t('noMarketYards')} description={t('noMarketYardsDescription')} />}
          <Pagination page={page} totalPages={totalPages} onChange={(p) => { writeUrl({ view: 'regionMarkets', region: selectedRegion, page: String(p) }); void loadRegionMarkets(selectedRegion, p); }} t={t} />
        </div>
      )}

      {!error && view === 'marketPrices' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div><p className="text-sm text-gray-500">{getLocalizedDistrictName(selectedDistrict, locale)}</p><h2 className="text-xl font-bold text-gray-900">{getLocalizedMarketName(selectedMarket, locale)}</h2></div>
              <div className="flex flex-wrap gap-2">
                <div className="relative"><CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" /><input type="date" value={selectedDate} onChange={(e) => handleMarketDateChange(e.target.value)} className="h-10 rounded-xl border border-gray-200 pl-9 pr-3 text-sm" /></div>
                <select value={selectedVariety} onChange={(e) => handleMarketVarietyChange(e.target.value)} className="h-10 rounded-xl border border-gray-200 px-3 text-sm"><option value="">{t('allVarieties')}</option>{filters.varieties.map((v) => <option key={v} value={v}>{getLocalizedVariety(v, locale)}</option>)}</select>
              </div>
            </div>
            <div className="mt-3"><Input value={detailSearch} onChange={(e) => setDetailSearch(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleMarketSearch(); }} placeholder={t('searchCropInMarket')} leftIcon={<Search className="h-4 w-4" />} /></div>
            <p className="mt-2 text-xs font-medium text-brand-700">{priceUnitText} — {priceUnit}</p>
          </div>

          {loading ? <LoadingRows /> : marketCrops.length ? (
            <>
              <div className="hidden overflow-x-auto rounded-2xl border border-gray-200 bg-white md:block">
                <table className="w-full min-w-[950px] text-left text-sm">
                  <thead className="bg-gray-50 text-xs uppercase text-gray-500"><tr><th className="px-5 py-4">{t('commodity')}</th><th className="px-5 py-4">{t('variety')}</th><th className="px-5 py-4">{t('grade')}</th><th className="px-5 py-4">{t('min')}</th><th className="px-5 py-4">{t('modal')}</th><th className="px-5 py-4">{t('max')}</th><th className="px-5 py-4">{t('date')}</th></tr></thead>
                  <tbody className="divide-y divide-gray-100">{marketCrops.map((item, index) => <tr key={`${item.market}-${item.commodity}-${item.variety}-${item.grade}-${item.dataDate}-${index}`}><td className="px-5 py-4 font-semibold">{getLocalizedCropName(item.commodity, locale)}</td><td className="px-5 py-4 text-gray-600">{getLocalizedVariety(item.variety, locale) || '—'}</td><td className="px-5 py-4 text-gray-600">{getLocalizedGrade(item.grade, locale) || '—'}</td><td className="px-5 py-4">₹{formatPricePer20Kg(item.minimumPrice, locale)}</td><td className="px-5 py-4 font-bold text-brand-700">₹{formatPricePer20Kg(item.modalPrice, locale)}</td><td className="px-5 py-4">₹{formatPricePer20Kg(item.maximumPrice, locale)}</td><td className="px-5 py-4 text-gray-600">{formatDate(item.dataDate, locale)}</td></tr>)}</tbody>
                </table>
              </div>
              <div className="space-y-3 md:hidden">{marketCrops.map((item, index) => <article key={`${item.commodity}-${item.variety}-${index}`} className="rounded-2xl border border-gray-200 bg-white p-4"><div className="mb-3"><h3 className="font-bold">{getLocalizedCropName(item.commodity, locale)}</h3><p className="text-xs text-gray-500">{getLocalizedVariety(item.variety, locale) || '—'} {item.grade ? `· ${getLocalizedGrade(item.grade, locale)}` : ''}</p></div><div className="grid grid-cols-3 gap-2 text-center"><div className="rounded-xl bg-gray-50 p-2"><p className="text-[11px] text-gray-500">{t('min')}</p><p className="mt-1 font-semibold">₹{formatPricePer20Kg(item.minimumPrice, locale)}</p></div><div className="rounded-xl bg-brand-50 p-2"><p className="text-[11px] text-brand-700">{t('modal')}</p><p className="mt-1 font-bold text-brand-700">₹{formatPricePer20Kg(item.modalPrice, locale)}</p></div><div className="rounded-xl bg-gray-50 p-2"><p className="text-[11px] text-gray-500">{t('max')}</p><p className="mt-1 font-semibold">₹{formatPricePer20Kg(item.maximumPrice, locale)}</p></div></div><p className="mt-3 text-xs text-gray-500">{formatDate(item.dataDate, locale)}</p></article>)}</div>
              <Pagination page={page} totalPages={totalPages} onChange={handleMarketPage} t={t} />
            </>
          ) : <EmptyState t={t} title={t('noPricesForMarket')} description={t('noPricesForMarketDescription')} />}
        </div>
      )}

      {!error && view === 'crops' && (
        <div className="space-y-4">
          <Input value={cropSearch} onChange={(e) => setCropSearch(e.target.value)} placeholder={t('searchCrop')} leftIcon={<Search className="h-4 w-4" />} />
          {loading ? <LoadingCards /> : filteredCrops.length ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{filteredCrops.map((crop) => <button key={crop.name} type="button" onClick={() => void openCropMarkets(crop.name)} className="group rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm hover:border-brand-200 hover:shadow-md"><div className="flex items-center justify-between"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><Sprout className="h-5 w-5" /></span><ArrowRight className="h-4 w-4 text-gray-400" /></div><h2 className="mt-4 font-bold text-gray-900">{getLocalizedCropName(crop.name, locale)}</h2><p className="mt-1 text-sm text-gray-500">{crop.marketCount} {t('markets')}</p></button>)}</div> : <EmptyState t={t} title={t('noCrops')} description={t('noCropsDescription')} />}
        </div>
      )}

      {!error && view === 'cropMarkets' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><div><p className="text-sm text-gray-500">{t('cropComparison')}</p><h2 className="text-xl font-bold text-gray-900">{getLocalizedCropName(selectedCrop, locale)}</h2></div><div className="flex flex-wrap gap-2"><div className="relative"><CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" /><input type="date" value={selectedDate} onChange={(e) => handleCropDateChange(e.target.value)} className="h-10 rounded-xl border border-gray-200 pl-9 pr-3 text-sm" /></div><select value={selectedVariety} onChange={(e) => handleCropVarietyChange(e.target.value)} className="h-10 rounded-xl border border-gray-200 px-3 text-sm"><option value="">{t('allVarieties')}</option>{filters.varieties.map((v) => <option key={v} value={v}>{getLocalizedVariety(v, locale)}</option>)}</select></div></div>
            <p className="mt-3 text-xs text-gray-500">{t('comparisonNote')}</p>
            <div className="mt-3"><Input value={detailSearch} onChange={(e) => setDetailSearch(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleCropSearch(); }} placeholder={t('searchMarket')} leftIcon={<Search className="h-4 w-4" />} /></div>
            <p className="mt-2 text-xs font-medium text-brand-700">{priceUnitText} — {priceUnit}</p>
          </div>

          {loading ? <LoadingRows /> : cropMarkets.length ? (
            <>
              <div className="hidden overflow-x-auto rounded-2xl border border-gray-200 bg-white md:block">
                <table className="w-full min-w-[1000px] text-left text-sm">
                  <thead className="bg-gray-50 text-xs uppercase text-gray-500"><tr><th className="px-5 py-4">{t('market')}</th><th className="px-5 py-4">{t('district')}</th><th className="px-5 py-4">{t('highest')}</th><th className="px-5 py-4">{t('average')}</th><th className="px-5 py-4">{t('lowest')}</th><th className="px-5 py-4">{t('date')}</th></tr></thead>
                  <tbody className="divide-y divide-gray-100">{cropMarkets.map((item, index) => <tr key={`${item.market}-${item.district}-${item.dataDate}-${index}`}><td className="px-5 py-4 font-semibold">{getLocalizedMarketName(item.market, locale)}</td><td className="px-5 py-4 text-gray-600">{getLocalizedDistrictName(item.district, locale)}</td><td className="px-5 py-4 font-semibold">₹{formatPricePer20Kg(item.highestPrice, locale)}</td><td className="px-5 py-4 font-bold text-brand-700">₹{formatPricePer20Kg(item.averagePrice, locale)}</td><td className="px-5 py-4 font-semibold">₹{formatPricePer20Kg(item.lowestPrice, locale)}</td><td className="px-5 py-4 text-gray-600">{formatDate(item.dataDate, locale)}</td></tr>)}</tbody>
                </table>
              </div>
              <div className="space-y-3 md:hidden">{cropMarkets.map((item, index) => <article key={`${item.market}-${item.district}-${index}`} className="rounded-2xl border border-gray-200 bg-white p-4"><div><h3 className="font-bold">{getLocalizedMarketName(item.market, locale)}</h3><p className="text-xs text-gray-500">{getLocalizedDistrictName(item.district, locale)}</p></div><div className="mt-4 grid grid-cols-3 gap-2 text-center"><div className="rounded-xl bg-gray-50 p-2"><p className="text-[11px] text-gray-500">{t('highest')}</p><p className="mt-1 font-semibold">₹{formatPricePer20Kg(item.highestPrice, locale)}</p></div><div className="rounded-xl bg-brand-50 p-2"><p className="text-[11px] text-brand-700">{t('average')}</p><p className="mt-1 font-bold text-brand-700">₹{formatPricePer20Kg(item.averagePrice, locale)}</p></div><div className="rounded-xl bg-gray-50 p-2"><p className="text-[11px] text-gray-500">{t('lowest')}</p><p className="mt-1 font-semibold">₹{formatPricePer20Kg(item.lowestPrice, locale)}</p></div></div><p className="mt-3 text-xs text-gray-500">{formatDate(item.dataDate, locale)}</p></article>)}</div>
              <Pagination page={page} totalPages={totalPages} onChange={handleCropPage} t={t} />
            </>
          ) : <EmptyState t={t} title={t('noMarketPricesForCrop')} description={t('noMarketPricesForCropDescription')} />}
        </div>
      )}

      {!error && view === 'advanced' && (
        <AdvancedView t={t} filters={filters} search={advancedSearch} setSearch={setAdvancedSearch} district={advancedDistrict} setDistrict={setAdvancedDistrict} market={advancedMarket} setMarket={setAdvancedMarket} commodity={advancedCommodity} setCommodity={setAdvancedCommodity} variety={advancedVariety} setVariety={setAdvancedVariety} date={advancedDate} setDate={setAdvancedDate} items={advancedItems} loading={loading} page={page} totalPages={totalPages} onSearch={() => { writeUrl({ view: 'advanced', page: '1' }); void loadAdvanced(1); }} onPage={(p: number) => { writeUrl({ view: 'advanced', page: String(p) }); void loadAdvanced(p); }} locale={locale} />
      )}

      <p className="text-xs leading-5 text-gray-500">{t('transparency', { date: formatDate(latestAvailableDate, locale) })}</p>
    </div>
  );
}

function AdvancedView({
  t, filters, search, setSearch, district, setDistrict, market, setMarket, commodity, setCommodity, variety, setVariety, date, setDate, items, loading, page, totalPages, onSearch, onPage, locale,
}: any) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('searchPlaceholder')} leftIcon={<Search className="h-4 w-4" />} />
          <Select value={district} setValue={setDistrict} options={filters.districts} placeholder={t('district')} locale={locale} domain="district" />
          <Select value={market} setValue={setMarket} options={filters.markets} placeholder={t('market')} locale={locale} domain="market" />
          <Select value={commodity} setValue={setCommodity} options={filters.commodities} placeholder={t('commodity')} locale={locale} domain="crop" />
          <Select value={variety} setValue={setVariety} options={filters.varieties} placeholder={t('variety')} locale={locale} domain="variety" />
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-12 rounded-xl border-2 border-gray-200 px-3 text-sm" />
        </div>
        <div className="mt-3 flex justify-end"><Button onClick={onSearch}><Search className="mr-2 h-4 w-4" />{t('applyFilters')}</Button></div>
      </div>
      {loading ? <LoadingRows /> : items.length ? <><div className="hidden overflow-x-auto rounded-2xl border border-gray-200 bg-white md:block"><table className="w-full min-w-[950px] text-left text-sm"><thead className="bg-gray-50 text-xs uppercase text-gray-500"><tr><th className="px-5 py-4">{t('commodity')}</th><th className="px-5 py-4">{t('market')}</th><th className="px-5 py-4">{t('district')}</th><th className="px-5 py-4">{t('variety')}</th><th className="px-5 py-4">{t('grade')}</th><th className="px-5 py-4">{t('min')}</th><th className="px-5 py-4">{t('modal')}</th><th className="px-5 py-4">{t('max')}</th><th className="px-5 py-4">{t('date')}</th></tr></thead><tbody className="divide-y divide-gray-100">{items.map((item: MarketPrice) => <tr key={item.id}><td className="px-5 py-4 font-semibold">{getLocalizedCropName(item.commodity, locale)}</td><td className="px-5 py-4">{getLocalizedMarketName(item.market, locale)}</td><td className="px-5 py-4">{getLocalizedDistrictName(item.district, locale)}</td><td className="px-5 py-4">{getLocalizedVariety(item.variety, locale) || '—'}</td><td className="px-5 py-4">{getLocalizedGrade(item.grade, locale) || '—'}</td><td className="px-5 py-4">₹{formatPricePer20Kg(item.minimumPrice, locale)}</td><td className="px-5 py-4 font-bold text-brand-700">₹{formatPricePer20Kg(item.modalPrice, locale)}</td><td className="px-5 py-4">₹{formatPricePer20Kg(item.maximumPrice, locale)}</td><td className="px-5 py-4">{formatDate(item.dataDate, locale)}</td></tr>)}</tbody></table></div><Pagination page={page} totalPages={totalPages} onChange={onPage} t={t} /></> : <EmptyState t={t} />}
    </div>
  );
}

function Select({ value, setValue, options, placeholder, locale, domain }: { value: string; setValue: (value: string) => void; options: string[]; placeholder: string; locale: string; domain: 'district' | 'market' | 'crop' | 'variety' }) {
  const label = (option: string) => {
    if (domain === 'district') return getLocalizedDistrictName(option, locale);
    if (domain === 'market') return getLocalizedMarketName(option, locale);
    if (domain === 'crop') return getLocalizedCropName(option, locale);
    return getLocalizedVariety(option, locale);
  };
  return <select value={value} onChange={(e) => setValue(e.target.value)} className="h-12 rounded-xl border-2 border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-brand-500"><option value="">{placeholder}</option>{options.map((option) => <option key={option} value={option}>{label(option)}</option>)}</select>;
}
