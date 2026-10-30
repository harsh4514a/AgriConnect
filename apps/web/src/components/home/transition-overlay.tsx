'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useRouter, useParams } from 'next/navigation';

/**
 * Seamless page transition overlay for Home → Auth.
 *
 * Both the home hero and the auth page render the SAME background image
 * (Background_Image.jpg) with the SAME green-tinted overlays. So when the
 * user clicks Login / Get Started, we fade in a full-screen copy of that
 * identical background. Because the background is identical on both pages,
 * the user perceives ONLY the content changing — the background appears to
 * stay perfectly still. We then push the route and unmount the overlay,
 * letting the auth content fade in over the same background.
 */
export function useGoToAuth() {
    const router = useRouter();
    const params = useParams();
    const locale = (params?.locale as string) || 'en';
    const [leaving, setLeaving] = useState(false);

    const goToAuth = () => {
        if (leaving) return;
        setLeaving(true);
        // Give the overlay a beat to fade in over the identical background
        // before navigating, so the swap is imperceptible.
        window.setTimeout(() => {
            router.push(`/${locale}/auth`);
        }, 450);
    };

    useEffect(() => {
        return () => {
            setLeaving(false);
        };
    }, []);

    const overlay = (
        <AnimatePresence>
            {leaving && (
                <motion.div
                    key="auth-transition"
                    aria-hidden="true"
                    className="fixed inset-0 z-[100]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4, ease: 'easeInOut' }}
                >
                    {/* Identical background to home hero + auth page — background stays constant */}
                    <Image
                        src="/Background_Image.jpg"
                        alt=""
                        fill
                        sizes="100vw"
                        quality={60}
                        className="object-cover object-center"
                    />
                    {/* Identical green-tinted overlays as both pages */}
                    <div className="absolute inset-0 bg-gradient-to-r from-green-950/50 via-green-900/25 to-green-800/10" />
                    <div className="absolute inset-0 bg-gradient-to-t from-green-950/20 via-transparent to-green-950/10" />
                    <div className="absolute inset-0 bg-gradient-to-b from-green-950/10 via-transparent to-green-950/20" />

                    {/* Content gracefully fades out — only the content changes */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        {/* Subtle logo keep visible to anchor continuity, then fades on nav */}
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                            className="flex items-center gap-2.5"
                        >
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-accent-foreground shadow-sm">
                                <span className="text-lg font-black text-white">🌾</span>
                            </div>
                        </motion.div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );

    return { goToAuth, overlay };
}
