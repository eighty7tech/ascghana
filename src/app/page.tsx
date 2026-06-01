'use client';

import { Suspense } from 'react';
import { Metadata } from 'next';
import HeroSection from '@/components/sections/HeroSection';
import QuickStatsGrid from '@/components/sections/QuickStatsGrid';
import FeaturedContent from '@/components/sections/FeaturedContent';
import MembershipSection from '@/components/sections/MembershipSection';
import ExecutiveCommitteeSection from '@/components/sections/ExecutiveCommitteeSection';
import MatchdayExperience from '@/components/sections/MatchdayExperience';
import CommunityImpactSection from '@/components/sections/CommunityImpactSection';
import PhotoGallery from '@/components/sections/PhotoGallery';
import SupportersGroupsSection from '@/components/sections/SupportersGroupsSection';
import SponsorsSection from '@/components/sections/SponsorsSection';
import FanStoriesSection from '@/components/sections/FanStoriesSection';
import ShopPreview from '@/components/sections/ShopPreview';
import NewsletterSection from '@/components/sections/NewsletterSection';
import Footer from '@/components/layout/Footer';

// Loading placeholders
import SectionSkeleton from '@/components/skeletons/SectionSkeleton';
import StatsGridSkeleton from '@/components/skeletons/StatsGridSkeleton';

export const metadata: Metadata = {
  title: 'Home | Arsenal Supporters Club Ghana',
  description: 'Welcome to the Arsenal Supporters Club Ghana. Join our thriving community of Gunners fans. Membership, events, community projects, and official merchandise.',
  keywords: [
    'Arsenal Supporters Club Ghana',
    'ASC Ghana',
    'Arsenal FC',
    'Ghana Gooners',
    'Membership',
    'Events',
    'Community',
  ],
  openGraph: {
    title: 'Arsenal Supporters Club Ghana',
    description: 'Official Arsenal Supporters Club Ghana - Home',
    type: 'website',
    url: 'https://arsenalghana.com',
    images: [
      {
        url: '/images/og-home.png',
        width: 1200,
        height: 630,
        alt: 'Arsenal Supporters Club Ghana',
      },
    ],
  },
};

export default function HomePage() {
  return (
    <main className="w-full overflow-hidden">
      {/* Hero Section */}
      <Suspense fallback={<div className="h-screen bg-gradient-to-br from-arsenal-red/20 to-arsenal-navy/20 animate-pulse" />}>
        <HeroSection />
      </Suspense>

      {/* Quick Stats Grid */}
      <Suspense fallback={<StatsGridSkeleton />}>
        <QuickStatsGrid />
      </Suspense>

      {/* Featured Content (News, Events, Match Centers) */}
      <Suspense fallback={<SectionSkeleton count={3} />}>
        <FeaturedContent />
      </Suspense>

      {/* Membership Section */}
      <Suspense fallback={<SectionSkeleton />}>
        <MembershipSection />
      </Suspense>

      {/* Executive Committee */}
      <Suspense fallback={<SectionSkeleton count={5} />}>
        <ExecutiveCommitteeSection />
      </Suspense>

      {/* Matchday Experience */}
      <Suspense fallback={<SectionSkeleton count={3} />}>
        <MatchdayExperience />
      </Suspense>

      {/* Community Impact */}
      <Suspense fallback={<SectionSkeleton count={3} />}>
        <CommunityImpactSection />
      </Suspense>

      {/* Photo & Video Gallery */}
      <Suspense fallback={<SectionSkeleton />}>
        <PhotoGallery />
      </Suspense>

      {/* Supporters Groups */}
      <Suspense fallback={<SectionSkeleton count={4} />}>
        <SupportersGroupsSection />
      </Suspense>

      {/* Sponsors & Partners */}
      <Suspense fallback={<SectionSkeleton />}>
        <SponsorsSection />
      </Suspense>

      {/* Fan Stories */}
      <Suspense fallback={<SectionSkeleton count={3} />}>
        <FanStoriesSection />
      </Suspense>

      {/* Shop Preview */}
      <Suspense fallback={<SectionSkeleton count={4} />}>
        <ShopPreview />
      </Suspense>

      {/* Newsletter */}
      <Suspense fallback={<SectionSkeleton />}>
        <NewsletterSection />
      </Suspense>

      {/* Footer */}
      <Suspense fallback={<div className="h-64 bg-black/80" />}>
        <Footer />
      </Suspense>
    </main>
  );
}
