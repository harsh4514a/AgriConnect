'use client';

import { useTranslations } from 'next-intl';
import { useGoToAuth } from './transition-overlay';
import { Navbar } from './navbar';
import { Hero } from './hero';
import { TrustSection } from './trust-section';
import { FeaturesSection } from './features-section';
import { HowItWorks } from './how-it-works';
import { WhyAgriConnect } from './why-agriconnect';
import { MarketPreview } from './market-preview';
import { Testimonials } from './testimonials';
import { Faq } from './faq';
import { FinalCta } from './final-cta';
import { Footer } from './footer';

export function HomePage() {
    const t = useTranslations();
    void t; // used by children

    const { goToAuth, overlay } = useGoToAuth();

    const handleLogin = () => goToAuth();
    const handleGetStarted = () => goToAuth();
    const handleExplore = () => {
        document.getElementById('marketplace')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    return (
        <>
            {overlay}

            <Navbar onLogin={handleLogin} onGetStarted={handleGetStarted} />

            <main>
                <Hero onGetStarted={handleGetStarted} onExplore={handleExplore} />
                <TrustSection />
                <FeaturesSection />
                <HowItWorks />
                <WhyAgriConnect />
                <MarketPreview onGetStarted={handleGetStarted} />
                <Testimonials />
                <Faq />
                <FinalCta onGetStarted={handleGetStarted} />
            </main>

            <Footer />
        </>
    );
}
