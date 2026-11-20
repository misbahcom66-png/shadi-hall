import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useLocation, useSearchParams } from 'react-router-dom';
import { Calendar, CheckCircle2, Clock, Users, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useToast } from '../context/ToastContext.tsx';
import { apiRequest } from '../lib/api.ts';
import type { BookedSlot, Booking, Hall, ServiceItem } from '../types.ts';
import { AvailabilityCalendar } from '../components/AvailabilityCalendar.tsx';
import { usePageSeo } from '../config/site.ts';

const EVENT_TYPES = [
  'Wedding Reception',
  'Ceremony & Banquet',
  'Engagement Gala',
  'Corporate Annual Dinner',
  'Family Milestone Celebration',
];

export function BookHallPage() {
  usePageSeo('Book Hall', 'Reserve your event hall, date, time slot, and optional services online.');
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [halls, setHalls] = useState<Hall[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [bookedSlots, setBookedSlots] = useState<BookedSlot[]>([]);

  const initialHallId = Number(searchParams.get('hallId')) || 1;
  const [hallId, setHallId] = useState<number>(initialHallId);
  const [eventType, setEventType] = useState(EVENT_TYPES[0]);
  const [eventDate, setEventDate] = useState('');
  const [startTime, setStartTime] = useState('17:00');
  const [endTime, setEndTime] = useState('22:00');
  const [guests, setGuests] = useState<number>(150);
  const [selectedServiceIds, setSelectedServiceIds] = useState<number[]>([]);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);

  useEffect(() => {
    Promise.all([
      apiRequest<{ halls: Hall[] }>('/api/halls'),
      apiRequest<{ services: ServiceItem[] }>('/api/services'),
    ]).then(([hRes, sRes]) => {
      setHalls(hRes.halls);
      setServices(sRes.services);
      if (hRes.halls.length > 0 && !hRes.halls.some((h) => h.id === initialHallId)) {
        setHallId(hRes.halls[0].id);
      }
    });
  }, [initialHallId]);

  useEffect(() => {
    if (!hallId) return;
    apiRequest<{ bookedSlots: BookedSlot[] }>(`/api/halls/${hallId}`)
      .then((res) => setBookedSlots(res.bookedSlots))
      .catch(() => setBookedSlots([]));
  }, [hallId]);

  const selectedHall = useMemo(() => halls.find((h) => h.id === hallId) || null, [halls, hallId]);

  const selectedServices = useMemo(
    () => services.filter((s) => selectedServiceIds.includes(s.id)),
    [services, selectedServiceIds]
  );

  const totalPrice = useMemo(() => {
    const base = selectedHall ? Number(selectedHall.price) : 0;
    const extras = selectedServices.reduce((sum, s) => sum + Number(s.price), 0);
    return base + extras;
  }, [selectedHall, selectedServices]);

  const slotConflict = useMemo(() => {
    if (!eventDate || !startTime || !endTime || startTime >= endTime) return false;
    return bookedSlots.some(
      (slot) =>
        slot.event_date === eventDate &&
        slot.start_time < endTime &&
        slot.end_time > startTime
    );
  }, [bookedSlots, eventDate, startTime, endTime]);

  if (authLoading) {
    return (
      <div className="section-spacing site-container">
        <div className="card-surface h-64 animate-pulse bg-[#F7F8FA]" />
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: `${location.pathname}${location.search}`,
          bookingMessage: 'Please login to book a hall',
        }}
      />
    );
  }

  const toggleService = (id: number) => {
    setSelectedServiceIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleProceedToReview = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedHall) {
      setError('Please select a hall.');
      return;
    }
    if (!eventDate) {
      setError('Please select an event date from the calendar.');
      return;
    }
    if (startTime >= endTime) {
      setError('End time must be later than start time.');
      return;
    }
    if (guests < 10 || guests > selectedHall.capacity) {
      setError(`Guest count must be between 10 and ${selectedHall.capacity} for ${selectedHall.name}.`);
      return;
    }
    if (slotConflict) {
      setError('This hall is already reserved during your selected time slot. Please choose another time.');
      return;
    }

    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleConfirmBooking = async () => {
    setError('');
    setSubmitting(true);
    try {
      const res = await apiRequest<{ booking: Booking }>('/api/bookings', {
        method: 'POST',
        body: JSON.stringify({
          hallId,
          eventType,
          eventDate,
          startTime,
          endTime,
          guests,
          serviceIds: selectedServiceIds,
          notes,
        }),
      });
      setConfirmedBooking(res.booking);
      setStep(3);
      showToast('Booking submitted successfully!', 'success');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError((err as Error).message);
      setStep(1);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="section-spacing bg-[#F7F8FA] min-h-[75vh]">
      <div className="site-container space-y-8">
        <div className="max-w-xl space-y-2">
          <h1 className="h1-title">Book Your Event Hall</h1>
          <p className="body-text">
            Complete the three steps below to lock in your venue date and services.
          </p>
        </div>

        {/* 3-Step Progress Indicator */}
        <div className="card-surface p-5">
          <div className="grid grid-cols-3 gap-4">
            {[
              { num: 1, label: '1. Details' },
              { num: 2, label: '2. Review' },
              { num: 3, label: '3. Confirm' },
            ].map((item) => {
              const active = step === item.num;
              const completed = step > item.num;
              return (
                <div
                  key={item.num}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-[10px] text-[14px] md:text-[15px] font-medium transition-colors ${
                    active
                      ? 'bg-[#201853] text-white'
                      : completed
                      ? 'bg-[#EDEFF7] text-[#201853]'
                      : 'bg-[#F7F8FA] text-[#6B7280]'
                  }`}
                >
                  <span>{item.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {error && (
          <div role="alert" className="p-4 rounded-[12px] bg-red-50 border border-red-200 text-red-700 text-[15px] flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" strokeWidth={1.75} />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: DETAILS */}
        {step === 1 && (
          <form onSubmit={handleProceedToReview} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 space-y-6">
              {/* Hall & Event Type */}
              <div className="card-surface p-6 md:p-8 space-y-5">
                <h2 className="h3-title">Venue &amp; Event Details</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label htmlFor="book-hall" className="block text-[14px] font-medium text-[#1F2937]">
                      Select Hall
                    </label>
                    <select
                      id="book-hall"
                      value={hallId}
                      onChange={(e) => setHallId(Number(e.target.value))}
                      className="input-field"
                    >
                      {halls.map((h) => (
                        <option key={h.id} value={h.id}>
                          {h.name} (Up to {h.capacity} guests — ${h.price.toLocaleString()})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="book-event-type" className="block text-[14px] font-medium text-[#1F2937]">
                      Event Type
                    </label>
                    <select
                      id="book-event-type"
                      value={eventType}
                      onChange={(e) => setEventType(e.target.value)}
                      className="input-field"
                    >
                      {EVENT_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="book-guests" className="block text-[14px] font-medium text-[#1F2937]">
                    Estimated Number of Guests{' '}
                    {selectedHall && (
                      <span className="text-[#6B7280] font-normal">
                        (Max {selectedHall.capacity})
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <Users
                      className="w-4 h-4 text-[#6B7280] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                      strokeWidth={1.75}
                    />
                    <input
                      id="book-guests"
                      type="number"
                      min={10}
                      max={selectedHall?.capacity || 1000}
                      value={guests}
                      onChange={(e) => setGuests(Number(e.target.value))}
                      className="input-field pl-10 tabular-nums"
                    />
                  </div>
                </div>
              </div>

              {/* Calendar & Time Slot */}
              <div className="card-surface p-6 md:p-8 space-y-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="h3-title">Select Event Date &amp; Time</h2>
                    <p className="small-text">Booked dates and overlapping time slots are blocked automatically.</p>
                  </div>
                  {eventDate && (
                    <span className="text-[14px] font-semibold text-[#201853] tabular-nums">
                      Selected: {eventDate}
                    </span>
                  )}
                </div>

                <AvailabilityCalendar
                  bookedSlots={bookedSlots}
                  selectedDate={eventDate}
                  onSelectDate={setEventDate}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
                  <div className="space-y-1.5">
                    <label htmlFor="book-start" className="block text-[14px] font-medium text-[#1F2937]">
                      Start Time
                    </label>
                    <input
                      id="book-start"
                      type="time"
                      required
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="input-field tabular-nums"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="book-end" className="block text-[14px] font-medium text-[#1F2937]">
                      End Time
                    </label>
                    <input
                      id="book-end"
                      type="time"
                      required
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="input-field tabular-nums"
                    />
                  </div>
                </div>

                {slotConflict && (
                  <div className="p-3.5 rounded-[10px] bg-red-50 border border-red-200 text-red-700 text-[14px] flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                    <span>Selected hours overlap an existing reservation on {eventDate}. Please pick another time.</span>
                  </div>
                )}
              </div>

              {/* Extra Services & Notes */}
              <div className="card-surface p-6 md:p-8 space-y-5">
                <h2 className="h3-title">Optional Services &amp; Notes</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {services.map((svc) => {
                    const checked = selectedServiceIds.includes(svc.id);
                    return (
                      <label
                        key={svc.id}
                        className={`p-4 rounded-[12px] border cursor-pointer transition-colors flex items-start gap-3 ${
                          checked
                            ? 'border-[#201853] bg-[#F7F8FA]'
                            : 'border-gray-200 hover:border-[#4A55A2]'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleService(svc.id)}
                          className="mt-1 w-4 h-4 accent-[#201853]"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[15px] font-medium text-[#1F2937]">{svc.name}</span>
                            <span className="text-[14px] font-semibold text-[#201853] tabular-nums">
                              +${svc.price.toLocaleString()}
                            </span>
                          </div>
                          <p className="text-[13px] text-[#6B7280] mt-1">{svc.description}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>

                <div className="space-y-1.5 pt-2">
                  <label htmlFor="book-notes" className="block text-[14px] font-medium text-[#1F2937]">
                    Additional Notes (Optional)
                  </label>
                  <textarea
                    id="book-notes"
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Dietary notes, stage setup preferences, or special requests..."
                    className="input-field py-3"
                  />
                </div>
              </div>
            </div>

            {/* Live Price Summary Sidebar */}
            <aside className="lg:col-span-4 card-surface p-6 md:p-8 space-y-6 lg:sticky lg:top-24">
              <h2 className="h3-title">Live Price Summary</h2>

              <div className="space-y-3 text-[15px] border-b border-gray-100 pb-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[#6B7280]">{selectedHall?.name || 'Hall Rental'}</span>
                  <span className="font-semibold text-[#1F2937] tabular-nums">
                    ${(selectedHall?.price || 0).toLocaleString()}
                  </span>
                </div>

                {selectedServices.map((svc) => (
                  <div key={svc.id} className="flex items-center justify-between gap-2 text-[14px]">
                    <span className="text-[#6B7280]">{svc.name}</span>
                    <span className="font-medium text-[#1F2937] tabular-nums">
                      +${svc.price.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-2 text-[14px] text-[#6B7280]">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#45459E]" strokeWidth={1.75} />
                  <span>{eventDate || 'Choose a date'}</span>
                </div>
                <div className="flex items-center gap-2 tabular-nums">
                  <Clock className="w-4 h-4 text-[#45459E]" strokeWidth={1.75} />
                  <span>
                    {startTime} – {endTime}
                  </span>
                </div>
                <div className="flex items-center gap-2 tabular-nums">
                  <Users className="w-4 h-4 text-[#45459E]" strokeWidth={1.75} />
                  <span>{guests} Guests</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <span className="text-[16px] font-semibold text-[#1F2937]">Estimated Total</span>
                <span className="text-[26px] font-bold text-[#201853] tabular-nums">
                  ${totalPrice.toLocaleString()}
                </span>
              </div>

              <button type="submit" disabled={slotConflict} className="btn-primary w-full">
                Continue to Review
              </button>
            </aside>
          </form>
        )}

        {/* STEP 2: REVIEW */}
        {step === 2 && selectedHall && (
          <div className="card-surface max-w-3xl mx-auto p-6 md:p-10 space-y-6">
            <h2 className="h2-title">Review Your Reservation</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-4 border-y border-gray-100 text-[15px]">
              <div>
                <div className="small-text">Selected Hall</div>
                <div className="font-semibold text-[#1F2937]">{selectedHall.name}</div>
              </div>
              <div>
                <div className="small-text">Event Type</div>
                <div className="font-semibold text-[#1F2937]">{eventType}</div>
              </div>
              <div>
                <div className="small-text">Event Date &amp; Hours</div>
                <div className="font-semibold text-[#1F2937] tabular-nums">
                  {eventDate} &middot; {startTime} – {endTime}
                </div>
              </div>
              <div>
                <div className="small-text">Estimated Guests</div>
                <div className="font-semibold text-[#1F2937] tabular-nums">{guests} Guests</div>
              </div>
              <div className="sm:col-span-2">
                <div className="small-text">Selected Extra Services</div>
                <div className="font-medium text-[#1F2937]">
                  {selectedServices.length > 0
                    ? selectedServices.map((s) => `${s.name} ($${s.price.toLocaleString()})`).join(', ')
                    : 'None selected'}
                </div>
              </div>
              {notes && (
                <div className="sm:col-span-2">
                  <div className="small-text">Notes</div>
                  <div className="text-[#1F2937]">{notes}</div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <span className="h3-title">Total Booking Price</span>
              <span className="text-[28px] font-bold text-[#201853] tabular-nums">
                ${totalPrice.toLocaleString()}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-[15px] font-medium text-[#45459E] hover:text-[#201853] min-h-[44px] px-4 cursor-pointer"
              >
                &larr; Edit Booking Details
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleConfirmBooking}
                className="btn-primary w-full sm:w-auto"
              >
                {submitting ? 'Confirming Reservation...' : 'Confirm Booking'}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: CONFIRMATION */}
        {step === 3 && confirmedBooking && (
          <div className="card-surface max-w-2xl mx-auto p-8 md:p-12 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" strokeWidth={1.75} />
            </div>
            <div className="space-y-2">
              <h2 className="h2-title">Reservation Submitted</h2>
              <p className="body-text">
                Thank you, {user.name}. Your booking reference is{' '}
                <strong className="text-[#201853] tabular-nums">#{confirmedBooking.id}</strong> and is currently{' '}
                <strong className="text-[#201853] capitalize">{confirmedBooking.status}</strong>.
              </p>
            </div>

            <div className="rounded-[12px] bg-[#F7F8FA] p-5 text-left grid grid-cols-1 sm:grid-cols-2 gap-4 text-[14px]">
              <div>
                <div className="text-[#6B7280]">Hall</div>
                <div className="font-semibold text-[#1F2937]">{confirmedBooking.hall_name}</div>
              </div>
              <div>
                <div className="text-[#6B7280]">Date &amp; Time</div>
                <div className="font-semibold text-[#1F2937] tabular-nums">
                  {confirmedBooking.event_date} ({confirmedBooking.start_time} – {confirmedBooking.end_time})
                </div>
              </div>
              <div>
                <div className="text-[#6B7280]">Guests</div>
                <div className="font-semibold text-[#1F2937] tabular-nums">{confirmedBooking.guests}</div>
              </div>
              <div>
                <div className="text-[#6B7280]">Total Amount</div>
                <div className="font-semibold text-[#201853] tabular-nums">
                  ${confirmedBooking.total_price.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Link to="/my-bookings" className="btn-primary w-full sm:w-auto">
                View My Bookings
              </Link>
              <Link
                to="/"
                className="text-[15px] font-medium text-[#45459E] hover:text-[#201853] min-h-[44px] inline-flex items-center px-4"
              >
                Return Home
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
