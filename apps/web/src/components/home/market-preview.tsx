'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useLocale } from 'next-intl';
import {
    BadgeCheck,
    MapPin,
    TrendingUp,
    X,
    Phone,
    ChevronRight,
    Clock,
    Package,
    Wheat,
    Apple,
    Leaf,
} from 'lucide-react';
import type { CropListing } from '@/data/marketplace-listings';
import { API_BASE_URL } from '@/lib/api-url';
import { getLocalizedDomainName } from '@agri/domain-data';

/* ─────────────────────────────────────────────────────── */
/* Types                                                    */
/* ─────────────────────────────────────────────────────── */

interface ApiListingsResponse {
    listings: CropListing[];
    total: number;
}

interface MarketPreviewProps {
    onGetStarted: () => void;
}

/* ─────────────────────────────────────────────────────── */
/* Category Filter Config                                   */
/* ─────────────────────────────────────────────────────── */

const CATEGORY_FILTERS = [
    { key: 'all', label: 'All Crops', icon: Leaf },
    { key: 'grains', label: 'Grains', icon: Wheat, crops: ['wheat', 'rice', 'maize', 'bajra'] },
    { key: 'vegetables', label: 'Vegetables', icon: Apple, crops: ['tomato', 'onion', 'potato', 'chili'] },
    { key: 'oilseeds', label: 'Oilseeds', icon: Package, crops: ['groundnut', 'cotton'] },
] as const;

type CategoryKey = (typeof CATEGORY_FILTERS)[number]['key'];

/* ─────────────────────────────────────────────────────── */
/* Helpers                                                  */
/* ─────────────────────────────────────────────────────── */

function formatPostedAgo(listing: CropListing): string {
    if (listing.createdAt) {
        const d = new Date(listing.createdAt);
        const hrs = Math.floor((Date.now() - d.getTime()) / 3_600_000);
        if (hrs < 1) return 'Just now';
        if (hrs < 24) return `${hrs}h ago`;
        const days = Math.floor(hrs / 24);
        return `${days}d ago`;
    }
    const h = listing.postedHoursAgo ?? 0;
    if (h < 1) return 'Just now';
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
}

function formatPrice(listing: CropListing, locale: string): { amount: string; unit: string } {
    const price = listing.price ?? 0;
    const primary = listing.primaryUnit ?? '20 kg';
    return {
        amount: `₹${price.toLocaleString('en-IN')}`,
        unit: `per ${getLocalizedDomainName(primary, locale, 'unit')}`,
    };
}

function formatQuantity(listing: CropListing, locale: string): string {
    const qty = listing.quantity ?? 0;
    const unit = listing.unit ?? 'kg';
    if (unit === 'kg' && qty >= 1000) {
        return `${(qty / 100).toFixed(0)} ${getLocalizedDomainName('quintal', locale, 'unit')}`;
    }
    return `${qty.toLocaleString(locale)} ${getLocalizedDomainName(unit, locale, 'unit')}`;
}

/* ─────────────────────────────────────────────────────── */
/* Skeleton Card                                            */
/* ─────────────────────────────────────────────────────── */

