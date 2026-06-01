import Link from 'next/link';
import { Calendar, Clock, MapPin } from 'lucide-react';

interface EventCardProps {
  event: {
    id: number;
    title: string;
    slug: string;
    shortDescription?: string | null;
    date: Date;
    time?: Date | null;
    venue?: string | null;
    image?: string | null;
    isFree: boolean;
    memberPrice?: any;
  };
}

export default function EventCard({ event }: EventCardProps) {
  return (
    <Link href={`/events/${event.slug}`} className="group card p-4 hover:shadow-lg hover:border-arsenal-red/50 transition">
      <div className="flex gap-4">
        {event.image && (
          <div className="w-20 h-20 flex-shrink-0 rounded overflow-hidden bg-gray-200 dark:bg-gray-800">
            <img
              src={event.image}
              alt={event.title}
              className="w-full h-full object-cover group-hover:scale-110 transition"
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h4 className="font-bold group-hover:text-arsenal-red transition line-clamp-2">{event.title}</h4>
          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 mt-2">
            <Calendar className="w-3 h-3" />
            {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </div>
          {event.venue && (
            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 mt-1">
              <MapPin className="w-3 h-3" />
              {event.venue}
            </div>
          )}
        </div>
        {event.isFree ? (
          <span className="badge badge-gold flex-shrink-0">Free</span>
        ) : (
          <div className="text-arsenal-red font-bold flex-shrink-0">GHS {event.memberPrice}</div>
        )}
      </div>
    </Link>
  );
}
