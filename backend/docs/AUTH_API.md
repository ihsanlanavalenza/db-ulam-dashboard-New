# Authentication API Documentation

## Base URL
```
http://localhost:3001/api/auth
```

## Endpoints

### 1. POST /login
Authenticate user and receive JWT tokens.

**Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
  "username": "string (required)",
  "password": "string (required)"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login berhasil",
  "data": {
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@dashboard-mbu.com",
      "role": "admin",
      "level": "pusat",
      "cabang_id": null,
      "unit_id": null,
      "is_active": 1,
      "last_login": "2026-01-06T11:28:33.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Responses:**

400 Bad Request - Missing credentials:
```json
{
  "success": false,
  "message": "Username dan password wajib diisi"
}
```

401 Unauthorized - Invalid credentials:
```json
{
  "success": false,
  "message": "Username atau password salah"
}
```

**Example:**
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

---

### 2. POST /logout
Logout user and invalidate session.

**Endpoint:** `POST /api/auth/logout`

**Authentication:** Required (Bearer Token)

**Headers:**
```
Authorization: Bearer <access_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Logout berhasil"
}
```

**Error Responses:**

401 Unauthorized - No token:
```json
{
  "success": false,
  "message": "Token tidak ditemukan. Silakan login terlebih dahulu"
}
```

401 Unauthorized - Invalid token:
```json
{
  "success": false,
  "message": "Token tidak valid atau telah kadaluarsa"
}
```

**Example:**
```bash
curl -X POST http://localhost:3001/api/auth/logout \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

### 3. GET /verify
Verify JWT token validity and get user data.

**Endpoint:** `GET /api/auth/verify`

**Authentication:** Required (Bearer Token)

**Headers:**
```
Authorization: Bearer <access_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@dashboard-mbu.com",
      "role": "admin",
      "level": "pusat",
      "cabang_id": null,
      "unit_id": null,
      "is_active": 1,
      "last_login": "2026-01-06T11:28:33.000Z"
    }
  }
}
```

**Error Responses:**

401 Unauthorized - No token:
```json
{
  "success": false,
  "message": "Token tidak ditemukan. Silakan login terlebih dahulu"
}
```

401 Unauthorized - Invalid token:
```json
{
  "success": false,
  "message": "Token tidak valid atau telah kadaluarsa"
}
```

401 Unauthorized - Session expired:
```json
{
  "success": false,
  "message": "Sesi tidak valid atau telah berakhir"
}
```

401 Unauthorized - User inactive:
```json
{
  "success": false,
  "message": "User tidak ditemukan"
}
```

**Example:**
```bash
curl http://localhost:3001/api/auth/verify \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

### 4. GET /profile
Get current logged-in user profile.

**Endpoint:** `GET /api/auth/profile`

**Authentication:** Required (Bearer Token)

**Headers:**
```
Authorization: Bearer <access_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "admin",
    "email": "admin@dashboard-mbu.com",
    "role": "admin",
    "level": "pusat",
    "cabang_id": null,
    "unit_id": null,
    "is_active": 1,
    "last_login": "2026-01-06T11:28:33.000Z",
    "created_at": "2026-01-06T09:58:11.000Z",
    "updated_at": "2026-01-06T11:28:33.000Z"
  }
}
```

**Error Responses:**

401 Unauthorized - No token:
```json
{
  "success": false,
  "message": "Token tidak ditemukan. Silakan login terlebih dahulu"
}
```

404 Not Found - User not found:
```json
{
  "success": false,
  "message": "User tidak ditemukan"
}
```

**Example:**
```bash
curl http://localhost:3001/api/auth/profile \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## Authentication Flow

### 1. Login Process
```
User sends credentials
     ↓
Validate username/password
     ↓
Check bcrypt hash
     ↓
Generate JWT tokens
     ↓
Store session in database
     ↓
Log audit trail
     ↓
Return tokens to user
```

### 2. Protected Route Access
```
User sends request with token
     ↓
Extract token from Authorization header
     ↓
