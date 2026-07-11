# LocalIoTCloud — Module Documentation

This directory contains living documentation for every completed module in the platform.
Each document is written from the code — not aspirationally — so it always reflects the
actual implementation.

---

## Completed Modules

| Module | Status | Document |
|---|---|---|
| Organization | ✅ v1.0 | [organization.md](./organization.md) |
| Tenant | ✅ v1.0 | [tenant.md](./tenant.md) |
| Project | ✅ v1.0 | [project.md](./project.md) |
| Gateway | ✅ v1.0 | [gateway.md](./gateway.md) |
| Device | ✅ v1.0 | [device.md](./device.md) |
| Sensor | ✅ v1.0 | [sensor.md](./sensor.md) |

---

## Planned Modules

| Module | Status |
|---|---|
| Authentication | 📋 Planned |
| User | 📋 Planned |
| Telemetry | 📋 Planned |
| Alert | 📋 Planned |
| Rule | 📋 Planned |
| Dashboard | 📋 Planned |
| Widget | 📋 Planned |
| Channel | 📋 Planned |
| Analytics | 📋 Planned |
| Report | 📋 Planned |
| Notification | 📋 Planned |
| Licensing | 📋 Planned |
| Settings | 📋 Planned |

---

## Documentation Standard

Every module document follows the same structure so contributors can navigate
any module without needing to learn a new layout.

```
## Purpose
## Architecture
## Database Schema
## API Endpoints
## Business Rules
## Error Reference
## Relationships
## File Map
## Test Coverage
## Changelog
```

> **Rule:** A module document is written **after** its v1.0 milestone is committed.
> Aspirational or in-progress documentation belongs in the implementation plan, not here.
