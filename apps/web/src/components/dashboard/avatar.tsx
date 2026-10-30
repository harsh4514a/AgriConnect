'use client';

import { cn } from '@/utils/cn';

interface AvatarProps {
    /** Full name used to derive initials when no image is provided. */
    name: string;
    /** Optional profile image URL. Rendered when available. */
    src?: string;
    /** Tailwind size classes, e.g. 'h-9 w-9 text-sm'. */
    className?: string;
}

/** Derive up to two initials from a full name, e.g. "Rajesh Patel" -> "RP". */
function getInitials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean).slice(0, 2);
    return parts
        .map((part) => part.charAt(0).toUpperCase())
        .join('') || '?';
}

/**
 * Renders a profile avatar. Shows the image when `src` is provided,
 * otherwise a gradient circle with the user's initials. */ export function Avatar({ name, src, className }: AvatarProps) { if (src) { return ( <span className={cn('inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-full','ring-1 ring-border',
                    className,
                )}
            >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={name} className="h-full w-full object-cover" />
            </span>
        );
    }

    return (
        <span
            className={cn(
                'inline-flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-accent-foreground',
                'bg-accent text-accent-foreground ring-1 ring-border',
                className,
            )}
            aria-hidden="true"
        >
            {getInitials(name)}
        </span>
    );
}
