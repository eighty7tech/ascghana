import Link from 'next/link';
import { Calendar, Eye } from 'lucide-react';

interface NewsCardProps {
  article: {
    id: number;
    title: string;
    slug: string;
    excerpt?: string | null;
    image?: string | null;
    category?: string | null;
    publishedAt?: Date | null;
    views: number;
  };
}

export default function NewsCard({ article }: NewsCardProps) {
  return (
    <Link href={`/news/${article.slug}`} className="group card p-4 hover:shadow-lg hover:border-arsenal-red/50 transition">
      <div className="flex gap-4">
        {article.image && (
          <div className="w-24 h-24 flex-shrink-0 rounded overflow-hidden bg-gray-200 dark:bg-gray-800">
            <img
              src={article.image}
              alt={article.title}
              className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          {article.category && (
            <p className="text-xs text-arsenal-red uppercase font-semibold mb-1">{article.category}</p>
          )}
          <h4 className="font-bold group-hover:text-arsenal-red transition line-clamp-2">{article.title}</h4>
          {article.excerpt && <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-1">{article.excerpt}</p>}
          <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
            {article.publishedAt && (
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(article.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </div>
            )}
            <div className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {article.views}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
