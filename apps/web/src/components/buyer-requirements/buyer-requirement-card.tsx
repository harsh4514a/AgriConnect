import { AdaptiveLink as Link } from '@/components/performance/adaptive-link';
import { useParams } from 'next/navigation';
import { ArrowRight, MapPin, Package, ShieldCheck } from 'lucide-react';
import type { BuyerRequirement } from '@/services/api/buyer-requirements.api';
import { getLocalizedDomainName } from '@agri/domain-data';

function cropLabel(
  requirement: BuyerRequirement,
  labels: Record<string, string>,
  locale: string,
) {
  const sourceValue = requirement.cropKey === 'other'
    ? requirement.customCropName || requirement.cropKey
    : requirement.cropKey;
  const localized = getLocalizedDomainName(sourceValue, locale, 'crop');
  if (localized !== sourceValue) return localized;
  return requirement.cropKey === 'other'
    ? requirement.customCropName || labels.other
    : labels[requirement.cropKey] || localized;
}

function formatQuantity(value: number) {
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 2,
  }).format(value);
}

function formatLocation(requirement: BuyerRequirement, locale: string) {
  return [
    requirement.village ? getLocalizedDomainName(requirement.village, locale, 'village') : '',
    requirement.taluka ? getLocalizedDomainName(requirement.taluka, locale, 'taluka') : '',
    requirement.district ? getLocalizedDomainName(requirement.district, locale, 'district') : '',
  ]
    .filter(Boolean)
    .join(', ');
}

export function BuyerRequirementCard({
  requirement,
  cropLabels,
  labels,
}: {
  requirement: BuyerRequirement;
  cropLabels: Record<string, string>;
  labels: {
    buyer: string;
    verifiedBuyer: string;
    view: string;
    variety: string;
  };
}) {
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  const buyerName =
    [requirement.postedBy?.firstName, requirement.postedBy?.lastName]
      .filter(Boolean)
      .join(' ') || labels.buyer;

  const location = formatLocation(requirement, locale);

  return (
    <article className="group flex h-full flex-col rounded-2xl border border-border bg-surface p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-bold text-foreground">
            {cropLabel(requirement, cropLabels, locale)}
          </h2>

          <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Package className="h-4 w-4 shrink-0" />
            <span>
              {formatQuantity(requirement.quantity)} {getLocalizedDomainName(requirement.unit, locale, 'unit')}
            </span>
          </div>

          {requirement.variety ? (
            <p className="mt-1 text-xs font-medium text-muted-foreground">
              {labels.variety}: {getLocalizedDomainName(requirement.variety, locale, 'variety')}
            </p>
          ) : null}
        </div>

        {requirement.postedBy?.isVerified ? (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-accent-soft px-2 py-1 text-[11px] font-semibold text-accent">
            <ShieldCheck className="h-3.5 w-3.5" />
            {labels.verifiedBuyer}
          </span>
        ) : null}
      </div>

      <div className="mt-4 space-y-3">
        <p className="flex items-start gap-1.5 text-sm text-muted-foreground">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{location}</span>
        </p>

        {requirement.additionalRequirements ? (
          <p className="line-clamp-2 text-sm leading-5 text-muted-foreground">
            {requirement.additionalRequirements}
          </p>
        ) : null}
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 pt-5">
        <div className="min-w-0">
          <p className="truncate text-xs text-muted-foreground">
            {labels.buyer}: {buyerName}
          </p>
        </div>

        <Link
          href={`/${locale}/dashboard/buyer-requirements/${requirement.id}`}
          prefetch={false}
          className="inline-flex shrink-0 items-center gap-1 rounded-full bg-accent px-3.5 py-2 text-xs font-semibold text-accent-foreground transition hover:bg-accent-strong"
        >
          {labels.view}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </article>
  );
}
