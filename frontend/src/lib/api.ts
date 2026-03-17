import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';
import type {
  AuthResponse,
  Film,
  FilmCard,
  FilmsResponse,
  FilmResponse,
  Genre,
  PaymentInitiateResponse,
  PaymentStatusResponse,
  Rental,
  RentalAccess,
  Review,
  SignedUrlResponse,
  User,
} from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use((config) => {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
      return config;
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Clear token and redirect to login
          if (typeof window !== 'undefined') {
            localStorage.removeItem('auth_token');
            // Redirect to login if not already on login/register page
            const path = window.location.pathname;
            if (path !== '/login' && path !== '/register') {
              window.location.href = '/login';
            }
          }
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth
  async login(email: string, password: string): Promise<AuthResponse> {
    const { data } = await this.client.post('/auth/login', { email, password });
    return data;
  }

  async register(
    name: string,
    email: string,
    password: string,
    password_confirmation: string,
    phone?: string
  ): Promise<AuthResponse> {
    const { data } = await this.client.post('/auth/register', {
      name,
      email,
      password,
      password_confirmation,
      phone,
    });
    return data;
  }

  async logout(): Promise<void> {
    await this.client.post('/auth/logout');
  }

  async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    const { data } = await this.client.post('/auth/forgot-password', { email });
    return data;
  }

  async resetPassword(
    email: string,
    password: string,
    password_confirmation: string,
    token: string
  ): Promise<{ success: boolean; message: string }> {
    const { data } = await this.client.post('/auth/reset-password', {
      email,
      password,
      password_confirmation,
      token,
    });
    return data;
  }

  // User
  async getMe(): Promise<{ success: boolean; user: User }> {
    const { data } = await this.client.get('/user');
    return data;
  }

  async updateProfile(updates: Partial<User & { current_password?: string; password?: string; password_confirmation?: string }>): Promise<{ success: boolean; message: string; user: User }> {
    const { data } = await this.client.patch('/user', updates);
    return data;
  }

  // Films
  async getFilms(params?: {
    genre?: string;
    year?: number;
    search?: string;
    sort?: string;
    order?: 'asc' | 'desc';
    page?: number;
    per_page?: number;
  }): Promise<FilmsResponse> {
    const { data } = await this.client.get('/films', { params });
    return data;
  }

  async getFeaturedFilm(): Promise<FilmResponse> {
    const { data } = await this.client.get('/films/featured');
    return data;
  }

  async getNewReleases(limit?: number): Promise<{ success: boolean; films: FilmCard[] }> {
    const { data } = await this.client.get('/films/new-releases', { params: { limit } });
    return data;
  }

  async getPopularFilms(limit?: number): Promise<{ success: boolean; films: FilmCard[] }> {
    const { data } = await this.client.get('/films/popular', { params: { limit } });
    return data;
  }

  async getFilm(slug: string): Promise<FilmResponse> {
    const { data } = await this.client.get(`/films/${slug}`);
    return data;
  }

  // Genres
  async getGenres(): Promise<{ success: boolean; genres: Genre[] }> {
    const { data } = await this.client.get('/genres');
    return data;
  }

  async getGenreFilms(
    slug: string,
    params?: { page?: number; per_page?: number }
  ): Promise<{ success: boolean; genre: Genre; films: FilmCard[]; meta: any }> {
    const { data } = await this.client.get(`/genres/${slug}`, { params });
    return data;
  }

  // Rentals
  async getRentals(): Promise<{ success: boolean; rentals: Rental[] }> {
    const { data } = await this.client.get('/rentals');
    return data;
  }

  async checkAccess(filmId: string): Promise<{ success: boolean } & RentalAccess> {
    const { data } = await this.client.get(`/rentals/${filmId}/access`);
    return data;
  }

  async markRentalStarted(rentalId: string): Promise<{ success: boolean; message: string; rental: any }> {
    const { data } = await this.client.post(`/rentals/${rentalId}/started`);
    return data;
  }

  // Payments
  async initiatePayment(
    filmId: string,
    firstName: string,
    lastName: string,
    email: string,
    phone: string
  ): Promise<PaymentInitiateResponse> {
    const { data } = await this.client.post('/payments/initiate', {
      film_id: filmId,
      first_name: firstName,
      last_name: lastName,
      email,
      phone,
    });
    return data;
  }

  async checkPaymentStatus(transactionId: string): Promise<PaymentStatusResponse> {
    const { data } = await this.client.get(`/payments/status/${transactionId}`);
    return data;
  }

  // Videos
  async getSignedVideoUrl(filmId: string): Promise<SignedUrlResponse> {
    const { data } = await this.client.get('/videos/signed-url', {
      params: { film_id: filmId },
    });
    return data;
  }

  async getTrailerUrl(filmId: string): Promise<{ success: boolean; trailer_url: string; type: string }> {
    const { data } = await this.client.get(`/videos/trailer/${filmId}`);
    return data;
  }

  // Reviews
  async getReviews(
    filmId: string,
    params?: { page?: number; per_page?: number }
  ): Promise<{ success: boolean; reviews: Review[]; meta: any; average_rating: number | null }> {
    const { data } = await this.client.get(`/reviews/${filmId}`, { params });
    return data;
  }

  async createReview(
    filmId: string,
    rating: number,
    title?: string,
    content?: string
  ): Promise<{ success: boolean; message: string; review: Review }> {
    const { data } = await this.client.post('/reviews', {
      film_id: filmId,
      rating,
      title,
      content,
    });
    return data;
  }

  async getMyReview(filmId: string): Promise<{ success: boolean; review: Review | null }> {
    const { data } = await this.client.get(`/reviews/${filmId}/mine`);
    return data;
  }

  // Google OAuth redirect URL
  getGoogleAuthUrl(): string {
    return `${API_URL}/auth/google`;
  }

  // Upload poster image
  async uploadPoster(file: File, filmId?: string): Promise<{ success: boolean; url: string; path: string }> {
    const formData = new FormData();
    formData.append('file', file);
    if (filmId) formData.append('film_id', filmId);
    const { data } = await this.client.post('/admin/upload/poster', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  }

  // Admin - Dashboard
  async getAdminDashboard(): Promise<{
    success: boolean;
    stats: {
      total_films: number;
      published_films: number;
      total_users: number;
      total_rentals: number;
      revenue_30_days: number;
      rentals_30_days: number;
    };
    recent_transactions: any[];
  }> {
    const { data } = await this.client.get('/admin/dashboard');
    return data;
  }

  // Admin - Films
  async getAdminFilms(params?: {
    search?: string;
    status?: string;
    page?: number;
    per_page?: number;
  }): Promise<{
    success: boolean;
    films: Film[];
    meta: { current_page: number; last_page: number; per_page: number; total: number };
  }> {
    const { data } = await this.client.get('/admin/films', { params });
    return data;
  }

  async getAdminFilm(id: string): Promise<{ success: boolean; film: Film }> {
    const { data } = await this.client.get(`/admin/films/${id}`);
    return data;
  }

  async createFilm(filmData: Partial<Film>): Promise<{ success: boolean; message: string; film: Film }> {
    const { data } = await this.client.post('/admin/films', filmData);
    return data;
  }

  async updateFilm(id: string, filmData: Partial<Film>): Promise<{ success: boolean; message: string; film: Film }> {
    const { data } = await this.client.patch(`/admin/films/${id}`, filmData);
    return data;
  }

  async deleteFilm(id: string): Promise<{ success: boolean; message: string }> {
    const { data } = await this.client.delete(`/admin/films/${id}`);
    return data;
  }

  // Admin - Transactions
  async getAdminTransactions(params?: {
    status?: string;
    date_from?: string;
    date_to?: string;
    page?: number;
    per_page?: number;
  }): Promise<{
    success: boolean;
    transactions: any[];
    meta: { current_page: number; last_page: number; per_page: number; total: number };
  }> {
    const { data } = await this.client.get('/admin/transactions', { params });
    return data;
  }

  async exportTransactions(params?: {
    status?: string;
    date_from?: string;
    date_to?: string;
  }): Promise<Blob> {
    const { data } = await this.client.get('/admin/transactions/export', {
      params,
      responseType: 'blob',
    });
    return data;
  }

  // Admin - Users
  async getAdminUsers(params?: {
    search?: string;
    role?: string;
    page?: number;
    per_page?: number;
  }): Promise<{
    success: boolean;
    users: User[];
    meta: { current_page: number; last_page: number; per_page: number; total: number };
  }> {
    const { data } = await this.client.get('/admin/users', { params });
    return data;
  }

  async getAdminUser(id: string): Promise<{
    success: boolean;
    user: User;
    rentals: any[];
  }> {
    const { data } = await this.client.get(`/admin/users/${id}`);
    return data;
  }

  async updateAdminUser(id: string, updates: Partial<User & { is_active?: boolean }>): Promise<{
    success: boolean;
    message: string;
    user: User;
  }> {
    const { data } = await this.client.patch(`/admin/users/${id}`, updates);
    return data;
  }

  // Admin - Settings
  async getAdminSettings(): Promise<{
    success: boolean;
    settings: {
      site_name: string;
      contact_email: string;
      mpesa_env: 'sandbox' | 'production';
      mpesa_business_short_code: string;
      mpesa_callback_url: string;
      mpesa_consumer_key_set: boolean;
      mpesa_consumer_secret_set: boolean;
      mpesa_passkey_set: boolean;
    };
  }> {
    const { data } = await this.client.get('/admin/settings');
    return data;
  }

  async updateAdminSettings(settings: {
    site_name?: string;
    contact_email?: string;
    mpesa_env?: 'sandbox' | 'production';
    mpesa_business_short_code?: string;
    mpesa_consumer_key?: string;
    mpesa_consumer_secret?: string;
    mpesa_passkey?: string;
  }): Promise<{ success: boolean; message: string }> {
    const { data } = await this.client.patch('/admin/settings', settings);
    return data;
  }

  // Admin - Genres
  async createGenre(name: string): Promise<{ success: boolean; message: string; genre: Genre }> {
    const { data } = await this.client.post('/admin/genres', { name });
    return data;
  }

  async deleteGenre(id: string): Promise<{ success: boolean; message: string }> {
    const { data } = await this.client.delete(`/admin/genres/${id}`);
    return data;
  }
}

export const api = new ApiClient();
export default api;
