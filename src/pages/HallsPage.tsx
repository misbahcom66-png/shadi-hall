import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Search } from 'lucide-react';
import { apiRequest } from '../lib/api.ts';
import type { Hall } from '../types.ts';
import { SafeImage } from '../components/SafeImage.tsx';
import { usePageSeo } from '../config/site.ts';

export function HallsPage() {
  usePageSeo('All Halls', 'Browse all available wedding and banquet halls by guest capacity and pricing.');

  const [halls, setHalls] = useState<Hall[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [minCapacity, setMinCapacity] = useState<number>(0);

  useEffect(() => {
    apiRequest<{ halls: Hall[] }>('/api/halls')
      .then((res) => setHalls(res.halls))
      .catch(() => setHalls([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return halls.filter((h) => {
      const matchesQuery =
        h.name.toLowerCase().includes(query.toLowerCase()) ||
        h.description.toLowerCase().includes(query.toLowerCase());
      const matchesCap = h.capacity >= minCapacity;
      return matchesQuery && matchesCap;
    });
  }, [halls, query, minCapacity]);

  return (
    <div className="section-spacing bg-[#F7F8FA] min-h-[70vh]">
      <div className="site-container space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <h1 className="h1-title">Our Wedding &amp; Event Halls</h1>
            <p className="body-text">
              Select a venue tailored to your guest list, seating style, and celebration timeline.
            </p>
          </div>

          {/* Search & Capacity Filter */}
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search
                className="w-4 h-4 text-[#6B7280] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                strokeWidth={1.75}
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search halls..."
                aria-label="Search halls"
                className="input-field pl-10"
              />
            </div>
            <select
              value={minCapacity}
              onChange={(e) => setMinCapacity(Number(e.target.value))}
              aria-label="Filter by minimum guest capacity"
              className="input-field sm:w-48"
            >
              <option value={0}>Any Capacity</option>
              <option value={150}>150+ Guests</option>
              <option value={300}>300+ Guests</option>
              <option value={500}>500+ Guests</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card-surface h-[400px] animate-pulse bg-white" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="card-surface p-12 text-center space-y-3">
            <h2 className="h3-title">No halls match your filters</h2>
            <p className="body-text">Try adjusting the minimum capacity or search phrase.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((hall) => (
              <article key={hall.id} className="card-surface overflow-hidden flex flex-col">
                <div className="aspect-[16/10] w-full overflow-hidden">
                  <SafeImage
                    src={hall.image_url}
                    alt={hall.name}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-[1.03]"
                  />
                </div>
                <div className="p-6 flex-1 flex flex-col justify-between gap-5">
                  <div className="space-y-2">
                    <h2 className="h3-title">{hall.name}</h2>
                    <div className="flex items-center gap-3 text-[14px] text-[#6B7280] tabular-nums">
                      <span className="inline-flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-[#45459E]" strokeWidth={1.75} />
                        Up to {hall.capacity} Guests
                      </span>
                      <span aria-hidden="true">&middot;</span>
                      <span className="font-semibold text-[#201853]">
                        ${hall.price.toLocaleString()}
                      </span>
                    </div>
                    <p className="small-text line-clamp-3">{hall.description}</p>
                  </div>
                  <Link to={`/halls/${hall.id}`} className="btn-primary w-full">
                    View Details
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
