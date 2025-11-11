# Beacon API Documentation

## Base URL
```
https://beacon-api.onrender.com  (production)
http://localhost:3000              (development)
```

## Authentication
Most endpoints require a JWT token in the `Authorization` header:
```
Authorization: Bearer <token>
```

Tokens are returned on successful login/registration and are valid for 7 days by default.

---

## Authentication Endpoints

### 1. Register
Create a new user account and agency

**Endpoint:** `POST /api/auth/register`

**Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123",
  "name": "John Doe",
  "agencyId": "uuid"  // Optional - if not provided, new agency is created
}
```

**Response (201):**
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "agency_admin",
      "agencyId": "uuid"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

**Errors:**
- 400: Missing required fields or password too short (< 8 chars)
- 409: User already exists

---

### 2. Login
Authenticate user with email and password

**Endpoint:** `POST /api/auth/login`

**Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123"
}
```

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "agency_admin",
      "agencyId": "uuid"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

**Errors:**
- 400: Missing email or password
- 401: Invalid credentials

---

### 3. Get Current User
Retrieve authenticated user's profile

**Endpoint:** `GET /api/auth/me`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "agency_admin",
    "agencyId": "uuid",
    "status": "active",
    "lastLogin": "2025-11-11T15:30:00Z"
  }
}
```

**Errors:**
- 401: Invalid or missing token

---

### 4. Change Password
Change user password

**Endpoint:** `POST /api/auth/change-password`

**Headers:**
```
Authorization: Bearer <token>
```

**Body:**
```json
{
  "currentPassword": "OldPassword123",
  "newPassword": "NewPassword456",
  "confirmPassword": "NewPassword456"
}
```

**Response (200):**
```json
{
  "status": "success",
  "message": "Password changed successfully"
}
```

**Errors:**
- 400: Passwords don't match or too short
- 401: Current password incorrect

---

### 5. Logout
Logout user

**Endpoint:** `POST /api/auth/logout`

**Response (200):**
```json
{
  "status": "success",
  "message": "Logged out successfully"
}
```

---

## User Management Endpoints

### 1. Get All Users (Super Admin Only)
Retrieve all users in the system

**Endpoint:** `GET /api/users`

**Headers:**
```
Authorization: Bearer <super_admin_token>
```

**Query Params:**
- `limit`: Number of results (default: 50)
- `offset`: Pagination offset (default: 0)

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "users": [
      {
        "id": "uuid",
        "email": "user@example.com",
        "name": "John Doe",
        "role": "agency_admin",
        "agency_id": "uuid",
        "status": "active",
        "created_at": "2025-11-11T15:30:00Z",
        "last_login": "2025-11-11T16:00:00Z"
      }
    ],
    "total": 1
  }
}
```

**Errors:**
- 401: Not authenticated
- 403: Not super admin

---

### 2. Get Users by Agency
Retrieve users in a specific agency

**Endpoint:** `GET /api/users/agency/:agencyId`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Params:**
- `limit`: Number of results (default: 50)
- `offset`: Pagination offset (default: 0)

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "users": [...],
    "total": 5
  }
}
```

**Errors:**
- 401: Not authenticated
- 403: No access to this agency

---

### 3. Create User (Super Admin Only)
Create a new user with temporary password

**Endpoint:** `POST /api/users`

**Headers:**
```
Authorization: Bearer <super_admin_token>
```

**Body:**
```json
{
  "email": "newuser@example.com",
  "name": "Jane Smith",
  "role": "agency_manager",  // super_admin, agency_admin, agency_manager, client_user
  "agencyId": "uuid"
}
```

**Response (201):**
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "uuid",
      "email": "newuser@example.com",
      "name": "Jane Smith",
      "role": "agency_manager",
      "agency_id": "uuid",
      "status": "active",
      "created_at": "2025-11-11T15:30:00Z"
    },
    "temporaryPassword": "abc12345xyz67890",
    "message": "User created. Share the temporary password with the user."
  }
}
```

**Errors:**
- 400: Missing required fields or invalid role
- 403: Not super admin
- 409: User already exists

---

### 4. Update User
Update user details

**Endpoint:** `PUT /api/users/:userId`

**Headers:**
```
Authorization: Bearer <token>
```

**Body:**
```json
{
  "name": "Jane Smith Updated",
  "role": "agency_admin",
  "status": "active"  // active, inactive
}
```

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "Jane Smith Updated",
    "role": "agency_admin",
    "agency_id": "uuid",
    "status": "active"
  }
}
```

---

### 5. Delete User (Soft Delete)
Deactivate a user

**Endpoint:** `DELETE /api/users/:userId`

**Headers:**
```
Authorization: Bearer <super_admin_token>
```

**Response (200):**
```json
{
  "status": "success",
  "message": "User deactivated successfully"
}
```

---

### 6. Reset User Password
Generate a temporary password for a user

**Endpoint:** `POST /api/users/:userId/reset-password`

**Headers:**
```
Authorization: Bearer <super_admin_token>
```

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "temporaryPassword": "newtemp123password",
    "message": "Password reset. Share the temporary password with the user."
  }
}
```

