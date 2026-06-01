import Link from 'next/link';
import { Check, Star } from 'lucide-react';

interface MembershipCardProps {
  membership: {
    id: number;
    name: string;
    slug: string;
    description?: string | null;
    price: any;
    benefits: any;
    color: string;
    isPopular: boolean;
  };
}

export default function MembershipCard({ membership }: MembershipCardProps) {
  const benefits = Array.isArray(membership.benefits) ? membership.benefits : [];

  return (
    <div
      className={`card p-8 flex flex-col ${
        membership.isPopular
          ? 'ring-2 ring-arsenal-red shadow-lg shadow-arsenal-red/20 relative'
          : ''
      }`}
    >
      {membership.isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="badge badge-red inline-flex items-center gap-1">
            <Star className="w-3 h-3" />
            Most Popular
          </span>
        </div>
      )}

      <h3 className="text-2xl font-bold mb-2">{membership.name}</h3>
      {membership.description && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{membership.description}</p>
      )}

      <div className="mb-6">
        <span className="text-4xl font-bold text-arsenal-red">GHS {membership.price.toLocaleString()}</span>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Annual Membership</p>
      </div>

      <ul className="space-y-3 mb-8 flex-1">
        {benefits.map((benefit: any, idx: number) => (
          <li key={idx} className="flex items-start gap-3">
            <Check className="w-5 h-5 text-arsenal-red flex-shrink-0 mt-0.5" />
            <span className="text-sm text-gray-700 dark:text-gray-300">{benefit}</span>
          </li>
        ))}
      </ul>

      <Link href={`/membership/apply?type=${membership.slug}`} className="btn-arsenal w-full justify-center">
        Join Now
      </Link>
    </div>
  );
}
