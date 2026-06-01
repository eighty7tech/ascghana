import { MapPin, Users, Clock } from 'lucide-react';

interface MatchViewingCardProps {
  match: {
    id: number;
    matchTitle: string;
    venue: string;
    kickoffTime?: string | null;
    rsvpCount: number;
    capacity: number;
  };
}

export default function MatchViewingCard({ match }: MatchViewingCardProps) {
  const capacity = match.capacity > 0 ? ((match.rsvpCount / match.capacity) * 100).toFixed(0) : 0;

  return (
    <div className="card p-4 hover:shadow-lg hover:border-arsenal-red/50 transition">
      <h4 className="font-bold mb-2">{match.venue}</h4>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{match.matchTitle}</p>
      
      <div className="space-y-2">
        {match.kickoffTime && (
          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
            <Clock className="w-3 h-3" />
            {match.kickoffTime}
          </div>
        )}
        <div className="flex items-center gap-2 text-xs">
          <Users className="w-3 h-3 text-arsenal-red" />
          <span className="text-arsenal-red font-semibold">{match.rsvpCount} RSVPs</span>
        </div>
        {match.capacity > 0 && (
          <div className="mt-2">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Occupancy</span>
              <span>{capacity}%</span>
            </div>
            <div className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-arsenal-red transition-all"
                style={{ width: `${capacity}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
