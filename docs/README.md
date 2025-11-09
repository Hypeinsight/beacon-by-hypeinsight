# Beacon Documentation

**Version:** 0.1.0  
**Last Updated:** November 7, 2025

Welcome to the Beacon documentation! This directory contains all technical documentation for the project.

---

## 📚 Documentation Structure

```
docs/
├── architecture/       # System design and architecture
├── api/               # API specifications (OpenAPI/Swagger)
├── database/          # Database schemas and queries
├── adr/               # Architecture Decision Records
├── guides/            # User and deployment guides
└── README.md          # This file
```

---

## 🏗️ Architecture Documentation

### System Architecture
- **[System Architecture](architecture/system-architecture.md)** - Complete system overview with Mermaid diagrams
  - Component architecture
  - Data flow diagrams
  - Technology stack
  - Scalability considerations
  - Security architecture

---

## 📖 API Documentation

### Endpoints (Coming Soon)
- `docs/api/openapi.yaml` - OpenAPI 3.0 specification
- `docs/api/endpoints.md` - Detailed endpoint documentation with examples

**Current Endpoints:**
- `GET /api/health` - Basic health check
- `GET /api/health/detailed` - Detailed health with DB/Redis status
- `POST /api/track/event` - Track single event
- `POST /api/track/batch` - Track multiple events
- `GET /api/track/user/:userId` - Get events by user
- `GET /api/track/session/:sessionId` - Get events by session

---

## 🗄️ Database Documentation

### Schema (Coming Soon)
- `docs/database/schema.md` - Complete schema documentation with ER diagrams
- `docs/database/queries.md` - Common query examples
- `docs/database/migrations.md` - Migration history

**Current Tables:**
- `agencies` - Multi-tenant organizations (4 columns)
- `sites` - Client websites (8 columns)
- `events` - Tracking events (65+ columns)
- `companies` - B2B visitor tracking (17 columns)
- `sessions` - Session analytics (19 columns)
- `dashboard_users` - User management (9 columns)

**Schema File:** [`config/schema.sql`](../config/schema.sql)

---

## 📝 Architecture Decision Records (ADRs)

ADRs document important architectural decisions and their rationale.

### Active ADRs
1. **[ADR 001: IP Enrichment Service Selection](adr/001-ip-enrichment-service.md)** - Why we chose IPinfo.io

### Planned ADRs
- ADR 002: Database Selection (PostgreSQL)
- ADR 003: Caching Strategy (Redis)
- ADR 004: Multi-Tenant Architecture
- ADR 005: Event Processing Pipeline

---

## 📘 User Guides (Coming Soon)

### For Developers
- **[Getting Started](../GETTING_STARTED.md)** - Developer onboarding guide ✅
- **[Contributing Guide](guides/contributing.md)** - How to contribute
- **[Development Workflow](guides/development-workflow.md)** - Git, testing, CI/CD

### For End Users
- **[Script Installation Guide](guides/script-installation.md)** - How to install tracking script
- **[Dashboard User Guide](guides/dashboard-guide.md)** - Using the dashboard
- **[Troubleshooting](guides/troubleshooting.md)** - Common issues and solutions

### For Operations
- **[Deployment Guide](guides/deployment.md)** - Production deployment
- **[Monitoring Guide](guides/monitoring.md)** - System monitoring
- **[Backup & Recovery](guides/backup-recovery.md)** - Data backup procedures

---

## 📋 Other Documentation

### Project Root Documentation
- **[README.md](../README.md)** - Project overview and features
- **[QUICKSTART.md](../QUICKSTART.md)** - Quick setup guide
- **[GETTING_STARTED.md](../GETTING_STARTED.md)** - Detailed developer onboarding
- **[CHANGELOG.md](../CHANGELOG.md)** - Version history
- **[IMPLEMENTATION_STATUS.md](../IMPLEMENTATION_STATUS.md)** - Development progress

### Specification Documents
- **[Warp Tracking Solution Specification](../Documentation/warp_tracking_solution_specification.md)** - Complete technical spec
- **[Dashboard Architecture Design](../Documentation/dashboard_architecture_design.md)** - Dashboard design
- **[IP Enrichment Design](../Documentation/IP%20Enrichment%20&%20Company%20Identification%20System%20Design.md)** - IP enrichment details
- **[Seeka Research](../Documentation/Seeka%20Research%20Findings.md)** - Market research

---

## 📐 Documentation Standards

### Code Documentation
- **JSDoc comments** for all functions and classes
- Explain **WHY**, not just **WHAT**
- Include **parameter types**, **return values**, and **examples**
- Create **README.md** for each major module

### API Documentation
- Document every endpoint with **method**, **auth**, **params**, **examples**
- Include **request/response examples**
- Document **error codes** and **rate limits**
- Use **OpenAPI/Swagger** format

### Database Documentation
- Document **table purposes** and **relationships**
- Explain **indexes** and **constraints**
- Include **sample queries**
- Maintain **migration history**

### Architecture Documentation
- Maintain **architecture diagrams** (Mermaid or Draw.io)
- Create **ADRs** for major technical decisions
- Document **data flows** and **component interactions**
- Use **sequence diagrams** for complex interactions

---

## 🔄 Documentation Maintenance

### When to Update Documentation

1. **New Features**: Document in CHANGELOG.md and relevant docs
2. **API Changes**: Update OpenAPI spec and endpoint docs
3. **Database Changes**: Update schema docs and migration history
4. **Architecture Decisions**: Create new ADR
5. **Bug Fixes**: Document in CHANGELOG.md
6. **Configuration Changes**: Update .env.example and config docs

### Review Schedule

- **Weekly**: Check for outdated code comments
- **Monthly**: Review and update architecture docs
- **Per Release**: Update CHANGELOG.md and version docs
- **Quarterly**: Review all ADRs

---

## 🎯 Quick Links

### For New Developers
1. Read [GETTING_STARTED.md](../GETTING_STARTED.md)
2. Review [System Architecture](architecture/system-architecture.md)
3. Check [Implementation Status](../IMPLEMENTATION_STATUS.md)
4. Follow code standards in [GETTING_STARTED.md](../GETTING_STARTED.md#code-standards)

### For API Integration
1. Review API documentation (docs/api/)
2. Get API key from team
3. Read authentication guide
4. Test with provided examples

### For Operations
1. Read deployment guide
2. Set up monitoring
3. Configure backups
4. Review security checklist

---

## 🤝 Contributing to Documentation

### Making Changes
1. Fork/branch from main
2. Make changes to relevant docs
3. Test any code examples
4. Update table of contents if needed
5. Submit pull request

### Documentation Style Guide
- Use **Markdown** for all docs
- Use **Mermaid** for diagrams (embedded in markdown)
- Use **code blocks** with language tags
- Use **tables** for structured data
- Use **emojis sparingly** for visual hierarchy
- Keep paragraphs **short and focused**

### File Naming Convention
- Use **lowercase** with **hyphens**: `my-document.md`
- Use **numbers** for ordered docs: `001-first-adr.md`
- Use **clear descriptive** names
- Avoid **special characters**

---

## 📞 Support

- **Developer Questions**: #beacon-dev on Slack
- **Documentation Issues**: Create GitHub issue with `docs` label
- **Suggestions**: Email dev-team@hypeinsight.com

---

## 📄 License

This documentation is part of the Beacon project by Hype Insight.

---

**Document Version:** 1.0.0  
**Next Review Date:** December 2025
