import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface PageIntroProps {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  titleId?: string;
  className?: string;
}

/** Shared compact heading for browse and data pages. */
export function PageIntro({ title, description, actions, titleId, className }: PageIntroProps) {
  return (
    <header
      className={cn(
        'flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between',
        className,
      )}
    >
      <div className="min-w-0 max-w-3xl">
        <h1
          id={titleId}
          className="text-xl font-semibold leading-7 tracking-tight text-foreground sm:text-2xl"
        >
          {title}
        </h1>
        {description ? (
          <p className="mt-1 text-sm leading-5 text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}
