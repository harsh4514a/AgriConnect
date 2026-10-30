import type { Locale, Messages } from '@/i18n/config';
import { AboutSection } from './about-section';
import { Faq } from './faq';
import { FeaturesSection } from './features-section';
import { Footer } from './footer';
import { HeroSlider } from './hero-slider';
import { HomeSectionReveal } from './home-section-reveal';
import { HowItWorks } from './how-it-works';
import { Navbar } from './navbar';
import { WhyAgriConnect } from './why-agriconnect';

type LandingCopy = Messages['landingPage'];

const HERO_IMAGES = ['/image1.jpg', '/image2.jpg', '/image3.jpg'] as const;
const HERO_POSITIONS = ['center 58%', 'center 56%', 'center 82%'] as const;

export function HomePage({ locale, copy }: { locale: Locale; copy: LandingCopy }) {
  const slidesCopy = [copy.hero.slides.marketplace, copy.hero.slides.prices, copy.hero.slides.guidance];
  const aboutBenefits = [
    copy.sections.features.items.marketplace,
    copy.sections.features.items.prices,
    copy.sections.features.items.languages,
  ];
  const heroSlides = slidesCopy.map((slide, index) => ({
    ...slide,
    image: HERO_IMAGES[index],
    imagePosition: HERO_POSITIONS[index],
    primaryHref: [
      `/${locale}/dashboard/marketplace`,
      `/${locale}/dashboard/market-prices`,
      `/${locale}/dashboard/crop-guide`,
    ][index],
    secondaryHref: [
      `/${locale}/auth`,
      `/${locale}/dashboard/marketplace`,
      `/${locale}/dashboard/government-schemes`,
    ][index],
  }));

  return (
    <div className="public-marketing-site min-h-screen bg-canvas text-foreground">
      <Navbar variant="solid" />

      <main id="homepage-content">
        <HeroSlider slides={heroSlides} controls={copy.hero.controls} />
        <AboutSection locale={locale} copy={copy.sections.about} benefits={aboutBenefits} />
        <FeaturesSection />
        <HowItWorks />
        <WhyAgriConnect />
        <Faq copy={copy.sections.faq} />
        <HomeSectionReveal />
      </main>

      <Footer />
    </div>
  );
}
