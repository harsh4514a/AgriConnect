'use client';

import Link from 'next/link';
import { forwardRef, useEffect, useState, type ComponentProps } from 'react';

type NetworkInformation = EventTarget & {
  effectiveType?: string;
  saveData?: boolean;
};

type NavigatorWithConnection = Navigator & {
  connection?: NetworkInformation;
};

type AdaptiveLinkProps = ComponentProps<typeof Link>;

/** Prefetch visible navigation on normal connections, and save background data on 2G. */
export const AdaptiveLink = forwardRef<HTMLAnchorElement, AdaptiveLinkProps>(
  function AdaptiveLink(props, ref) {
    const [canPrefetch, setCanPrefetch] = useState(false);

    useEffect(() => {
      const connection = (navigator as NavigatorWithConnection).connection;
      const updatePrefetch = () => {
        setCanPrefetch(
          !connection?.saveData &&
            !['slow-2g', '2g'].includes(connection?.effectiveType ?? ''),
        );
      };

      updatePrefetch();
      connection?.addEventListener('change', updatePrefetch);
      return () => connection?.removeEventListener('change', updatePrefetch);
    }, []);

    // Override Link's default or caller setting so prefetch follows the connection.
    return <Link {...props} ref={ref} prefetch={canPrefetch ? null : false} />;
  },
);

AdaptiveLink.displayName = 'AdaptiveLink';
