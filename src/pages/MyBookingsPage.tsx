import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { Calendar, Clock, Users, CheckCircle2, Hourglass, XCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useToast } from '../context/ToastContext.tsx';
import { apiRequest } from '../lib/api.ts';
import type { Booking } from '../types.ts';
import { SafeImage } from '../components/SafeImage.tsx';
import { usePageSeo } from '../config/site.ts';

function StatusLabel({ status }: { status: Booking['status'] }) {
  if (status === 'confirmed') {
    return (
      <span className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-emerald-700">
        <CheckCircle2 className="w-4 h-4" strokeWidth={1.75} />
        <span>Confirmed</span>
      </span>
    );
  }
  if (status === 'cancelled') {
    return (
      <span className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-red-700">
        <XCircle className="w-4 h-4" strokeWidth={1.75} />
        <span>Cancelled</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-amber-700">
      <Hourglass className="w-4 h-4" strokeWidth={1.75} />
      <span>Pending</span>
    </span>
  );
}

export function MyBookingsPage() {
  usePageSeo('My Bookings', 'View and manage your hall reservations.');
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const location = useLocation();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmCancelId, setConfirmCancelId] = useState<number | null>(null);

  const loadBookings = () => {
    setLoading(true);
    apiRequest<{ bookings: Booking[] }>('/api/bookings/my')
      .then((res) => setBookings(res.bookings))
      .catch(() => setBookings([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (user) loadBookings();
  }, [user]);

  if (authLoading) {
    return (
      <div className="section-spacing site-container">
        <div className="card-surface h-48 animate-pulse bg-[#F7F8FA]" />
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname, bookingMessage: 'Please login to view your bookings.' }}
      />
    );
  }

  const handleCancel = async (id: number) => {
    try {
      await apiRequest(`/api/bookings/${id}/cancel`, { method: 'PATCH' });
      showToast('Booking cancelled.', 'info');
      setConfirmCancelId(null);
      loadBookings();
    } catch (err) {
      showToast((err as Error).message, 'error');
    }
  };

  return (
    <div className="section-spacing bg-[#F7F8FA] min-h-[75vh]">
      <div className="site-container space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1">
            <h1 className="h1-title">My Bookings</h1>
            <p className="body-text">Welcome back, {user.name}. Track your upcoming event reservations.</p>
          </div>
          <Link to="/book" className="btn-primary">
            Book Hall
          </Link>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((n) => (
              <div key={n} className="card-surface h-40 animate-pulse bg-white" />
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <div className="card-surface p-12 text-center space-y-4">
            <h2 className="h3-title">No Bookings Yet</h2>
            <p className="body-text">You haven&apos;t reserved any halls yet. Check availability to get started.</p>
            <Link to="/book" className="btn-primary">
              Book Hall
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {bookings.map((b) => (
              <article
                key={b.id}
                className="card-surface overflow-hidden grid grid-cols-1 md:grid-cols-12 items-stretch"
              >
                <div className="md:col-span-4 aspect-[16/10] md:aspect-auto">
                  <SafeImage
                    src={b.hall_image}
                    alt={b.hall_name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="md:col-span-8 p-6 flex flex-col justify-between gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div>
                      <div className="small-text tabular-nums">
                        Booking #{b.id} &middot; {b.event_type}
                      </div>
                      <h2 className="h3-title mt-0.5">{b.hall_name}</h2>
                    </div>
                    <StatusLabel status={b.status} />
                  </div>

                  <div className="flex flex-wrap gap-x-6 gap-y-2 text-[14px] text-[#6B7280] tabular-nums">
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-[#45459E]" strokeWidth={1.75} />
                      {b.event_date}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-[#45459E]" strokeWidth={1.75} />
                      {b.start_time} – {b.end_time}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-[#45459E]" strokeWidth={1.75} />
                      {b.guests} Guests
                    </span>
                  </div>

                  {b.services.length > 0 && (
                    <div className="small-text">
                      <strong className="text-[#1F2937]">Services:</strong>{' '}
                      {b.services.map((s) => s.name).join(', ')}
                    </div>
                  )}

                  <div className="pt-3 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="text-[20px] font-bold text-[#201853] tabular-nums">
                      Total: ${b.total_price.toLocaleString()}
                    </div>

                    {b.status !== 'cancelled' && (
                      <div>
                        {confirmCancelId === b.id ? (
                          <div className="flex items-center gap-3">
                            <span className="small-text text-red-700 font-medium">Cancel this booking?</span>
                            <button
                              type="button"
                              onClick={() => handleCancel(b.id)}
                              className="btn-primary"
                            >
                              Confirm Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmCancelId(null)}
                              className="text-[14px] font-medium text-[#6B7280] hover:text-[#1F2937] px-2 py-2 cursor-pointer"
                            >
                              Keep
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmCancelId(b.id)}
                            className="btn-primary"
                          >
                            Cancel Booking
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
