'use client';

import { useTranslations } from 'next-intl';
import { Calculator } from 'lucide-react';
import type { UnitKey } from '@/data/marketplace-listings';
import { cn } from '@/utils/cn';

interface StepQuantityPricingProps {
  quantity: number | '';
  unit: UnitKey;
  price: number | '';
  primaryUnit: string;
  errors: Record<string, string>;
  onChange: (fields: {
    quantity?: number | '';
    unit?: UnitKey;
    price?: number | '';
    primaryUnit?: string;
  }) => void;
}

function parseAmount(raw: string): number | '' {
  if (raw === '') return '';
  const parsed = Number(raw);
  if (Number.isNaN(parsed) || parsed < 0) return '';
  return parsed;
}

export function StepQuantityPricing({
  quantity,
  unit,
  price,
  primaryUnit,
  errors,
  onChange,
}: StepQuantityPricingProps) {
  const t = useTranslations();

  const unitOptions: { value: UnitKey; label: string }[] = [
    { value: 'quintal', label: t('dashboard.marketplaceBrowse.unit.quintal') },
    { value: 'kg', label: t('dashboard.marketplaceBrowse.unit.kg') },
    { value: 'ton', label: t('dashboard.marketplaceBrowse.unit.ton') },
  ];

  const priceUnitOptions = [
    { value: '20 kg', label: t('dashboard.createListing.priceUnits.per20kg') },
    { value: 'quintal', label: t('dashboard.createListing.priceUnits.perQuintal') },
    { value: 'kg', label: t('dashboard.createListing.priceUnits.perKg') },
  ];

  const selectedPriceUnitLabel =
    priceUnitOptions.find((option) => option.value === primaryUnit)?.label ?? primaryUnit;

  const totalValue = (() => {
    if (!quantity || !price || quantity <= 0 || price <= 0) return null;
    const qty = Number(quantity);
    const prc = Number(price);

    let qtyInKg = qty;
    if (unit === 'quintal') qtyInKg = qty * 100;
    if (unit === 'ton') qtyInKg = qty * 1000;

    let pricePerKg = prc / 20;
    if (primaryUnit === 'quintal') pricePerKg = prc / 100;
    if (primaryUnit === 'kg') pricePerKg = prc;

    return Math.round(qtyInKg * pricePerKg);
  })();

  const inputClass = (hasError: boolean) =>
    cn(
      'h-12 w-full rounded-xl border bg-surface-subtle px-4 text-base font-semibold text-foreground placeholder-muted-foreground backdrop-blur-xl transition-all focus:bg-surface-subtle focus:outline-none focus:ring-2',
      hasError
        ? 'border-red-400 focus:border-red-400 focus:ring-danger/30'
        : 'border-border focus:border-focus focus:ring-focus',
    );

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div>
          <label htmlFor="quantity" className="block text-sm font-semibold text-foreground">
            {t('dashboard.createListing.fields.quantity')} <span className="text-danger">*</span>
          </label>
          <p className="mt-1 text-xs text-muted-foreground">{t('dashboard.createListing.fields.quantityHelper')}</p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <input
              id="quantity"
              type="number"
              min="1"
              step="any"
              inputMode="decimal"
              value={quantity}
              onChange={(e) => onChange({ quantity: parseAmount(e.target.value) })}
              placeholder={t('dashboard.createListing.fields.quantityPlaceholder')}
              aria-required="true"
              aria-invalid={errors.quantity ? 'true' : 'false'}
              aria-describedby={errors.quantity ? 'quantity-error' : undefined}
              className={inputClass(Boolean(errors.quantity))}
            />
          </div>

          <div
            role="radiogroup"
            aria-label={t('dashboard.createListing.fields.unit')}
            className="flex min-h-12 gap-1.5 rounded-xl border border-border bg-surface-subtle p-1"
          >
            {unitOptions.map((u) => (
              <button
                key={u.value}
                type="button"
                role="radio"
                aria-checked={unit === u.value}
                onClick={() => onChange({ unit: u.value })}
                className={cn(
                  'min-h-10 flex-1 rounded-lg px-3 py-2 text-xs font-semibold capitalize transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus sm:flex-initial',
                  unit === u.value
                    ? 'bg-accent text-accent-foreground shadow-md'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {u.label}
              </button>
            ))}
          </div>
        </div>

        {errors.quantity && (
          <p id="quantity-error" role="alert" className="text-xs font-medium text-danger">
            {errors.quantity}
          </p>
        )}
      </div>

      <div className="space-y-3">
        <div>
          <label htmlFor="price" className="block text-sm font-semibold text-foreground">
            {t('dashboard.createListing.fields.price')} <span className="text-danger">*</span>
          </label>
          <p className="mt-1 text-xs text-muted-foreground">{t('dashboard.createListing.fields.priceHelper')}</p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-base font-bold text-foreground">
              ₹
            </span>
            <input
              id="price"
              type="number"
              min="1"
              step="any"
              inputMode="decimal"
              value={price}
              onChange={(e) => onChange({ price: parseAmount(e.target.value) })}
              placeholder={t('dashboard.createListing.fields.pricePlaceholder')}
              aria-required="true"
              aria-invalid={errors.price ? 'true' : 'false'}
              aria-describedby={errors.price ? 'price-error' : 'price-unit-hint'}
              className={cn(inputClass(Boolean(errors.price)), 'pl-8')}
            />
          </div>

          <div
            role="radiogroup"
            aria-label={t('dashboard.createListing.fields.priceUnit')}
            className="flex min-h-12 gap-1.5 rounded-xl border border-border bg-surface-subtle p-1"
          >
            {priceUnitOptions.map((pu) => (
              <button
                key={pu.value}
                type="button"
                role="radio"
                aria-checked={primaryUnit === pu.value}
                onClick={() => onChange({ primaryUnit: pu.value })}
                className={cn(
                  'min-h-10 flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus sm:flex-initial',
                  primaryUnit === pu.value
                    ? 'bg-accent text-accent-foreground shadow-md'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {pu.label}
              </button>
            ))}
          </div>
        </div>

        {errors.price && (
          <p id="price-error" role="alert" className="text-xs font-medium text-danger">
            {errors.price}
          </p>
        )}

        {price && Number(price) > 0 && (
          <p id="price-unit-hint" className="text-xs text-muted-foreground">
            {t('dashboard.createListing.fields.pricePerUnitHint', {
              price: new Intl.NumberFormat('en-IN').format(Number(price)),
              unit: selectedPriceUnitLabel,
            })}
          </p>
        )}
      </div>

      {totalValue !== null && (
        <div className="rounded-2xl border border-border bg-accent-soft p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-accent">
              <Calculator className="h-4 w-4" aria-hidden />
              <span>{t('dashboard.createListing.fields.totalValue')}</span>
            </div>
            <div className="text-xl font-extrabold text-foreground">
              ₹{new Intl.NumberFormat('en-IN').format(totalValue)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
