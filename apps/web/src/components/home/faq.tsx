'use client';

import { useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import type { Messages } from '@/i18n/config';

type FaqCopy = Messages['landingPage']['sections']['faq'];

export function Faq({ copy }: { copy: FaqCopy }) {
  const entries = Object.entries(copy.items);
  const [openId, setOpenId] = useState<string | null>(entries[0]?.[0] ?? null);

  return (
    <section
      id="faq"
      aria-labelledby="faq-heading"
      className="relative scroll-mt-20 py-12 sm:py-14 lg:py-16"
    >
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <span
            data-home-reveal
            data-home-reveal-order="0"
            className="inline-block rounded-full bg-accent-soft px-4 py-1.5 text-sm font-bold text-accent"
          >
            {copy.eyebrow}
          </span>
          <h2
            id="faq-heading"
            data-home-reveal
            data-home-reveal-order="1"
            className="mt-4 text-3xl font-black tracking-tight text-foreground sm:text-4xl"
          >
            {copy.title}
          </h2>
          <p
            data-home-reveal
            data-home-reveal-order="2"
            className="mt-3 text-lg leading-relaxed text-muted-foreground"
          >
            {copy.description}
          </p>
        </div>

        <div className="mt-12 space-y-3">
          {entries.map(([key, item], index) => {
            const open = openId === key;
            const panelId = `faq-panel-${key}`;
            const questionId = `faq-question-${key}`;

            return (
              <div
                key={key}
                data-home-reveal
                data-home-reveal-order={String(index % 5)}
                className={`overflow-hidden rounded-2xl border transition-colors duration-300 ${open
                  ? 'border-accent/25 bg-surface shadow-sm'
                  : 'border-border bg-surface hover:border-accent/20'
                  }`}
              >
                <button
                  type="button"
                  id={questionId}
                  onClick={() => setOpenId(open ? null : key)}
                  aria-expanded={open}
                  aria-controls={panelId}
                  className="flex min-h-16 w-full items-center justify-between gap-4 px-6 py-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-green-600"
                >
                  <span className="text-base font-bold text-foreground sm:text-lg">
                    {item.question}
                  </span>
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors duration-300 ${open
                      ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white'
                      : 'bg-surface-subtle text-muted-foreground'
                      }`}
                    aria-hidden="true"
                  >
                    {open ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  </span>
                </button>

                {open ? (
                    <div
                      id={panelId}
                      role="region"
                      aria-labelledby={questionId}
                      className="overflow-hidden"
                    >
                      <p className="px-6 pb-5 text-sm leading-relaxed text-muted-foreground sm:text-base">
                        {item.answer}
                      </p>
                    </div>
                  ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
