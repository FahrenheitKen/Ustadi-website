// User Types
export interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  image: string | null;
  role: 'CUSTOMER' | 'ADMIN';
  email_verified_at: string | null;
  created_at?: string;
}

// Film Types
export interface Film {
  id: string;
  title: string;
  slug: string;
  synopsis: string;
  poster_url: string | null;
  trailer_url: string | null;
  video_url?: string;
  price: number;
  duration_mins: number | null;
  release_year: number | null;
  rating: string | null;
  is_published?: boolean;
  is_featured?: boolean;
  genres: Genre[];
  director?: Person | null;
  cast?: Person[];
  average_rating?: number | null;
  review_count?: number;
  reviews?: Review[];
  created_at?: string;
  updated_at?: string;
}

export interface FilmCard {
  id: string;
  title: string;
  slug: string;
  poster_url: string | null;
  trailer_url: string | null;
  price: number;
  release_year: number | null;
  rating: string | null;
  genres: string[];
}

// Genre Types
export interface Genre {
  id: string;
  name: string;
  slug: string;
  film_count?: number;
}

// Person Types (Cast/Crew)
export interface Person {
  id: string;
  name: string;
  photo_url: string | null;
  bio?: string | null;
  character_name?: string | null;
}

// Credit Types
export interface FilmCredit {
  id: string;
  person_id: string;
  person: Person;
  role: string;
  character_name: string | null;
  order: number;
}

// Rental Types
export interface Rental {
  id: string;
  film: Film | FilmCard;
  amount: number;
  status: 'NOT_STARTED' | 'ACTIVE' | 'EXPIRED';
  first_played: string | null;
  access_expires: string | null;
  remaining_hours: number | null;
  created_at: string;
}

export interface RentalAccess {
  has_access: boolean;
  rental: {
    id: string;
    status: 'NOT_STARTED' | 'ACTIVE' | 'EXPIRED';
    first_played: string | null;
    access_expires: string | null;
    remaining_hours: number | null;
  } | null;
}

// Transaction Types
export type PaymentGateway = 'mpesa' | 'paystack';

export interface Transaction {
  id: string;
  user?: User;
  film?: Film;
  rental?: Rental;
  gateway: PaymentGateway;
  phone: string;
  amount: number;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
  mpesa_receipt: string | null;
  checkout_request_id: string | null;
  paystack_reference: string | null;
  result_desc: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentGatewayOption {
  id: PaymentGateway;
  name: string;
  description: string;
  public_key?: string;
}

// Review Types
export interface Review {
  id: string;
  rating: number;
  title: string | null;
  content: string | null;
  created_at: string;
  user: {
    name: string;
    image: string | null;
  };
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface FilmsResponse {
  success: boolean;
  films: FilmCard[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface FilmResponse {
  success: boolean;
  film: Film;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user: User;
  token: string;
}

export interface PaymentInitiateResponse {
  success: boolean;
  message: string;
  transaction_id: string;
  checkout_request_id?: string;
}

export interface PaystackInitiateResponse {
  success: boolean;
  message: string;
  transaction_id: string;
  reference: string;
  public_key: string;
  amount: number; // in lowest currency unit (cents)
  email: string;
}

export interface PaymentStatusResponse {
  success: boolean;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
  message: string;
  gateway?: PaymentGateway;
  rental_id?: string;
  error?: string;
}

export interface PaystackVerifyResponse {
  success: boolean;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
  message: string;
  rental_id?: string;
}

export interface SignedUrlResponse {
  success: boolean;
  signed_url: string;
  expires_at: string;
  rental: {
    id: string;
    status: string;
    first_played: string | null;
    access_expires: string | null;
    remaining_hours: number | null;
  };
}

// Admin Types
export interface DashboardStats {
  total_films: number;
  published_films: number;
  total_users: number;
  total_rentals: number;
  revenue_30_days: number;
  rentals_30_days: number;
}

export interface Settings {
  site_name: string;
  contact_email: string;

  // Gateway toggles
  mpesa_enabled: boolean;
  paystack_enabled: boolean;

  // M-Pesa
  mpesa_env: 'sandbox' | 'production';
  mpesa_business_short_code: string;
  mpesa_callback_url: string;
  mpesa_consumer_key_set: boolean;
  mpesa_consumer_secret_set: boolean;
  mpesa_passkey_set: boolean;

  // Paystack
  paystack_callback_url: string;
  paystack_webhook_url: string;
  paystack_public_key_set: boolean;
  paystack_secret_key_set: boolean;
}
