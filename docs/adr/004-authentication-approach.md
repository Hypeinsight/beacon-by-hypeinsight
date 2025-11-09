# ADR 004: Authentication Approach

## Status
Accepted

## Context
Beacon has two distinct authentication requirements:

1. **Tracking API**: Public-facing endpoints that accept tracking events from websites
2. **Management API**: Protected endpoints for agencies to manage sites, users, and view analytics
3. **Dashboard**: Web interface for viewing analytics and managing configuration

Each has different security, performance, and user experience requirements.

## Decision
We will implement a **dual authentication strategy**:

### 1. Tracking API: Script ID Validation (Low Security)
**Endpoints**: `/api/track/*`

#### Authentication Method
- Site script_id included in tracking payload
- Server validates script_id exists in database
- No authentication token required
- CORS enabled for all origins

#### Rationale
- **Public by design**: Tracking must work from any origin
- **Performance**: No token validation overhead on high-volume endpoints
- **Simplicity**: No auth setup required for clients
- **Rate limiting**: Protection via IP-based rate limits

#### Implementation
```javascript
// Minimal validation in trackingController.js
const site = await getSiteByScriptId(siteId);
if (!site || site.status !== 'active') {
  return res.status(404).json({ error: 'Invalid site ID' });
}
```

#### Security Considerations
- Script IDs are public (visible in page source)
- Malicious actors could send fake events
- Mitigations:
  - Domain validation (optional): Check referrer matches site.domain
  - Event pattern analysis: Detect anomalous behavior
  - Rate limiting per script_id

---

### 2. Management API: Dual Token System (High Security)
**Endpoints**: `/api/sites/*`, `/api/agencies/*`, `/api/analytics/*`

#### Authentication Method: API Keys + JWT

##### API Keys (Agency Level)
- Long-lived tokens for programmatic access
- Generated on agency creation
- Hashed with bcrypt before storage
- Used via `X-API-Key` header
- Suitable for: Server-to-server integrations, CI/CD

```http
GET /api/sites
X-API-Key: beacon_a1b2c3d4e5f6...
```

##### JWT Tokens (Dashboard Users)
- Short-lived tokens (24 hours) for dashboard access
- Generated on login
- Stored in httpOnly cookies
- Contains: userId, agencyId, role, exp
- Used via: `Authorization: Bearer <token>` header or cookie
- Suitable for: Web dashboard, mobile apps

```http
GET /api/sites
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

#### Implementation

##### Middleware Chain
```javascript
// src/middleware/auth.js

