# Database Migrations

## How to Run Migrations

### Manual Execution
```bash
mysql -u root -p db_ulaam < migrations/001_create_users_tables.sql
```

### Via Script
```bash
npm run migrate
```

## Migration Files

### 001_create_users_tables.sql
- Creates `users` table (authentication & user management)
- Creates `user_sessions` table (JWT token tracking)
- Creates `audit_logs` table (activity logging)
- Creates `password_resets` table (password recovery)
- Inserts sample users

## Sample Users

| Username | Email | Password | Role | Level | Access |
|----------|-------|----------|------|-------|--------|
| admin | admin@dashboard-mbu.com | admin123 | admin | pusat | Full access (Home + Management) |
| user_pusat | pusat@dashboard-mbu.com | user123 | user | pusat | View all data (nasional) |
| user_jakarta | jakarta@dashboard-mbu.com | user123 | user | cabang | View Jakarta only |
| user_cibubur | cibubur@dashboard-mbu.com | user123 | user | unit | View Cibubur only |

## Database Schema

### users
```sql
- id (PK)
- username (UNIQUE)
- email (UNIQUE)
- password_hash
- role: ENUM('admin', 'user')
- level: ENUM('pusat', 'cabang', 'unit')
- cabang_id (NULL for pusat)
- unit_id (NULL for pusat/cabang)
- is_active
- last_login
- created_by
- created_at, updated_at
```

### user_sessions
```sql
- id (PK)
- user_id (FK → users)
- token_hash (SHA256 of JWT)
- ip_address
- user_agent
- expires_at
- created_at
```

### audit_logs
```sql
- id (PK)
- user_id (FK → users)
- action (CREATE, UPDATE, DELETE, LOGIN, LOGOUT)
- table_name
- record_id
- old_values (JSON)
- new_values (JSON)
- ip_address
- user_agent
- created_at
```

### password_resets
```sql
- id (PK)
- user_id (FK → users)
- token (UNIQUE)
- expires_at
- used
- used_at
- created_at
```

## Notes

- All tables use InnoDB engine for ACID compliance
- Charset: utf8mb4 (supports emoji & international characters)
- Foreign keys with CASCADE/SET NULL for referential integrity
- Indexes on frequently queried columns
- Timestamps for audit trail
