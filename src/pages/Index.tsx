import { Navigation } from '@/components/Navigation';
import { HeroSection } from '@/components/HeroSection';
import { FeaturesSection } from '@/components/FeaturesSection';
import { AboutSection } from '@/components/AboutSection';
import { ContactSection } from '@/components/ContactSection';
import { ParallaxBackground } from '@/components/ParallaxBackground';
import { CursorEffect } from '@/components/CursorEffect';

const Index = () => {
  return (
    <div className="relative">
      <ParallaxBackground />
      <CursorEffect />
      <Navigation />
      <HeroSection />
      <FeaturesSection />
      <AboutSection />
      <ContactSection />
    </div>
  );
};

export default Index;