const authenticate = async (req, res, next) => {
  // Try API Key first (X-API-Key header)
  const apiKey = req.headers['x-api-key'];
  if (apiKey) {
    const agency = await agenciesService.getAgencyByApiKey(apiKey);
    if (agency) {
      req.agency = agency;
      req.authMethod = 'api_key';
      return next();
    }
  }
  
  // Try JWT token (Authorization header or cookie)
  const token = extractToken(req);
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      req.agency = await agenciesService.getAgencyById(decoded.agencyId);
      req.authMethod = 'jwt';
      return next();
    } catch (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  }
  
  // No valid authentication
  return res.status(401).json({ error: 'Authentication required' });
};
```

##### Login Endpoint
```javascript
// POST /api/auth/login
const login = async (req, res) => {
  const { email, password } = req.body;
  
  // Validate credentials
  const user = await dashboardUsersService.findByEmail(email);
  if (!user || !await bcrypt.compare(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  // Generate JWT
  const token = jwt.sign(
    { 
      userId: user.id, 
      agencyId: user.agency_id, 
      role: user.role 
    },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
  
  // Set httpOnly cookie
  res.cookie('beacon_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  });
  
  res.json({ success: true, token, user: { id: user.id, email: user.email, role: user.role } });
};
```

---

### 3. Authorization (Role-Based Access Control)

#### Roles
- **super_admin**: System-wide access (Beacon internal)
- **agency_admin**: Full access to agency's sites and users
- **agency_user**: Read/write access to agency's sites
- **agency_viewer**: Read-only access to agency's data

#### Middleware
```javascript
const requireRole = (minRole) => (req, res, next) => {
  const roleHierarchy = ['agency_viewer', 'agency_user', 'agency_admin', 'super_admin'];
  const userRole = req.user?.role || 'agency_viewer';
  
  if (roleHierarchy.indexOf(userRole) >= roleHierarchy.indexOf(minRole)) {
    return next();
  }
  
  return res.status(403).json({ error: 'Insufficient permissions' });
};

// Usage
router.delete('/api/sites/:id', authenticate, requireRole('agency_admin'), deleteSite);
```

## Consequences

### Positive
- **Flexibility**: API keys for automation, JWT for humans
- **Security**: Strong auth for management operations, lightweight for tracking
- **Performance**: No auth overhead on high-volume tracking endpoints
- **Standards compliance**: JWT is industry standard
- **Revocable**: API keys can be regenerated, JWT tokens expire
- **Multi-tenant isolation**: Agency-level authentication prevents data leakage

### Negative
- **Complexity**: Two authentication systems to maintain
- **Token management**: JWT refresh logic needed for long sessions
- **API key security**: Keys must be stored securely by clients
- **Tracking spoofing**: Script IDs can be abused (acceptable tradeoff)

### Mitigation Strategies
- Clear documentation on when to use API keys vs JWT
- Rate limiting on both tracking and management endpoints
- Optional domain validation for tracking
- Automated API key rotation reminders
- Refresh token implementation for seamless dashboard sessions

## Alternatives Considered

### Alternative 1: OAuth 2.0
**Rejected for MVP**: Adds significant complexity. JWT provides sufficient security for direct API access. Could add OAuth later for third-party integrations.

### Alternative 2: Session-Based Auth (Cookies Only)
**Rejected**: Not suitable for API clients (mobile, integrations). Requires server-side session storage.

### Alternative 3: API Keys Only (No JWT)
**Rejected**: API keys in browser localStorage is insecure. Need httpOnly cookies for dashboard.

### Alternative 4: Single Token Type
**Rejected**: Either too complex for tracking or too insecure for management.

### Alternative 5: Firebase Auth / Auth0
**Future consideration**: For enterprise clients needing SSO, could integrate third-party auth providers.

## Security Best Practices

### API Key Management
- Never log API keys
- Hash keys with bcrypt (cost factor 10)
- Rate limit key validation attempts
- Support key rotation without downtime

### JWT Security
- Use HS256 algorithm with strong secret (32+ chars)
- Set reasonable expiration (24h for dashboard, 1h for mobile)
- Include jti (JWT ID) claim for revocation
- Rotate JWT_SECRET periodically

### Password Security
- Bcrypt with cost factor 10
- Minimum 8 characters, require complexity
- Rate limit login attempts (5 per 15 min)
- Optional: 2FA for agency admins (future)

## Implementation Phases

### Phase 1: Basic Auth (MVP - Current)
- Script ID validation for tracking
- API keys for agencies
- Basic middleware

### Phase 2: Dashboard Auth (v0.2)
- Login/logout endpoints
- JWT generation and validation
- Password hashing
- RBAC middleware

### Phase 3: Enhanced Security (v0.3)
- Refresh tokens
- API key rotation
- 2FA support
- Audit logging

### Phase 4: Enterprise Features (v1.0)
- SSO integration (SAML, OAuth)
- IP whitelisting
- Advanced RBAC with custom permissions

## Monitoring & Alerts

### Metrics to Track
- Failed auth attempts per IP/user
- API key usage patterns
- JWT expiration rates
- Auth endpoint latency

### Alerts
- Brute force attack detection (>10 failed logins in 5 min)
- Compromised API key patterns
- Unusual auth patterns

## References
- JWT RFC: https://tools.ietf.org/html/rfc7519
- OWASP Authentication Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
- bcrypt: https://github.com/kelektiv/node.bcrypt.js

## Related ADRs
- ADR 001: IP Enrichment Service Selection
- ADR 002: Session Management Strategy
- ADR 003: Data Retention Policy

---

**Date**: 2025-11-08  
**Author**: Beacon Development Team  
**Reviewers**: Architecture Team, Security Team