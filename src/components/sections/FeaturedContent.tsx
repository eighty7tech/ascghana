import { Suspense } from 'react';
import { getFeaturedNews, getUpcomingEvents, getMatchViewingCenters } from '@/lib/db';
import NewsCard from '@/components/cards/NewsCard';
import EventCard from '@/components/cards/EventCard';
import MatchViewingCard from '@/components/cards/MatchViewingCard';
import SectionSkeleton from '@/components/skeletons/SectionSkeleton';

async function NewsColumn() {
  const news = await getFeaturedNews(3);
  return (
    <div>
      <h3 className="section-label mb-6">Latest News</h3>
      <div className="space-y-4">
        {news.map(article => (
          <NewsCard key={article.id} article={article} />
        ))}
      </div>
    </div>
  );
}

async function EventsColumn() {
  const events = await getUpcomingEvents(3);
  return (
    <div>
      <h3 className="section-label mb-6">Upcoming Events</h3>
      <div className="space-y-4">
        {events.map(event => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
}

async function MatchViewingColumn() {
  const matches = await getMatchViewingCenters(3);
  return (
    <div>
      <h3 className="section-label mb-6">Match Viewing Centers</h3>
      <div className="space-y-4">
        {matches.map(match => (
          <MatchViewingCard key={match.id} match={match} />
        ))}
      </div>
    </div>
  );
}

export default function FeaturedContent() {
  return (
    <section className="section bg-gradient-to-b from-gray-50 to-white dark:from-slate-900 dark:to-slate-950">
      <div className="container">
        <div className="mb-12">
          <h2 className="text-4xl font-bold mb-2">What's Happening</h2>
          <p className="text-gray-600 dark:text-gray-400">Stay updated with the latest news, events, and match viewing opportunities</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Suspense fallback={<SectionSkeleton count={3} />}>
            <NewsColumn />
          </Suspense>
          <Suspense fallback={<SectionSkeleton count={3} />}>
            <EventsColumn />
          </Suspense>
          <Suspense fallback={<SectionSkeleton count={3} />}>
            <MatchViewingColumn />
          </Suspense>
        </div>
      </div>
    </section>
  );
}
