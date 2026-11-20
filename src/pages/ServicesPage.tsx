import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Utensils, Flower2, ShieldCheck, Music, Sparkles } from 'lucide-react';
import { apiRequest } from '../lib/api.ts';
import type { ServiceItem } from '../types.ts';
import { SafeImage } from '../components/SafeImage.tsx';
import { useBookHallNavigation } from '../hooks/useBookHallNavigation.ts';
import { usePageSeo } from '../config/site.ts';

const CATEGORY_META: Record<string, { title: string; subtitle: string; image: string }> = {
  catering: {
    title: 'Banquet Catering Services',
    subtitle: 'Full-course plated dinners, custom buffets, and attentive table hospitality prepared in-house.',
    image: '/src/assets/images/service_catering_banquet_1794825124313.jpg',
  },
  decoration: {
    title: 'Floral & Stage Decoration',
    subtitle: 'Architectural drapery, stage florals, and bespoke aisle installations tailored to your colors.',
    image: '/src/assets/images/service_floral_decor_1794825125083.jpg',
  },
  parking: {
    title: 'Valet Parking & Security',
    subtitle: 'Uniformed hospitality security, traffic marshals, and seamless valet arrivals for every guest.',
    image: '/src/assets/images/hall_emerald_pavilion_1794825122560.jpg',
  },
  'sound-lighting': {
    title: 'Sound & Lighting Production',
    subtitle: 'Crystal-clear acoustic line arrays, wireless microphones, and warm ambient uplighting.',
    image: '/src/assets/images/hall_royal_ballroom_1794825122864.jpg',
  },
};

function renderServiceIcon(iconName: string) {
  switch (iconName) {
    case 'utensils':
      return <Utensils className="w-6 h-6" strokeWidth={1.75} />;
    case 'flower':
      return <Flower2 className="w-6 h-6" strokeWidth={1.75} />;
    case 'shield':
      return <ShieldCheck className="w-6 h-6" strokeWidth={1.75} />;
    case 'music':
      return <Music className="w-6 h-6" strokeWidth={1.75} />;
    default:
      return <Sparkles className="w-6 h-6" strokeWidth={1.75} />;
  }
}

export function ServicesPage() {
  const { category } = useParams();
  const navigateToBook = useBookHallNavigation();
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);

  const meta = category ? CATEGORY_META[category] : null;
  usePageSeo(
    meta ? meta.title : 'Event Services',
    meta ? meta.subtitle : 'Explore catering, floral decoration, valet parking, and sound & lighting packages.'
  );

  useEffect(() => {
    apiRequest<{ services: ServiceItem[] }>('/api/services')
      .then((res) => setServices(res.services))
      .catch(() => setServices([]))
      .finally(() => setLoading(false));
  }, []);

  const displayedServices = category
    ? services.filter((s) => s.category === category)
    : services;

  return (
    <div className="section-spacing bg-[#F7F8FA] min-h-[70vh]">
      <div className="site-container space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-xl space-y-2">
            <h1 className="h1-title">{meta ? meta.title : 'Full-Spectrum Event Services'}</h1>
            <p className="body-text">
              {meta
                ? meta.subtitle
                : 'Pair your hall reservation with curated culinary, floral, security, and audio-visual production.'}
            </p>
          </div>
          {category && (
            <Link
              to="/services"
              className="text-[15px] font-medium text-[#45459E] hover:text-[#201853] whitespace-nowrap"
            >
              View all services &rarr;
            </Link>
          )}
        </div>

        {/* Category Filter Tabs */}
        <div className="flex flex-wrap gap-2">
          <Link
            to="/services"
            className={`px-4 py-2 rounded-[10px] text-[14px] font-medium transition-colors ${
              !category
                ? 'bg-[#201853] text-white'
                : 'bg-white text-[#6B7280] hover:text-[#201853]'
            }`}
          >
            All Services
          </Link>
          {Object.entries(CATEGORY_META).map(([slug, info]) => (
            <Link
              key={slug}
              to={`/services/${slug}`}
              className={`px-4 py-2 rounded-[10px] text-[14px] font-medium transition-colors ${
                category === slug
                  ? 'bg-[#201853] text-white'
                  : 'bg-white text-[#6B7280] hover:text-[#201853]'
              }`}
            >
              {info.title.replace(' Services', '').replace(' Production', '')}
            </Link>
          ))}
        </div>

        {meta && (
          <div className="card-surface overflow-hidden grid grid-cols-1 lg:grid-cols-2 items-stretch">
            <div className="aspect-[16/10] lg:aspect-auto lg:h-full">
              <SafeImage src={meta.image} alt={meta.title} className="w-full h-full object-cover" />
            </div>
            <div className="p-8 md:p-10 flex flex-col justify-center space-y-4">
              <h2 className="h2-title">{meta.title}</h2>
              <p className="body-text">{meta.subtitle}</p>
              <p className="small-text">
                Included seamlessly during our 3-step booking flow. Dedicated coordination begins immediately once your date is confirmed.
              </p>
              <div className="pt-2">
                <button type="button" onClick={() => navigateToBook()} className="btn-primary">
                  Book Hall
                </button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="card-surface h-48 animate-pulse bg-white" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(displayedServices.length > 0 ? displayedServices : services).map((svc) => (
              <div key={svc.id} className="card-surface p-6 md:p-8 flex flex-col justify-between gap-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="w-12 h-12 rounded-[12px] bg-[#F7F8FA] text-[#201853] flex items-center justify-center shrink-0">
                      {renderServiceIcon(svc.icon)}
                    </div>
                    <div className="text-[22px] font-bold text-[#201853] tabular-nums">
                      ${svc.price.toLocaleString()}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="h3-title">{svc.name}</h3>
                    <p className="body-text">{svc.description}</p>
                  </div>
                </div>
                <div>
                  <button type="button" onClick={() => navigateToBook()} className="btn-primary">
                    Book Hall
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
