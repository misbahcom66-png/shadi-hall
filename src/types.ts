export interface Hall {
  id: number;
  name: string;
  description: string;
  capacity: number;
  price: number;
  image_url: string;
  amenities: string;
  status: 'active' | 'maintenance';
  created_at: string;
  images: string[];
}

export interface BookedSlot {
  event_date: string;
  start_time: string;
  end_time: string;
  status: string;
}

export interface ServiceItem {
  id: number;
  name: string;
  description: string;
  price: number;
  icon: string;
  category: string;
}

export interface Booking {
  id: number;
  user_id: number;
  hall_id: number;
  event_type: string;
  event_date: string;
  start_time: string;
  end_time: string;
  guests: number;
  total_price: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  notes: string;
  created_at: string;
  hall_name: string;
  hall_image: string;
  user_name: string;
  user_email: string;
  user_phone: string;
  services: ServiceItem[];
}

export interface ContactMessage {
  id: number;
  name: string;
  email: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface CustomerSummary {
  id: number;
  name: string;
  email: string;
  phone: string;
  created_at: string;
  booking_count: number;
}

export interface ActivityLog {
  id: number;
  admin_id: number | null;
  admin_name: string;
  action: string;
  ip_address: string;
  created_at: string;
}
