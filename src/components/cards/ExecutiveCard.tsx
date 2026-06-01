import { Mail, Phone } from 'lucide-react';

interface ExecutiveCardProps {
  executive: {
    id: number;
    name: string;
    photo?: string | null;
    bio?: string | null;
    email?: string | null;
    phone?: string | null;
    position: {
      title: string;
    };
  };
}

export default function ExecutiveCard({ executive }: ExecutiveCardProps) {
  return (
    <div className="card overflow-hidden hover:shadow-lg transition group">
      {executive.photo && (
        <div className="relative h-64 bg-gray-200 dark:bg-gray-800 overflow-hidden">
          <img
            src={executive.photo}
            alt={executive.name}
            className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
          />
        </div>
      )}
      <div className="p-6">
        <p className="text-xs text-arsenal-red uppercase font-semibold tracking-wider mb-2">
          {executive.position.title}
        </p>
        <h4 className="text-lg font-bold mb-3">{executive.name}</h4>
        {executive.bio && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">{executive.bio}</p>
        )}
        <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
          {executive.email && (
            <a
              href={`mailto:${executive.email}`}
              title={executive.email}
              className="text-arsenal-red hover:text-arsenal-gold transition"
            >
              <Mail className="w-4 h-4" />
            </a>
          )}
          {executive.phone && (
            <a
              href={`tel:${executive.phone}`}
              title={executive.phone}
              className="text-arsenal-red hover:text-arsenal-gold transition"
            >
              <Phone className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
