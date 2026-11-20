import { useEffect, useState } from 'react';
import { Check, Users } from 'lucide-react';
import { apiRequest } from '../lib/api.ts';
import type { Hall, ServiceItem } from '../types.ts';
import { useBookHallNavigation } from '../hooks/useBookHallNavigation.ts';
import { usePageSeo } from '../config/site.ts';

export function PricingPage() {
  usePageSeo('Pricing', 'Transparent hall rental packages and optional event services.');
  const navigateToBook = useBookHallNavigation();
  const [halls, setHalls] = useState<Hall[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiRequest<{ halls: Hall[] }>('/api/halls'),
      apiRequest<{ services: ServiceItem[] }>('/api/services'),
    ])
      .then(([hRes, sRes]) => {
        setHalls(hRes.halls);
        setServices(sRes.services);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="section-spacing bg-[#F7F8FA]">
      <div className="site-container space-y-14">
        <div className="max-w-xl space-y-2">
          <h1 className="h1-title">Transparent Venue Pricing</h1>
          <p className="body-text">
            Every hall package includes dedicated event setup time, climate control, tables, and chairs.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="card-surface h-[320px] animate-pulse bg-white" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {halls.map((hall) => {
              const amenityList = hall.amenities
                .split(',')
                .map((a) => a.trim())
                .filter(Boolean)
                .slice(0, 4);
              return (
                <div key={hall.id} className="card-surface p-8 flex flex-col justify-between gap-6">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="h3-title">{hall.name}</h2>
                        <div className="small-text flex items-center gap-1.5 mt-1 tabular-nums">
                          <Users className="w-4 h-4 text-[#45459E]" strokeWidth={1.75} />
                          <span>Up to {hall.capacity} Guests</span>
                        </div>
                      </div>
                      <div className="text-[28px] font-bold text-[#201853] tabular-nums">
                        ${hall.price.toLocaleString()}
                      </div>
                    </div>

                    <p className="small-text">{hall.description}</p>

                    <ul className="space-y-2 pt-2 border-t border-gray-100">
                      {amenityList.map((amenity) => (
                        <li key={amenity} className="flex items-center gap-2.5 text-[14px] text-[#1F2937]">
                          <Check className="w-4 h-4 text-[#45459E] shrink-0" strokeWidth={1.75} />
                          <span>{amenity}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigateToBook(hall.id)}
                    className="btn-primary w-full"
                  >
                    Book Hall
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Optional Add-On Services */}
        <div className="space-y-6">
          <div className="max-w-xl space-y-2">
            <h2 className="h2-title">Optional Add-On Services</h2>
            <p className="body-text">
              Combine any of our curated event services during your online reservation.
            </p>
          </div>
          <div className="card-surface overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-[14px] text-[#6B7280]">
                  <th className="py-4 px-6 font-semibold">Service</th>
                  <th className="py-4 px-6 font-semibold">Details</th>
                  <th className="py-4 px-6 font-semibold text-right">Package Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {services.map((svc) => (
                  <tr key={svc.id} className="hover:bg-[#F7F8FA]/60">
                    <td className="py-4 px-6 font-medium text-[#1F2937] whitespace-nowrap">{svc.name}</td>
                    <td className="py-4 px-6 small-text">{svc.description}</td>
                    <td className="py-4 px-6 text-right font-semibold text-[#201853] tabular-nums whitespace-nowrap">
                      +${svc.price.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
