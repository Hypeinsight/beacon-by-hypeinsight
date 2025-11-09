# ADR 002: Session Management Strategy

## Status
Accepted

## Context
Beacon needs to accurately track user sessions across page views and events to provide meaningful analytics. Sessions are critical for calculating bounce rates, engagement time, conversion funnels, and user journey analysis.

Key requirements:
- Consistent session identification across page loads
- Session timeout handling (30-minute industry standard)
- Session persistence across browser tabs
- No server-side session storage (stateless architecture)
- Cross-domain tracking support (future)

## Decision
We will implement **client-side session management** using sessionStorage with the following strategy:

### Session ID Generation
- Generate UUID v4 on first page load
- Store in `sessionStorage` (tab-specific, cleared on tab close)
- Include in every tracking event

### Session Timeout
- 30-minute inactivity timeout (industry standard)
- Track `lastActivityTime` in sessionStorage
- Reset timer on every event
- Generate new session_id if timeout exceeded

### Session Number
- Track cumulative session count in localStorage (persistent)
- Increment on new session creation
- Enables "returning visitor" analysis

### Implementation Details
```javascript
// Session management in beacon.js
function getOrCreateSession() {
  const now = Date.now();
  const lastActivity = parseInt(sessionStorage.getItem('beacon_last_activity') || '0');
  const sessionTimeout = 30 * 60 * 1000; // 30 minutes
  
  let sessionId = sessionStorage.getItem('beacon_session_id');
  
  // Create new session if timeout or doesn't exist
  if (!sessionId || (now - lastActivity > sessionTimeout)) {
    sessionId = generateUUID();
    sessionStorage.setItem('beacon_session_id', sessionId);
    
    // Increment session number
    const sessionNumber = parseInt(localStorage.getItem('beacon_session_number') || '0') + 1;
    localStorage.setItem('beacon_session_number', sessionNumber);
  }
  
  // Update last activity
  sessionStorage.setItem('beacon_last_activity', now.toString());
  
  return {
    sessionId,
    sessionNumber: parseInt(localStorage.getItem('beacon_session_number'))
  };
}
```

### Server-Side Processing
- Server does NOT generate or validate sessions
- Trusts client-provided session_id
- Aggregates events by session_id for analytics
- Stores session metadata in `sessions` table for quick lookups

## Consequences

### Positive
- **Stateless**: No server-side session storage required
- **Scalable**: Sessions don't consume server memory
- **Simple**: Easy to implement and maintain
- **Fast**: No server round-trip for session validation
- **Privacy-friendly**: Sessions reset on tab close
- **Accurate timeouts**: Client-side timing is precise

### Negative
- **Client trust**: Relies on client-generated session_id (could be spoofed)
- **No cross-tab sessions**: Each tab = new session (acceptable for most use cases)
- **Privacy mode**: Sessions reset immediately in incognito/private browsing
- **Clock skew**: Client time could be inaccurate (mitigated by server_timestamp)

### Mitigation Strategies
- Use server_timestamp as authoritative time source
- Detect abnormal session patterns in analytics
- Future: Add optional server-side session validation for high-security clients
- Future: Cross-tab session sharing via localStorage events (if needed)

## Alternatives Considered

### Alternative 1: Server-Side Sessions (JWT)
**Rejected**: Adds complexity, requires state management, slower performance, not necessary for analytics use case.

### Alternative 2: Cookie-Based Sessions
**Rejected**: Cookies persist across tabs, making it harder to track distinct browsing sessions. Also faces increasing browser restrictions.

### Alternative 3: LocalStorage Sessions
**Rejected**: Sessions would persist indefinitely across browser restarts, providing inaccurate "session" analytics.

### Alternative 4: Hybrid (Client + Server Validation)
**Future consideration**: For enterprise clients requiring stronger session integrity, could add optional server-side validation layer.

## References
- Google Analytics uses 30-minute session timeout
- W3C Web Storage API: https://www.w3.org/TR/webstorage/
- UUID RFC: https://tools.ietf.org/html/rfc4122

## Related ADRs
- ADR 001: IP Enrichment Service Selection
- ADR 003: Data Retention Policy (coming)
- ADR 004: Authentication Approach (coming)

---

**Date**: 2025-11-08  
**Author**: Beacon Development Team  
**Reviewers**: Architecture Team