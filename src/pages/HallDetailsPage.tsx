import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Check, Users, Calendar } from 'lucide-react';
import { apiRequest } from '../lib/api.ts';
import type { BookedSlot, Hall } from '../types.ts';
import { SafeImage } from '../components/SafeImage.tsx';
import { AvailabilityCalendar } from '../components/AvailabilityCalendar.tsx';
import { useBookHallNavigation } from '../hooks/useBookHallNavigation.ts';
import { usePageSeo } from '../config/site.ts';

export function HallDetailsPage() {
  const { id } = useParams();
  const navigateToBook = useBookHallNavigation();

  const [hall, setHall] = useState<Hall | null>(null);
  const [bookedSlots, setBookedSlots] = useState<BookedSlot[]>([]);
  const [activeImage, setActiveImage] = useState<string>('');
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  usePageSeo(
    hall ? hall.name : 'Hall Details',
    hall ? hall.description : 'Explore hall capacity, amenities, photo gallery, and availability calendar.'
  );

  useEffect(() => {
    setLoading(true);
    setError('');
    apiRequest<{ hall: Hall; bookedSlots: BookedSlot[] }>(`/api/halls/${id}`)
      .then((res) => {
        setHall(res.hall);
        setBookedSlots(res.bookedSlots);
        setActiveImage(res.hall.images?.[0] || res.hall.image_url);
      })
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="section-spacing site-container">
        <div className="card-surface h-[460px] animate-pulse bg-[#F7F8FA]" />
      </div>
    );
  }

  if (error || !hall) {
    return (
      <div className="section-spacing site-container">
        <div className="card-surface p-10 text-center space-y-4">
          <h1 className="h2-title">Hall Not Found</h1>
          <p className="body-text">{error || 'This hall could not be located.'}</p>
          <Link to="/halls" className="btn-primary">
            Back to All Halls
          </Link>
        </div>
      </div>
    );
  }

  const amenities = hall.amenities
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  return (
    <div className="section-spacing bg-[#F7F8FA]">
      <div className="site-container space-y-10">
        <div>
          <Link
            to="/halls"
            className="inline-flex items-center gap-2 text-[15px] font-medium text-[#45459E] hover:text-[#201853]"
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={1.75} />
            <span>Back to All Halls</span>
          </Link>
        </div>

        {/* Gallery + Primary Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 space-y-4">
            <div className="card-surface overflow-hidden aspect-[16/10]">
              <SafeImage
                src={activeImage || hall.image_url}
                alt={hall.name}
                className="w-full h-full object-cover"
              />
            </div>

            {hall.images && hall.images.length > 1 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {hall.images.map((imgUrl, index) => (
                  <button
                    key={`${imgUrl}-${index}`}
                    type="button"
                    onClick={() => setActiveImage(imgUrl)}
                    className={`rounded-[12px] overflow-hidden aspect-[4/3] border-2 transition-all cursor-pointer ${
                      activeImage === imgUrl
                        ? 'border-[#201853]'
                        : 'border-transparent opacity-75 hover:opacity-100'
                    }`}
                  >
                    <SafeImage
                      src={imgUrl}
                      alt={`${hall.name} view ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-5 card-surface p-6 md:p-8 space-y-6">
            <div className="space-y-3">
              <h1 className="h1-title">{hall.name}</h1>
              <div className="flex flex-wrap items-center gap-4 text-[16px] tabular-nums">
                <span className="inline-flex items-center gap-2 text-[#1F2937] font-medium">
                  <Users className="w-5 h-5 text-[#45459E]" strokeWidth={1.75} />
                  Capacity: {hall.capacity} Guests
                </span>
                <span aria-hidden="true" className="text-gray-300">|</span>
                <span className="text-[24px] font-bold text-[#201853]">
                  ${hall.price.toLocaleString()}
                </span>
              </div>
            </div>

            <p className="body-text">{hall.description}</p>

            <div className="space-y-3 pt-4 border-t border-gray-100">
              <h2 className="h3-title">Included Amenities</h2>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {amenities.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-[14px] text-[#1F2937]">
                    <Check className="w-4 h-4 text-[#45459E] shrink-0 mt-0.5" strokeWidth={1.75} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => navigateToBook(hall.id)}
                className="btn-primary w-full"
              >
                Book Hall
              </button>
            </div>
          </div>
        </div>

        {/* Availability Calendar */}
        <div className="card-surface p-6 md:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 text-[14px] font-medium text-[#45459E]">
                <Calendar className="w-4 h-4" strokeWidth={1.75} />
                <span>Live Schedule</span>
              </div>
              <h2 className="h2-title">Hall Availability Calendar</h2>
              <p className="small-text">
                Select any date below to inspect reserved time slots before booking.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigateToBook(hall.id)}
              className="btn-primary"
            >
              Book Hall
            </button>
          </div>

          <AvailabilityCalendar
            bookedSlots={bookedSlots}
            selectedDate={selectedCalendarDate}
            onSelectDate={setSelectedCalendarDate}
          />
        </div>
      </div>
    </div>
  );
}