---

## Admin Panel Endpoints

### 1. Get All Agencies
View all agencies with statistics

**Endpoint:** `GET /api/admin/agencies`

**Headers:**
```
Authorization: Bearer <super_admin_token>
```

**Query Params:**
- `limit`: Number of results (default: 50)
- `offset`: Pagination offset (default: 0)

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "agencies": [
      {
        "id": "uuid",
        "name": "Acme Corp",
        "email": "admin@acme.com",
        "status": "active",
        "created_at": "2025-11-11T15:30:00Z",
        "site_count": 3,
        "user_count": 5
      }
    ],
    "total": 1
  }
}
```

---

### 2. Get Agency Details
View detailed information about a specific agency

**Endpoint:** `GET /api/admin/agencies/:agencyId`

**Headers:**
```
Authorization: Bearer <super_admin_token>
```

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "agency": {
      "id": "uuid",
      "name": "Acme Corp",
      "email": "admin@acme.com",
      "status": "active",
      "site_count": 3,
      "created_at": "2025-11-11T15:30:00Z"
    },
    "users": [
      {
        "id": "uuid",
        "email": "user@acme.com",
        "name": "John Doe",
        "role": "agency_admin",
        "status": "active",
        "last_login": "2025-11-11T16:00:00Z"
      }
    ],
    "sites": [
      {
        "id": "uuid",
        "name": "Main Website",
        "domain": "acme.com",
        "script_id": "abc123xyz",
        "status": "active",
        "created_at": "2025-11-11T15:30:00Z"
      }
    ],
    "eventCount": 15250
  }
}
```

---

### 3. Get System Statistics
View overall system statistics

**Endpoint:** `GET /api/admin/stats`

**Headers:**
```
Authorization: Bearer <super_admin_token>
```

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "totalAgencies": 5,
    "totalUsers": 25,
    "totalSites": 12,
    "totalEvents": 125000,
    "totalCompanies": 450
  }
}
```

---

## Tracking Endpoints

### 1. Track Event
Record a single event

**Endpoint:** `POST /api/track/event`

**Body:**
```json
{
  "event": "page_view",
  "siteId": "uuid",
  "sessionId": "session_uuid",
  "clientId": "client_uuid",
  "userId": "user_id",
  "timestamp": 1668700200000,
  "scriptVersion": "1.0.0",
  "properties": {
    "page_url": "https://example.com/products",
    "page_title": "Products",
    "utm_source": "google",
    "utm_medium": "cpc"
  }
}
```

**Response (201):**
```json
{
  "status": "success",
  "data": {
    "eventId": "uuid",
    "tracked": true
  }
}
```

---

### 2. Track Batch Events
Record multiple events in one request

**Endpoint:** `POST /api/track/batch`

**Body:**
```json
{
  "events": [
    {
      "event": "page_view",
      "siteId": "uuid",
      "sessionId": "session_uuid",
      "properties": { ... }
    },
    {
      "event": "click",
      "siteId": "uuid",
      "sessionId": "session_uuid",
      "properties": { ... }
    }
  ]
}
```

**Response (201):**
```json
{
  "status": "success",
  "data": {
    "tracked": 2,
    "eventIds": ["uuid1", "uuid2"]
  }
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "status": "error",
  "message": "Error description"
}
```

### Common HTTP Status Codes
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized (invalid/missing token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `409`: Conflict (resource already exists)
- `500`: Internal Server Error

---

## Role Hierarchy

- **super_admin**: Full system access, can manage all agencies and users
- **agency_admin**: Can manage their agency, sites, and users
- **agency_manager**: Can manage sites and view analytics
- **client_user**: Can view analytics only

---

## Environment Variables

Required for deployment:

```bash
# Server
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Database
DATABASE_URL=postgresql://...

# Redis
REDIS_URL=redis://...

# JWT
JWT_SECRET=your-super-secret-key
JWT_EXPIRY=7d

# CORS
CORS_ORIGIN=https://beacon-dashboard.onrender.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# IP Enrichment
IPINFO_API_KEY=...
```

---

## Implementation Notes

1. **Authentication**: JWT-based with 7-day expiry (configurable)
2. **Password Security**: Bcrypt hashing with 10 rounds
3. **Session Management**: Stateless (JWT only)
4. **Multi-tenancy**: Agency-level isolation with role-based access
5. **Rate Limiting**: 100 requests per 15 minutes per IP
6. **CORS**: Configured for frontend dashboard origin
7. **Security Headers**: Helmet.js configured for production

---

**Last Updated**: 2025-11-11
**Version**: 1.0.0
