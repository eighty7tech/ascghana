import { getHomePageStats } from '@/lib/db';
import { Users, MapPin, Calendar, Heart } from 'lucide-react';

interface StatCard {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  suffix?: string;
}

export default async function QuickStatsGrid() {
  const stats = await getHomePageStats();

  const cards: StatCard[] = [
    {
      icon: <Users className="w-8 h-8" />,
      label: 'Total Members',
      value: stats.totalMembers,
    },
    {
      icon: <MapPin className="w-8 h-8" />,
      label: 'Registered Branches',
      value: stats.branches,
    },
    {
      icon: <Calendar className="w-8 h-8" />,
      label: 'Upcoming Events',
      value: stats.upcomingEvents,
    },
    {
      icon: <Heart className="w-8 h-8" />,
      label: 'Community Projects',
      value: stats.communityProjects,
    },
  ];

  return (
    <section className="section bg-white dark:bg-slate-950">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map((card, idx) => (
            <div
              key={idx}
              className="card p-8 text-center hover:shadow-lg transition-all duration-300 group"
            >
              <div className="flex justify-center mb-4 text-arsenal-red group-hover:scale-110 transition-transform">
                {card.icon}
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm font-semibold uppercase tracking-wider mb-2">
                {card.label}
              </p>
              <p className="text-4xl font-bold text-arsenal-navy dark:text-white">
                {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
                {card.suffix && <span className="text-lg">{card.suffix}</span>}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
