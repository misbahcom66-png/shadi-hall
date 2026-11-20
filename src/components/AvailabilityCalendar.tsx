import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import type { BookedSlot } from '../types.ts';

interface AvailabilityCalendarProps {
  bookedSlots: BookedSlot[];
  selectedDate?: string;
  onSelectDate?: (date: string) => void;
  interactive?: boolean;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function AvailabilityCalendar({
  bookedSlots,
  selectedDate,
  onSelectDate,
  interactive = true,
}: AvailabilityCalendarProps) {
  const today = useMemo(() => new Date(), []);
  const todayStr = today.toISOString().slice(0, 10);

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const startDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();

  const slotsByDate = useMemo(() => {
    const map = new Map<string, BookedSlot[]>();
    for (const slot of bookedSlots) {
      const list = map.get(slot.event_date) || [];
      list.push(slot);
      map.set(slot.event_date, list);
    }
    return map;
  }, [bookedSlots]);

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const selectedDaySlots = selectedDate ? slotsByDate.get(selectedDate) || [] : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="h3-title text-[#1F2937]">{monthLabel}</h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrevMonth}
            aria-label="Previous month"
            className="w-10 h-10 rounded-[10px] border border-gray-200 flex items-center justify-center text-[#201853] hover:bg-[#F7F8FA] transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" strokeWidth={1.75} />
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            aria-label="Next month"
            className="w-10 h-10 rounded-[10px] border border-gray-200 flex items-center justify-center text-[#201853] hover:bg-[#F7F8FA] transition-colors cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" strokeWidth={1.75} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((day) => (
          <div key={day} className="py-2 text-[14px] font-medium text-[#6B7280]">
            {day}
          </div>
        ))}

        {Array.from({ length: startDayOfWeek }).map((_, idx) => (
          <div key={`empty-${idx}`} className="h-11" />
        ))}

        {Array.from({ length: daysInMonth }).map((_, idx) => {
          const dayNum = idx + 1;
          const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
          const isPast = dateStr < todayStr;
          const daySlots = slotsByDate.get(dateStr) || [];
          const hasBookings = daySlots.length > 0;
          const isFullDayBooked = daySlots.some((s) => s.start_time <= '09:00' && s.end_time >= '22:00') || daySlots.length >= 2;
          const isSelected = selectedDate === dateStr;
          const disabled = isPast || isFullDayBooked;

          return (
            <button
              key={dateStr}
              type="button"
              disabled={disabled || !interactive}
              onClick={() => interactive && onSelectDate?.(dateStr)}
              title={
                isPast
                  ? 'Past date'
                  : isFullDayBooked
                  ? 'Fully booked'
                  : hasBookings
                  ? `${daySlots.length} slot(s) reserved`
                  : 'Available'
              }
              className={`h-11 rounded-[10px] text-[14px] font-medium tabular-nums flex flex-col items-center justify-center transition-colors ${
                isSelected
                  ? 'bg-[#201853] text-white'
                  : disabled
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed line-through'
                  : hasBookings
                  ? 'bg-[#EDEFF7] text-[#201853] hover:bg-[#4A55A2] hover:text-white cursor-pointer'
                  : interactive
                  ? 'bg-[#F7F8FA] text-[#1F2937] hover:bg-[#45459E] hover:text-white cursor-pointer'
                  : 'bg-[#F7F8FA] text-[#1F2937]'
              }`}
            >
              <span>{dayNum}</span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-4 pt-2 text-[14px] text-[#6B7280]">
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded bg-[#F7F8FA] border border-gray-300 inline-block" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded bg-[#EDEFF7] border border-[#4A55A2]/30 inline-block" />
          <span>Partial Slots Booked</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded bg-gray-200 inline-block" />
          <span>Unavailable / Fully Booked</span>
        </div>
      </div>

      {selectedDate && selectedDaySlots.length > 0 && (
        <div className="rounded-[12px] bg-[#F7F8FA] p-4 space-y-2">
          <div className="flex items-center gap-2 text-[14px] font-semibold text-[#201853]">
            <Clock className="w-4 h-4" strokeWidth={1.75} />
            <span>Reserved Time Slots on {selectedDate}</span>
          </div>
          <ul className="space-y-1 text-[14px] text-[#6B7280] tabular-nums">
            {selectedDaySlots.map((slot, i) => (
              <li key={i}>
                {slot.start_time} – {slot.end_time} ({slot.status})
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