Verify JWT signature
     ↓
Check session in database
     ↓
Verify user is active
     ↓
Attach user to req.user
     ↓
Proceed to controller
```

### 3. Logout Process
```
User sends logout request with token
     ↓
Extract token from header
     ↓
Delete session from database
     ↓
Log audit trail
     ↓
Return success message
```

---

## JWT Token Structure

### Access Token Payload
```json
{
  "id": 1,
  "username": "admin",
  "email": "admin@dashboard-mbu.com",
  "role": "admin",
  "level": "pusat",
  "cabang_id": null,
  "unit_id": null,
  "iat": 1767698939,
  "exp": 1767785339
}
```

**Properties:**
- `id`: User ID
- `username`: Username
- `email`: User email
- `role`: User role (admin/user)
- `level`: Access level (pusat/cabang/unit)
- `cabang_id`: Cabang ID (for cabang/unit level users)
- `unit_id`: Unit ID (for unit level users)
- `iat`: Issued at (timestamp)
- `exp`: Expiration time (timestamp)

### Refresh Token Payload
```json
{
  "id": 1,
  "type": "refresh",
  "iat": 1767698939,
  "exp": 1768303739
}
```

**Token Expiration:**
- Access Token: 24 hours (configurable via JWT_EXPIRES_IN)
- Refresh Token: 7 days (configurable via JWT_REFRESH_EXPIRES_IN)

---

## User Roles & Levels

### Roles
- **admin**: Full system access, can manage users
- **user**: Normal user access, data filtered by level

### Levels
- **pusat**: Can see all data (national level)
- **cabang**: Can see all units in their cabang (branch level)
- **unit**: Can only see their own unit data (unit level)

### Sample Users

| Username | Password | Role | Level | Access Scope |
|----------|----------|------|-------|--------------|
| admin | admin123 | admin | pusat | All data |
| user_pusat | user123 | user | pusat | All data |
| user_jakarta | user123 | user | cabang | Jakarta cabang only |
| user_cibubur | user123 | user | unit | Cibubur unit only |

---

## Security Features

1. **Password Hashing**: bcrypt with salt rounds = 10
2. **JWT Tokens**: Signed with secret key from environment
3. **Session Management**: Token hash stored in database
4. **Token Expiration**: Auto-expire after configured time
5. **Audit Logging**: All authentication actions logged
6. **Active User Check**: Verify user is still active
7. **IP Tracking**: Store IP address for security audit
8. **User Agent**: Store user agent for session tracking

---

## Error Codes

| Code | Message | Description |
|------|---------|-------------|
| 400 | Username dan password wajib diisi | Missing credentials |
| 401 | Username atau password salah | Invalid credentials |
| 401 | Token tidak ditemukan | No authorization header |
| 401 | Token tidak valid atau telah kadaluarsa | Invalid/expired JWT |
| 401 | Sesi tidak valid atau telah berakhir | Session not in DB |
| 401 | User tidak aktif atau tidak ditemukan | User inactive |
| 403 | Akses ditolak | Insufficient permissions |
| 404 | User tidak ditemukan | User not found |
| 500 | Internal server error | Server error |

---

## Environment Variables

```env
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Server Configuration
NODE_ENV=development
PORT=3001
```

---

## Database Tables

### users
Stores user account information with hashed passwords.

### user_sessions
Stores active JWT token sessions with expiration.

### audit_logs
Logs all authentication actions (LOGIN, LOGOUT) with IP and timestamp.

### password_resets
For future password reset functionality.

---

## Best Practices

1. **Always use HTTPS in production** to protect tokens in transit
2. **Store tokens securely** on client (httpOnly cookies or secure storage)
3. **Validate tokens on every protected route** using requireAuth middleware
4. **Implement token refresh** before access token expires
5. **Log out users** by deleting sessions from database
6. **Monitor audit logs** for suspicious activity
7. **Use strong JWT_SECRET** in production (min 32 characters)
8. **Rotate secrets regularly** for enhanced security
