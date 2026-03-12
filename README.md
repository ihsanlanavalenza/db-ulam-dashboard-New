# 📊 Dashboard MBU (Micro Banking Unit)

Dashboard monitoring dan analisis performa Micro Banking Unit dengan visualisasi real-time, sistem autentikasi berbasis role, dan keamanan enterprise-level.

**Version:** 1.0.0  
**Last Updated:** 7 Januari 2026  
**Status:** ✅ Production-Ready

---

## 📋 Daftar Isi

- [Fitur Utama](#-fitur-utama)
- [Teknologi Stack](#-teknologi-stack)
- [Instalasi](#-instalasi)
- [Konfigurasi](#-konfigurasi)
- [Menjalankan Aplikasi](#-menjalankan-aplikasi)
- [User Management](#-user-management)
- [Fitur Security](#-fitur-security)
- [API Documentation](#-api-documentation)
- [Troubleshooting](#-troubleshooting)
- [Backup & Recovery](#-backup--recovery)

---

## 🎯 Fitur Utama

### Dashboard & Analytics
- **📍 Map Interaktif** - Visualisasi lokasi cabang dan unit dengan marker dinamis
- **📊 Real-time KPI** - Monitoring NOA, OS, Lending, Quality metrics
- **📈 Grafik Trend** - Portfolio, Productivity, Quality, Write-off analysis
- **🎯 Growth Tracking** - Analisis pertumbuhan bulanan dan tahunan
- **⏰ Productivity Chart** - Grafik jam produktivitas per unit

### User Management
- **👥 Role-based Access Control** - Admin & User roles
- **🏢 Level-based Data Filtering** - Pusat (all data), Cabang (branch level), Unit (unit level)
- **🔐 Secure Authentication** - JWT tokens dengan automatic refresh
- **👤 User CRUD** - Kelola user, toggle status, delete user

### Security Features
- ✅ **JWT Authentication** dengan 15-minute access token
- ✅ **Input Sanitization** untuk semua user input
- ✅ **SQL Injection Protection** dengan parameterized queries
- ✅ **Rate Limiting** - Login (5/15min), API (100/15min)
- ✅ **Security Headers** - Helmet.js (CSP, XSS, HSTS protection)
- ✅ **Strong Password Policy** - Min 8 char + uppercase + lowercase + number + special
- ✅ **Audit Logging** - Semua user actions tercatat

---

## 🛠️ Teknologi Stack

### Backend
- **Node.js** v18+ dengan Express.js v5
- **MySQL** v8.0+ untuk database
- **JWT** untuk authentication
- **Bcrypt** untuk password hashing
- **Helmet** untuk security headers
- **Express Rate Limit** untuk API protection

### Frontend
- **React** v18 dengan Hooks
- **Recharts** untuk data visualization
- **Leaflet** untuk interactive maps
- **Tailwind CSS** untuk styling
- **Axios** untuk API calls

---

## 🚀 Instalasi

### Prerequisites

Pastikan sudah terinstall:
- **Node.js** v18 atau lebih tinggi ([Download](https://nodejs.org/))
- **MySQL** v8.0 atau lebih tinggi ([Download](https://dev.mysql.com/downloads/))
- **npm** atau **yarn** package manager

### Step 1: Setup Database

1. Buat database MySQL:
```sql
CREATE DATABASE db_ulaam CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. Import database schema (jika ada file SQL backup)

### Step 2: Install Backend Dependencies

```bash
cd backend
npm install
```

### Step 3: Install Frontend Dependencies

```bash
cd frontend
npm install
```

---

## ⚙️ Konfigurasi

### Backend Configuration

1. **Copy template environment**:
```bash
cd backend
cp .env.example .env
```

2. **Edit file `.env`**:
```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password_here
DB_NAME=db_ulaam
DB_PORT=3306

# JWT Configuration (CRITICAL - Generate strong secret!)
# Cara generate: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=your_128_character_secret_key_here
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Server Configuration
PORT=3002
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

3. **Generate JWT Secret** (WAJIB):
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
Copy output dan paste ke `JWT_SECRET` di `.env`

---

## ▶️ Menjalankan Aplikasi

### Development Mode

**Terminal 1 - Backend:**
```bash
cd backend
node server.js
```
Backend akan berjalan di: **http://localhost:3001**

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```
Frontend akan berjalan di: **http://localhost:3000**

### Production Mode

**Backend:**
```bash
cd backend
NODE_ENV=production node server.js
```

**Frontend:**
```bash
cd frontend
npm run build
# Serve build folder dengan web server (nginx/apache)
```

---

## 👥 User Management

### Default Users

Buat admin pertama dengan SQL:

```sql
-- Hash password terlebih dahulu dengan bcrypt
-- Contoh: bcrypt.hashSync('Admin123!', 10)

INSERT INTO users (username, email, password_hash, role, level, is_active, created_at, updated_at)
VALUES (
  'admin',
  'admin@example.com',
  '$2a$10$...your_hashed_password',
  'admin',
  'pusat',
  1,
  NOW(),
  NOW()
);
```

### User Roles

| Role | Akses | Deskripsi |
|------|-------|-----------|
| **admin** | Full Access | Kelola semua user + akses semua data |
| **user** | Limited Access | Lihat data sesuai level saja |

### User Levels (Data Filtering)

| Level | Filter Data | Deskripsi |
|-------|-------------|-----------|
| **pusat** | Semua data | Bisa lihat data semua cabang & unit |
| **cabang** | Cabang tertentu | Hanya lihat data cabang sendiri |
| **unit** | Unit tertentu | Hanya lihat data unit sendiri |

### Password Requirements
- ✅ Minimum 8 karakter
- ✅ Minimal 1 huruf besar (A-Z)
- ✅ Minimal 1 huruf kecil (a-z)
- ✅ Minimal 1 angka (0-9)
- ✅ Minimal 1 karakter khusus (!@#$%^&*)

---

## 🔐 Fitur Security

### 1. Authentication
- **JWT Tokens** - Access token (15 min) + Refresh token (7 days)
- **Automatic Refresh** - Token auto-refresh sebelum expired
- **Secure Logout** - Invalidate session di database

### 2. Authorization
- **Role-based Access** - Admin vs User permissions
- **Level-based Filtering** - Data filter otomatis berdasarkan user level

### 3. Input Protection
- **Sanitization** - Semua input di-sanitize sebelum diproses
- **SQL Injection Prevention** - Parameterized queries + wildcard escaping
- **XSS Protection** - Helmet security headers + CSP

### 4. Rate Limiting
- **Login Endpoint**: 5 attempts per 15 minutes
- **User Management API**: 50 requests per 15 minutes
- **Data API**: 100 requests per 15 minutes

### 5. Audit Logging
- Login/logout attempts
- User CRUD operations
- Data access patterns
- IP address + user agent tracking

---

## 📡 API Documentation

### Base URL
```
http://localhost:3001/api
```

### Authentication Endpoints

**POST** `/auth/login`
```json
{
  "username": "admin",
  "password": "Admin123!"
}
```

**POST** `/auth/logout` - Headers: Authorization: Bearer <token>

**GET** `/auth/verify` - Verify JWT token

### Data Endpoints

- **GET** `/summary?cabang=<cabang>&unit=<unit>` - Dashboard summary
- **GET** `/grafik-productivity` - Productivity charts
- **GET** `/grafik-tren-portofolio` - Portfolio trends
- **GET** `/grafik-portofolio` - Portfolio charts
- **GET** `/grafik-tren-quality` - Quality trends
- **GET** `/growth-summary` - Growth data
- **GET** `/grafik-jam` - Hourly productivity
- **GET** `/grafik-writeoff` - Write-off data
- **GET** `/branch-locations` - Map locations

### User Management Endpoints (Admin Only)

- **GET** `/users` - Get all users
- **POST** `/users` - Create new user
- **PUT** `/users/:id` - Update user
- **DELETE** `/users/:id` - Delete user
- **PATCH** `/users/:id/toggle-status` - Toggle active status

---

## 🔧 Troubleshooting

### Backend Tidak Mau Start

**Error: JWT_SECRET must be defined**
```
Solution: Set JWT_SECRET di file .env
```

**Error: DB Connection Failed**
```
Solution: 
1. Pastikan MySQL running
2. Check credentials di .env
3. Pastikan database db_ulaam sudah dibuat
```

**Error: Port 3001 already in use**
```
Solution: 
Mac/Linux: lsof -ti:3001 | xargs kill -9
Windows: netstat -ano | findstr :3001
```

### Frontend Tidak Mau Start

**Error: CORS Policy Blocked**
```
Solution: Pastikan FRONTEND_URL di backend/.env benar
Contoh: FRONTEND_URL=http://localhost:3000
```

### Login Gagal

**Error: "Terlalu banyak percobaan login"**
```
Solution: Tunggu 15 menit atau restart backend server
```

---

## 💾 Backup & Recovery

### Backup Database

**Manual Backup:**
```bash
mysqldump -u root -p db_ulaam > backup_$(date +%Y%m%d_%H%M%S).sql
```

**Automated Backup Script:**
```bash
cd backend
chmod +x backup_database.sh
./backup_database.sh
```

### Restore Database

```bash
mysql -u root -p db_ulaam < backup_20260107_061113.sql
```

---

## 🎯 Best Practices

### Untuk Production Deployment
1. ✅ Generate strong JWT_SECRET baru (jangan reuse dev key)
2. ✅ Set `NODE_ENV=production`
3. ✅ Update `FRONTEND_URL` dengan production URL
4. ✅ Enable HTTPS dengan SSL certificate
5. ✅ Configure firewall untuk protect MySQL port
6. ✅ Setup automated backups
7. ✅ Test semua fitur sebelum go-live

---

## 📞 Support

Untuk dukungan teknis atau pertanyaan, hubungi developer team.

---

**Dashboard MBU © 2026. All Rights Reserved.**

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
# dashboardulam