function SkeletonCard() {
    return (
        <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
            <div className="h-44 animate-pulse bg-gray-100" />
            <div className="p-5 space-y-3">
                <div className="flex gap-2">
                    <div className="h-5 w-24 animate-pulse rounded-full bg-gray-100" />
                    <div className="h-5 w-5 animate-pulse rounded-full bg-gray-100" />
                </div>
                <div className="h-4 w-32 animate-pulse rounded-full bg-gray-100" />
                <div className="mt-4 flex justify-between border-t border-gray-50 pt-4">
                    <div>
                        <div className="h-7 w-20 animate-pulse rounded bg-gray-100" />
                        <div className="mt-1 h-3 w-16 animate-pulse rounded bg-gray-100" />
                    </div>
                    <div className="text-right">
                        <div className="h-5 w-16 animate-pulse rounded bg-gray-100" />
                        <div className="mt-1 h-3 w-14 animate-pulse rounded bg-gray-100" />
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────────────── */
/* Quick-View Modal                                         */
/* ─────────────────────────────────────────────────────── */

interface QuickViewModalProps {
    listing: CropListing;
    onClose: () => void;
    onGetStarted: () => void;
}

function QuickViewModal({ listing, onClose, onGetStarted }: QuickViewModalProps) {
    const locale = useLocale();
    const priceInfo = formatPrice(listing, locale);
    const postedAgo = formatPostedAgo(listing);
    const cropName = listing.cropKey === 'other' && !listing.customCropName
        ? 'Produce'
        : getLocalizedDomainName(listing.customCropName || listing.cropKey, locale, 'crop');
    const locationParts = [
        listing.village ? getLocalizedDomainName(listing.village, locale, 'village') : '',
        listing.taluka ? getLocalizedDomainName(listing.taluka, locale, 'taluka') : '',
        listing.district ? getLocalizedDomainName(listing.district, locale, 'district') : '',
        listing.state ? getLocalizedDomainName(listing.state, locale, 'state') : '',
    ].filter(Boolean);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4"
            onClick={onClose}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

            {/* Modal */}
            <motion.div
                initial={{ opacity: 0, y: 32, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 16, scale: 0.96 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl shadow-black/20"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Crop image */}
                <div className="relative h-48 overflow-hidden bg-gray-50">
                    <Image
                        src={listing.image}
                        alt={listing.imageAlt || listing.cropKey}
                        fill
                        className="object-contain p-6"
                    />
                    <button
                        onClick={onClose}
                        className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-black/10 text-gray-700 backdrop-blur-sm transition hover:bg-black/20"
                        aria-label="Close"
                    >
                        <X className="h-4 w-4" />
                    </button>
                    {listing.verified && (
                        <div className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-green-600/90 px-3 py-1 text-xs font-bold text-white backdrop-blur-sm">
                            <BadgeCheck className="h-3.5 w-3.5" />
                            Verified Farmer
                        </div>
                    )}
                </div>

                <div className="p-6">
                    {/* Title + posted */}
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <h3 className="text-xl font-black text-gray-900 capitalize">
                                {cropName}
                            </h3>
                            {listing.variety && (
                                <p className="mt-0.5 text-sm text-gray-500">{getLocalizedDomainName(listing.variety, locale, 'variety')}</p>
                            )}
                        </div>
                        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700">
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" />
                            {postedAgo}
                        </span>
                    </div>

                    {/* Location */}
                    {(listing.village || listing.district) && (
                        <p className="mt-2 flex items-center gap-1.5 text-sm text-gray-500">
                            <MapPin className="h-3.5 w-3.5 text-green-600" />
                            {locationParts.join(', ')}
                        </p>
                    )}

                    {/* Price + quantity */}
                    <div className="mt-5 flex items-end justify-between rounded-2xl bg-green-50/70 p-4">
                        <div>
                            <p className="text-3xl font-black text-green-700">{priceInfo.amount}</p>
                            <p className="text-xs font-medium text-gray-400">{priceInfo.unit}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-lg font-bold text-gray-800">{formatQuantity(listing, locale)}</p>
                            <p className="text-xs text-gray-400">Available</p>
                        </div>
                    </div>

                    {/* Quality grade */}
                    {listing.qualityGrade && (
                        <div className="mt-3 flex items-center gap-2">
                            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                                {getLocalizedDomainName(listing.qualityGrade, locale, 'grade')}
                            </span>
                            {listing.readyToSell && (
                                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                                    Ready to Sell
                                </span>
                            )}
                        </div>
                    )}

                    {/* Farmer info */}
                    {listing.farmerName && (
                        <div className="mt-4 flex items-center gap-3 rounded-2xl border border-gray-100 p-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-emerald-600 text-sm font-black text-white">
                                {listing.farmerName.charAt(0)}
                            </div>
                            <div className="min-w-0">
                                <p className="truncate text-sm font-bold text-gray-900">{listing.farmerName}</p>
                                <p className="text-xs text-gray-400">
                                    Member since {listing.farmerMemberSince ?? '2024'}
                                    {listing.farmerListingCount
                                        ? ` · ${listing.farmerListingCount} listing${listing.farmerListingCount > 1 ? 's' : ''}`
                                        : ''}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* CTA */}
                    <div className="mt-5 flex gap-3">
                        {listing.mobileNumber && (
                            <a
                                href={`tel:${listing.mobileNumber}`}
                                className="flex flex-1 items-center justify-center gap-2 rounded-2xl border-2 border-green-200 py-3.5 text-sm font-bold text-green-700 transition-all duration-300 hover:border-green-400 hover:bg-green-50"
                            >
                                <Phone className="h-4 w-4" />
                                Call Farmer
                            </a>
                        )}
                        <button
                            onClick={onGetStarted}
                            className="flex flex-1 items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-black text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
                            style={{ background: 'linear-gradient(135deg, #2E7D32, #1B5E20)' }}
                        >
                            View Full Details
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}

/* ─────────────────────────────────────────────────────── */
/* Listing Card                                             */
/* ─────────────────────────────────────────────────────── */

const cardVariant = {
    hidden: { opacity: 0, y: 24 },
    show: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
    },
};

interface ListingCardProps {
    listing: CropListing;
    onClick: () => void;
}

function ListingCard({ listing, onClick }: ListingCardProps) {
    const locale = useLocale();
    const priceInfo = formatPrice(listing, locale);
    const postedAgo = formatPostedAgo(listing);

    const cropName = listing.cropKey === 'other' && !listing.customCropName
        ? 'Produce'
        : getLocalizedDomainName(listing.customCropName || listing.cropKey, locale, 'crop');

    const location = [
        listing.village ? getLocalizedDomainName(listing.village, locale, 'village') : '',
        listing.district ? getLocalizedDomainName(listing.district, locale, 'district') : '',
    ].filter(Boolean).join(', ');

    return (
        <motion.article
            variants={cardVariant}
            onClick={onClick}
            className="group cursor-pointer overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-black/[0.08]"
        >
            {/* Image */}
            <div className="relative h-44 overflow-hidden bg-gray-50">
                <Image
                    src={listing.image}
                    alt={listing.imageAlt || cropName}
                    fill
                    className="object-contain p-4 transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />

                {/* Live badge */}
                <div className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-green-700 backdrop-blur-sm shadow-sm">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" />
                    <Clock className="h-3 w-3" />
                    {postedAgo}
                </div>

            </div>

            <div className="p-5">
                <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-gray-900">{cropName}</h3>
                    {listing.verified && (
                        <span title="Verified Farmer" className="inline-flex items-center text-green-600">
                            <BadgeCheck className="h-4 w-4" />
                        </span>
                    )}
                </div>

                {location && (
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-500">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{location}</span>
                    </p>
                )}

                {listing.qualityGrade && (
                    <span className="mt-2 inline-block rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-700">
                        {getLocalizedDomainName(listing.qualityGrade, locale, 'grade')}
                    </span>
                )}

                <div className="mt-4 flex items-end justify-between border-t border-gray-100 pt-4">
                    <div>
                        <p className="text-2xl font-black text-green-700">{priceInfo.amount}</p>
                        <p className="text-xs font-medium text-gray-400">{priceInfo.unit}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm font-bold text-gray-800">{formatQuantity(listing, locale)}</p>
                        <p className="text-xs text-gray-400">Available</p>
                    </div>
                </div>
            </div>
        </motion.article>
    );
}

/* ─────────────────────────────────────────────────────── */
/* Main Component                                           */
/* ─────────────────────────────────────────────────────── */

const containerVariant = {
    hidden: {},
    show: { transition: { staggerChildren: 0.07 } },
};

export function MarketPreview({ onGetStarted }: MarketPreviewProps) {
    const [listings, setListings] = useState<CropListing[]>([]);
    const [loading, setLoading] = useState(true);
    const [liveCount, setLiveCount] = useState(0);
    const [activeCategory, setActiveCategory] = useState<CategoryKey>('all');
    const [selectedListing, setSelectedListing] = useState<CropListing | null>(null);

    // Fetch real listings
    const fetchListings = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/listings?limit=6&status=active`, {
                cache: 'no-store',
            });
            if (!res.ok) throw new Error('API error');
            const data: ApiListingsResponse = await res.json();

            if (data.listings?.length > 0) {
                setListings(data.listings.slice(0, 6));
                setLiveCount(data.total ?? data.listings.length);
            } else {
                setListings([]);
                setLiveCount(0);
            }
        } catch {
            setListings([]);
            setLiveCount(0);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchListings();
    }, [fetchListings]);

    // Filter by category
    const filtered = listings.filter((l) => {
        if (activeCategory === 'all') return true;
        const cat = CATEGORY_FILTERS.find((f) => f.key === activeCategory);
        if (!cat || !('crops' in cat)) return true;
        return (cat.crops as readonly string[]).includes(l.cropKey);
    });

    const displayListings = filtered.slice(0, 6);

    return (
        <section id="marketplace" className="relative py-20 sm:py-24">
            {/* Ambient glow */}
            <div className="pointer-events-none absolute left-1/2 top-0 h-[300px] w-[600px] -translate-x-1/2 rounded-full bg-green-50/60 blur-3xl" aria-hidden="true" />

            <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

                {/* Header */}
                <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
                    <div className="max-w-2xl">
                        <motion.span
                            initial={{ opacity: 0, y: 16 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5 }}
                            className="inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-1.5 text-sm font-bold text-green-800"
                        >
                            {liveCount > 0 ? (
                                <>
                                    <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                                    Live — {liveCount} active listing{liveCount !== 1 ? 's' : ''}
                                </>
                            ) : (
                                'Marketplace'
                            )}
                        </motion.span>

                        <motion.h2
                            initial={{ opacity: 0, y: 16 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.05 }}
                            className="mt-4 text-3xl font-black tracking-tight text-gray-900 sm:text-4xl"
                        >
                            Live Marketplace Preview
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0, y: 16 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className="mt-3 text-lg leading-relaxed text-gray-500"
                        >
                            Browse crop listings shared by farmers using AgriConnect.
                        </motion.p>
                    </div>

                    <motion.button
                        initial={{ opacity: 0, y: 12 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: 0.15 }}
                        onClick={onGetStarted}
                        className="inline-flex shrink-0 items-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-white transition-all duration-300 hover:-translate-y-0.5"
                        style={{
                            background: 'linear-gradient(135deg, #2E7D32, #1B5E20)',
                            boxShadow: '0 4px 14px rgba(46,125,50,0.3)',
                        }}
                    >
                        Browse Market
                        <TrendingUp className="h-4 w-4" />
                    </motion.button>
                </div>

                {/* Category Filter Tabs */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                    className="mt-8 flex flex-wrap gap-2"
                >
                    {CATEGORY_FILTERS.map((cat) => {
                        const Icon = cat.icon;
                        const isActive = activeCategory === cat.key;
                        return (
                            <button
                                key={cat.key}
                                onClick={() => setActiveCategory(cat.key as CategoryKey)}
                                className={[
                                    'inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-200',
                                    isActive
                                        ? 'bg-green-700 text-white shadow-md shadow-green-900/20'
                                        : 'bg-white border border-gray-200 text-gray-600 hover:border-green-300 hover:text-green-700',
                                ].join(' ')}
                            >
                                <Icon className="h-3.5 w-3.5" />
                                {cat.label}
                            </button>
                        );
                    })}
                </motion.div>

                {/* Cards Grid
                     NOTE: We keep a *single stable outer div* that is never
                     unmounted when categories change. Switching to a category
                     with no results would unmount the motion.div; when
                     switching back, it re-mounts already inside the viewport
                     so whileInView+once:true never fires → cards are invisible.
                     Fix: outer div always renders; inner motion.div gets a new
                     `key` on every tab change so Framer remounts it and runs
                     the stagger animation fresh.  We use `animate` directly
                     (not whileInView) because the element is already visible.
                */}
                <div className="mt-10 min-h-[200px]">
                    {loading ? (
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <SkeletonCard key={i} />
                            ))}
                        </div>
                    ) : displayListings.length === 0 ? (
                        <motion.div
                            key={`empty-${activeCategory}`}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-gray-200 bg-gray-50/50 py-20 text-center"
                        >
                            <Leaf className="h-8 w-8 text-gray-300" />
                            <p className="mt-3 text-sm font-medium text-gray-400">
                                No listings in this category yet.
                            </p>
                            <button
                                onClick={() => setActiveCategory('all')}
                                className="mt-4 rounded-full border border-green-200 px-4 py-1.5 text-xs font-semibold text-green-700 transition-colors hover:bg-green-50"
                            >
                                View all crops
                            </button>
                        </motion.div>
                    ) : (
                        <motion.div
                            key={activeCategory}
                            variants={containerVariant}
                            initial="hidden"
                            animate="show"
                            className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
                        >
                            {displayListings.map((listing) => (
                                <ListingCard
                                    key={listing.id}
                                    listing={listing}
                                    onClick={() => setSelectedListing(listing)}
                                />
                            ))}
                        </motion.div>
                    )}
                </div>

                {/* Footer note */}
                <motion.p
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="mt-8 text-center text-sm text-gray-400"
                >
                    {liveCount > 0
                        ? 'Sign in to contact farmers and view full listing details.'
                        : 'No active listings are available to preview right now.'}
                </motion.p>
            </div>

            {/* Quick-View Modal */}
            <AnimatePresence>
                {selectedListing && (
                    <QuickViewModal
                        listing={selectedListing}
                        onClose={() => setSelectedListing(null)}
                        onGetStarted={onGetStarted}
                    />
                )}
            </AnimatePresence>
        </section>
    );
}
