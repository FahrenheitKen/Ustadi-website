# Ustadi Films

A full-stack film rental platform for Kenyan cinema. Users can browse, rent, and stream films with M-Pesa payments. Built with **Laravel 12** (API) and **Next.js 16** (frontend).

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Local Installation](#local-installation)
  - [Prerequisites](#prerequisites)
  - [Option A: Docker (Recommended)](#option-a-docker-recommended)
  - [Option B: Manual Setup (Windows/Laragon)](#option-b-manual-setup-windowslaragon)
  - [Option C: Manual Setup (Mac/Linux)](#option-c-manual-setup-maclinux)
- [Production Deployment (Ubuntu + Nginx)](#production-deployment-ubuntu--nginx)
  - [1. Server Preparation](#1-server-preparation)
  - [2. Install Dependencies](#2-install-dependencies)
  - [3. Deploy Code](#3-deploy-code)
  - [4. Backend Setup (Laravel)](#4-backend-setup-laravel)
  - [5. Frontend Setup (Next.js)](#5-frontend-setup-nextjs)
  - [6. Nginx Configuration](#6-nginx-configuration)
  - [7. SSL Certificate (Let's Encrypt)](#7-ssl-certificate-lets-encrypt)
  - [8. Process Management (PM2 & Supervisor)](#8-process-management-pm2--supervisor)
  - [9. Firewall & Security](#9-firewall--security)
  - [10. Domain & DNS Setup](#10-domain--dns-setup)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Default Accounts](#default-accounts)
- [Architecture](#architecture)

---

## Features

### User Features
- **Authentication** — Email/password registration & login, Google OAuth, password reset
- **2-Device Limit** — Maximum 2 simultaneous sessions per account; oldest session auto-revoked
- **Film Browsing** — Search, filter by genre/year, sort by title/year/price/popularity
- **Film Details** — Synopsis, cast & crew, trailer (modal), star ratings & reviews
- **M-Pesa Payments** — Rent films via Safaricom STK Push (phone prompt)
- **48-Hour Rental** — Access starts on first play, countdown timer displayed
- **HLS Streaming** — Secure video playback with CloudFront signed URLs
- **My Library** — View active rentals, expired history, remaining access time
- **Reviews** — Rate (1-5 stars) and review rented films
- **Profile Management** — Update name, phone, password

### Admin Features
- **Dashboard** — Total films, users, rentals, revenue (last 30 days), top films
- **Film Management** — Create, edit, delete films; upload posters; attach genres & credits
- **User Management** — Search users, view rental history, activate/deactivate accounts
- **Transaction Management** — Filter by status/date/film, view M-Pesa receipts, export CSV
- **M-Pesa Settings** — Configure API credentials, test connection, switch sandbox/production

---

## Tech Stack

| Layer      | Technology                                                    |
|------------|---------------------------------------------------------------|
| Backend    | Laravel 12, PHP 8.2+, Laravel Sanctum                        |
| Frontend   | Next.js 16, React 19, TypeScript 5, Tailwind CSS 4           |
| Database   | MySQL 8.0+ (production) / PostgreSQL 15 (Docker)             |
| Cache      | Redis 7 (optional) or database                               |
| Payments   | M-Pesa Daraja API (Safaricom STK Push)                       |
| Storage    | AWS S3 (videos & posters) + CloudFront CDN                   |
| Streaming  | HLS.js with CloudFront signed URLs                           |
| Auth       | Laravel Sanctum (API tokens), Google OAuth (Socialite)        |
| Forms      | React Hook Form + Zod validation                             |
| State      | React Context (auth), TanStack React Query (data fetching)   |

---

## Project Structure

```
Ustadi/
├── backend/                    # Laravel 12 API
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/
│   │   │   │   ├── Auth/       # Login, Register, Password, Socialite
│   │   │   │   ├── Admin/      # Dashboard, Films, Users, Transactions, Settings
│   │   │   │   ├── FilmController.php
│   │   │   │   ├── GenreController.php
│   │   │   │   ├── PaymentController.php
│   │   │   │   ├── RentalController.php
│   │   │   │   ├── ReviewController.php
│   │   │   │   ├── UserController.php
│   │   │   │   └── VideoController.php
│   │   │   └── Middleware/     # AdminMiddleware, MpesaWhitelistMiddleware
│   │   ├── Models/             # User, Film, Genre, Rental, Transaction, Review, etc.
│   │   └── Services/           # MpesaService, CloudFrontService, S3UploadService
│   ├── config/                 # app, auth, sanctum, mpesa, filesystems
│   ├── database/
│   │   ├── migrations/         # All table schemas
│   │   └── seeders/            # Admin user & sample data
│   ├── routes/
│   │   └── api.php             # All API routes
│   ├── .env.example
│   └── composer.json
│
├── frontend/                   # Next.js 16 App
│   ├── public/                 # Static assets (logo.png, favicon)
│   ├── src/
│   │   ├── app/                # App Router pages
│   │   │   ├── page.tsx        # Homepage (hero, new releases, popular)
│   │   │   ├── about/          # About Us landing page
│   │   │   ├── login/          # Login page
│   │   │   ├── register/       # Registration page
│   │   │   ├── profile/        # User profile (protected)
│   │   │   ├── library/        # My Library / rentals (protected)
│   │   │   ├── watch/[slug]/   # Video player (protected)
│   │   │   ├── films/[slug]/   # Film details with reviews
│   │   │   └── admin/          # Admin panel
│   │   │       ├── page.tsx    # Dashboard
│   │   │       ├── films/      # Film CRUD
│   │   │       ├── transactions/
│   │   │       ├── users/
│   │   │       └── settings/
│   │   ├── components/         # Reusable UI components
│   │   ├── hooks/              # usePayment, useRental
│   │   ├── lib/
│   │   │   ├── api.ts          # Axios API client
│   │   │   ├── auth.tsx        # AuthProvider & useAuth hook
│   │   │   └── utils.ts        # Helpers
│   │   └── types/index.ts      # TypeScript interfaces
│   ├── next.config.ts
│   └── package.json
│
└── docker-compose.yml          # PostgreSQL, Redis, Laravel, Next.js
```

---

## Local Installation

### Prerequisites

| Software       | Version  | Purpose               |
|----------------|----------|-----------------------|
| PHP            | 8.2+     | Laravel runtime       |
| Composer       | 2.x      | PHP package manager   |
| Node.js        | 20+      | Next.js runtime       |
| npm             | 10+      | Node package manager  |
| MySQL          | 8.0+     | Database              |
| Git            | 2.x      | Version control       |

---

### Option A: Docker (Recommended)

The quickest way to get everything running with Docker Compose.

```bash
# 1. Clone the repository
git clone https://github.com/your-org/Ustadi.git
cd Ustadi

# 2. Copy environment files
cp backend/.env.example backend/.env

# 3. Start all services (PostgreSQL, Redis, Laravel, Next.js)
docker-compose up -d

# 4. Run database migrations and seed
docker exec ustadi-backend php artisan migrate --seed

# 5. Access the application
#    Frontend:  http://localhost:3000
#    Backend:   http://localhost:8000
```

---

### Option B: Manual Setup (Windows/Laragon)

Laragon provides PHP, MySQL, and Apache out of the box.

#### Step 1: Clone & Place Project

```bash
cd C:\laragon\www
git clone https://github.com/your-org/Ustadi.git
cd Ustadi
```

#### Step 2: Backend Setup

```bash
cd backend

# Install PHP dependencies
composer install

# Create environment file
cp .env.example .env

# Edit .env — set MySQL database credentials:
#   DB_CONNECTION=mysql
#   DB_HOST=127.0.0.1
#   DB_PORT=3306
#   DB_DATABASE=ustadi
#   DB_USERNAME=root
#   DB_PASSWORD=

# Generate application key
php artisan key:generate

# Create the database in MySQL (via Laragon HeidiSQL or command line)
# CREATE DATABASE ustadi;

# Run migrations and seed default data
php artisan migrate --seed

# Create storage symlink
php artisan storage:link

# Start the development server
php artisan serve
# Backend running at http://localhost:8000
```

#### Step 3: Frontend Setup

Open a **new terminal**:

```bash
cd C:\laragon\www\Ustadi\frontend

# Install Node.js dependencies
npm install

# Create environment file
echo NEXT_PUBLIC_API_URL=http://localhost:8000/api > .env.local
echo NEXT_PUBLIC_APP_URL=http://localhost:3000 >> .env.local

# Start development server
npm run dev
# Frontend running at http://localhost:3000
```

---

### Option C: Manual Setup (Mac/Linux)

#### Step 1: Clone Repository

```bash
git clone https://github.com/your-org/Ustadi.git
cd Ustadi
```

#### Step 2: Backend Setup

```bash
cd backend

# Install PHP dependencies
composer install

# Create and configure environment
cp .env.example .env

# Edit .env with your database credentials:
#   DB_CONNECTION=mysql
#   DB_HOST=127.0.0.1
#   DB_PORT=3306
#   DB_DATABASE=ustadi
#   DB_USERNAME=root
#   DB_PASSWORD=your_password

# Generate app key
php artisan key:generate

# Create database
mysql -u root -p -e "CREATE DATABASE ustadi;"

# Run migrations and seed
php artisan migrate --seed

# Create storage symlink
php artisan storage:link

# Set permissions
chmod -R 775 storage bootstrap/cache

# Start server
php artisan serve
# Backend running at http://localhost:8000
```

#### Step 3: Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Create environment file
cat > .env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_APP_URL=http://localhost:3000
EOF

# Start development server
npm run dev
# Frontend running at http://localhost:3000
```

---

## Production Deployment (Ubuntu + Nginx)

This guide covers deploying Ustadi on an **Ubuntu 22.04/24.04** server with **Nginx** as the reverse proxy.

### Server Requirements

| Resource       | Minimum       | Recommended   |
|----------------|---------------|---------------|
| CPU            | 1 vCPU        | 2 vCPUs       |
| RAM            | 2 GB          | 4 GB          |
| Disk           | 20 GB SSD     | 50 GB SSD     |
| OS             | Ubuntu 22.04  | Ubuntu 24.04  |

---

### 1. Server Preparation

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Add swap space (important for small servers)
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Set timezone
sudo timedatectl set-timezone Africa/Nairobi

# Create web directory
sudo mkdir -p /var/www
```

---

### 2. Install Dependencies

#### PHP 8.2 + Extensions

```bash
sudo apt install -y software-properties-common
sudo add-apt-repository ppa:ondrej/php -y
sudo apt update
sudo apt install -y php8.2 php8.2-fpm php8.2-cli php8.2-common \
    php8.2-mysql php8.2-pgsql php8.2-xml php8.2-curl php8.2-mbstring \
    php8.2-zip php8.2-gd php8.2-bcmath php8.2-intl php8.2-redis \
    php8.2-tokenizer php8.2-fileinfo
```

#### Composer

```bash
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer
```

#### Node.js 20 LTS

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

#### PM2 (Process Manager for Next.js)

```bash
sudo npm install -g pm2
```

#### MySQL 8.0

```bash
sudo apt install -y mysql-server
sudo mysql_secure_installation

# Create database and user
sudo mysql -e "CREATE DATABASE ustadi CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
sudo mysql -e "CREATE USER 'ustadi'@'localhost' IDENTIFIED BY 'YOUR_STRONG_PASSWORD';"
sudo mysql -e "GRANT ALL PRIVILEGES ON ustadi.* TO 'ustadi'@'localhost';"
sudo mysql -e "FLUSH PRIVILEGES;"
```

#### Nginx

```bash
sudo apt install -y nginx
```

#### Redis (Optional — for caching & queues)

```bash
sudo apt install -y redis-server
sudo systemctl enable redis-server
```

---

### 3. Deploy Code

```bash
# Clone the repository
cd /var/www
sudo git clone https://github.com/your-org/Ustadi.git
sudo chown -R $USER:www-data /var/www/Ustadi
```

Or upload via **SCP/SFTP**:

```bash
# From your local machine
scp -r /path/to/Ustadi ubuntu@your-server-ip:/var/www/Ustadi
```

---

### 4. Backend Setup (Laravel)

```bash
cd /var/www/Ustadi/backend

# Install production dependencies
composer install --optimize-autoloader --no-dev

# Create environment file
cp .env.example .env

# Edit production environment
nano .env
```

**Production `.env` settings:**

```env
APP_NAME=Ustadi
APP_ENV=production
APP_KEY=
APP_DEBUG=false
APP_URL=https://api.yourdomain.com

FRONTEND_URL=https://yourdomain.com

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=ustadi
DB_USERNAME=ustadi
DB_PASSWORD=YOUR_STRONG_PASSWORD

CACHE_STORE=redis
SESSION_DRIVER=redis
QUEUE_CONNECTION=redis

SANCTUM_STATEFUL_DOMAINS=yourdomain.com,api.yourdomain.com

# M-Pesa (production credentials)
MPESA_ENV=production
MPESA_CONSUMER_KEY=your_live_key
MPESA_CONSUMER_SECRET=your_live_secret
MPESA_BUSINESS_SHORT_CODE=your_shortcode
MPESA_PASSKEY=your_live_passkey
MPESA_CALLBACK_URL=https://api.yourdomain.com/api/payments/callback

# AWS S3 + CloudFront
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_DEFAULT_REGION=af-south-1
AWS_BUCKET=ustadi-videos
AWS_CLOUDFRONT_URL=https://dxxx.cloudfront.net
AWS_CLOUDFRONT_KEY_PAIR_ID=your_key_pair_id
AWS_CLOUDFRONT_PRIVATE_KEY=/path/to/private_key.pem

# Mail (production SMTP)
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=ustadifilms@gmail.com
MAIL_PASSWORD=your_app_password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@ustadi.com
MAIL_FROM_NAME="Ustadi Films"
```

```bash
# Generate application key
php artisan key:generate

# Run migrations
php artisan migrate --force

# Seed admin user (first time only)
php artisan db:seed --force

# Create storage symlink
php artisan storage:link

# Optimize for production
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Set permissions
sudo chown -R $USER:www-data /var/www/Ustadi/backend
sudo chmod -R 775 storage bootstrap/cache
```

---

### 5. Frontend Setup (Next.js)

```bash
cd /var/www/Ustadi/frontend

# Install dependencies
npm install

# Create production environment
cat > .env.local << EOF
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
NEXT_PUBLIC_APP_URL=https://yourdomain.com
EOF

# Build for production
npx next build
```

---

### 6. Nginx Configuration

#### Backend API (Laravel + PHP-FPM)

```bash
sudo nano /etc/nginx/sites-available/ustadi-api
```

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    root /var/www/Ustadi/backend/public;
    index index.php;

    client_max_body_size 50M;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
        fastcgi_read_timeout 300;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

#### Frontend (Next.js reverse proxy)

```bash
sudo nano /etc/nginx/sites-available/ustadi-frontend
```

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300;
    }

    # Cache static assets
    location /_next/static/ {
        proxy_pass http://127.0.0.1:3000;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }
}
```

#### Enable Sites & Restart Nginx

```bash
sudo ln -s /etc/nginx/sites-available/ustadi-api /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/ustadi-frontend /etc/nginx/sites-enabled/

# Remove default site
sudo rm -f /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

---

### 7. SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain SSL certificates
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
sudo certbot --nginx -d api.yourdomain.com

# Auto-renewal is enabled by default. Verify:
sudo certbot renew --dry-run
```

After SSL is set up, update your Laravel `.env`:

```env
APP_URL=https://api.yourdomain.com
FRONTEND_URL=https://yourdomain.com
MPESA_CALLBACK_URL=https://api.yourdomain.com/api/payments/callback
```

Then re-cache config:

```bash
cd /var/www/Ustadi/backend
php artisan config:cache
```

---

### 8. Process Management (PM2 & Supervisor)

#### Next.js with PM2

```bash
cd /var/www/Ustadi/frontend

# Start Next.js in production mode
pm2 start npm --name "ustadi-frontend" -- start

# Save PM2 process list & enable startup on boot
pm2 save
pm2 startup
# Run the command it outputs (starts with: sudo env PATH=...)
```

#### Laravel Queue Worker with Supervisor

```bash
sudo apt install -y supervisor

sudo nano /etc/supervisor/conf.d/ustadi-worker.conf
```

```ini
[program:ustadi-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/Ustadi/backend/artisan queue:work redis --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=www-data
numprocs=2
redirect_stderr=true
stdout_logfile=/var/www/Ustadi/backend/storage/logs/worker.log
stopwaitsecs=3600
```

```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start ustadi-worker:*
```

#### PHP-FPM

```bash
# Ensure PHP-FPM is running and enabled
sudo systemctl enable php8.2-fpm
sudo systemctl start php8.2-fpm
```

---

### 9. Firewall & Security

```bash
# Enable UFW firewall
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status

# The following ports should be open:
#   22 (SSH)
#   80 (HTTP — redirects to HTTPS)
#   443 (HTTPS)
#
# MySQL (3306) and Redis (6379) should NOT be exposed externally
```

---

### 10. Domain & DNS Setup

Configure your domain's DNS records (at your registrar or DNS provider):

| Type  | Name               | Value              |
|-------|--------------------|--------------------|
| A     | yourdomain.com     | YOUR_SERVER_IP     |
| A     | www                | YOUR_SERVER_IP     |
| A     | api                | YOUR_SERVER_IP     |

Allow 5-30 minutes for DNS propagation.

---

### Post-Deployment Checklist

- [ ] `APP_DEBUG=false` in backend `.env`
- [ ] `APP_ENV=production` in backend `.env`
- [ ] SSL certificates installed and working
- [ ] M-Pesa callback URL updated to production HTTPS URL
- [ ] M-Pesa environment set to `production`
- [ ] Storage symlink created (`php artisan storage:link`)
- [ ] Laravel caches optimized (`config:cache`, `route:cache`, `view:cache`)
- [ ] PM2 running Next.js and set to start on boot
- [ ] Supervisor running queue workers
- [ ] Firewall configured (only 22, 80, 443 open)
- [ ] Database backups configured (cron job recommended)
- [ ] Log rotation configured for Laravel logs

---

## Environment Variables

### Backend (.env)

| Variable                        | Description                                      | Required |
|---------------------------------|--------------------------------------------------|----------|
| `APP_ENV`                       | `local` or `production`                          | Yes      |
| `APP_KEY`                       | Auto-generated via `php artisan key:generate`     | Yes      |
| `APP_DEBUG`                     | `true` (local) / `false` (production)            | Yes      |
| `APP_URL`                       | Backend URL (e.g., `https://api.yourdomain.com`) | Yes      |
| `FRONTEND_URL`                  | Frontend URL for CORS & redirects                | Yes      |
| `DB_CONNECTION`                 | `mysql` or `pgsql`                               | Yes      |
| `DB_HOST` / `DB_PORT`          | Database host and port                           | Yes      |
| `DB_DATABASE`                   | Database name                                    | Yes      |
| `DB_USERNAME` / `DB_PASSWORD`  | Database credentials                             | Yes      |
| `SANCTUM_STATEFUL_DOMAINS`     | Comma-separated allowed domains                  | Yes      |
| `MPESA_ENV`                     | `sandbox` or `production`                        | Yes      |
| `MPESA_CONSUMER_KEY`           | Daraja API consumer key                          | Yes      |
| `MPESA_CONSUMER_SECRET`        | Daraja API consumer secret                       | Yes      |
| `MPESA_BUSINESS_SHORT_CODE`    | M-Pesa paybill/till number                       | Yes      |
| `MPESA_PASSKEY`                | Daraja API passkey                               | Yes      |
| `MPESA_CALLBACK_URL`           | Public URL for M-Pesa callbacks                  | Yes      |
| `AWS_ACCESS_KEY_ID`            | AWS IAM access key                               | Optional |
| `AWS_SECRET_ACCESS_KEY`        | AWS IAM secret key                               | Optional |
| `AWS_BUCKET`                   | S3 bucket name                                   | Optional |
| `AWS_CLOUDFRONT_URL`           | CloudFront distribution URL                      | Optional |
| `AWS_CLOUDFRONT_KEY_PAIR_ID`   | CloudFront key pair for signed URLs              | Optional |
| `GOOGLE_CLIENT_ID`             | Google OAuth client ID                           | Optional |
| `GOOGLE_CLIENT_SECRET`         | Google OAuth client secret                       | Optional |

### Frontend (.env.local)

| Variable                | Description                           | Required |
|-------------------------|---------------------------------------|----------|
| `NEXT_PUBLIC_API_URL`   | Backend API URL (e.g., `https://api.yourdomain.com/api`) | Yes |
| `NEXT_PUBLIC_APP_URL`   | Frontend URL (e.g., `https://yourdomain.com`) | Yes |

---

## API Reference

### Public Endpoints (No Auth)

| Method | Endpoint                     | Description                    |
|--------|------------------------------|--------------------------------|
| GET    | `/api/films`                 | List films (paginated, filterable) |
| GET    | `/api/films/featured`        | Get featured film for hero     |
| GET    | `/api/films/new-releases`    | Latest 10 films                |
| GET    | `/api/films/popular`         | Top 10 rented films            |
| GET    | `/api/films/{slug}`          | Film details with reviews      |
| GET    | `/api/genres`                | List all genres                |
| GET    | `/api/genres/{slug}`         | Genre with its films           |
| GET    | `/api/reviews/{filmId}`      | Film reviews (paginated)       |
| GET    | `/api/videos/trailer/{filmId}` | Trailer URL                 |

### Auth Endpoints

| Method | Endpoint                     | Description                    |
|--------|------------------------------|--------------------------------|
| POST   | `/api/auth/register`         | Register new user              |
| POST   | `/api/auth/login`            | Login (returns Bearer token)   |
| POST   | `/api/auth/logout`           | Logout (revoke token)          |
| POST   | `/api/auth/forgot-password`  | Send password reset email      |
| POST   | `/api/auth/reset-password`   | Reset password with token      |

### Protected Endpoints (Bearer Token)

| Method | Endpoint                          | Description                    |
|--------|-----------------------------------|--------------------------------|
| GET    | `/api/user`                       | Current user profile           |
| PATCH  | `/api/user`                       | Update profile                 |
| GET    | `/api/rentals`                    | My active rentals              |
| GET    | `/api/rentals/history`            | Rental history                 |
| GET    | `/api/rentals/{filmId}/access`    | Check rental access            |
| POST   | `/api/rentals/{rental}/started`   | Mark rental started (48hr)     |
| POST   | `/api/payments/initiate`          | Initiate M-Pesa STK Push      |
| GET    | `/api/payments/status/{id}`       | Poll payment status            |
| POST   | `/api/reviews`                    | Create review                  |
| GET    | `/api/reviews/{filmId}/mine`      | Get my review for a film       |
| PATCH  | `/api/reviews/{review}`           | Update review                  |
| DELETE | `/api/reviews/{review}`           | Delete review                  |
| GET    | `/api/videos/signed-url`          | CloudFront signed video URL    |

### Admin Endpoints (Bearer Token + Admin Role)

| Method | Endpoint                              | Description                |
|--------|---------------------------------------|----------------------------|
| GET    | `/api/admin/dashboard`                | Dashboard stats            |
| GET    | `/api/admin/films`                    | List all films             |
| POST   | `/api/admin/films`                    | Create film                |
| PATCH  | `/api/admin/films/{id}`               | Update film                |
| DELETE | `/api/admin/films/{id}`               | Delete film                |
| GET    | `/api/admin/transactions`             | List transactions          |
| GET    | `/api/admin/transactions/export`      | Export CSV                 |
| GET    | `/api/admin/users`                    | List users                 |
| PATCH  | `/api/admin/users/{id}`               | Update user (activate/deactivate) |
| GET    | `/api/admin/settings`                 | Get M-Pesa settings        |
| PATCH  | `/api/admin/settings`                 | Update M-Pesa settings     |
| POST   | `/api/admin/settings/test-mpesa`      | Test M-Pesa connection     |
| POST   | `/api/admin/upload/poster`            | Upload film poster         |

### M-Pesa Callback (IP Whitelisted)

| Method | Endpoint                     | Description                    |
|--------|------------------------------|--------------------------------|
| POST   | `/api/payments/callback`     | Safaricom callback endpoint    |

---

## Default Accounts

After running `php artisan db:seed`:

| Role     | Email              | Password  |
|----------|--------------------|-----------|
| Admin    | admin@ustadi.com   | admin123  |

**Important:** Change the admin password immediately after first login in production.

---

## Architecture

```
┌────────────────────┐     HTTPS      ┌──────────────┐
│   Browser/Client   │ ◄────────────► │    Nginx     │
└────────────────────┘                └──────┬───────┘
                                             │
                              ┌──────────────┴──────────────┐
                              │                             │
                       ┌──────▼──────┐              ┌──────▼──────┐
                       │  Next.js    │              │  PHP-FPM    │
                       │  (PM2)      │              │  (Laravel)  │
                       │  Port 3000  │              │  Nginx      │
                       └─────────────┘              └──────┬──────┘
                                                          │
                                           ┌──────────────┼──────────────┐
                                           │              │              │
                                    ┌──────▼──┐    ┌──────▼──┐    ┌─────▼─────┐
                                    │  MySQL  │    │  Redis  │    │  AWS S3   │
                                    │  DB     │    │  Cache  │    │ CloudFront│
                                    └─────────┘    └─────────┘    └───────────┘

Payment Flow:
  User → STK Push → M-Pesa (Safaricom) → Callback → Laravel → Create Rental

Video Flow:
  User → Request → Laravel (sign URL) → CloudFront (signed) → HLS Stream
```

---

## Developed by

**Bluechange Technology**

---
