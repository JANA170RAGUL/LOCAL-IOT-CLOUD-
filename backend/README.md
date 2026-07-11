# LocalIoTCloud – Backend

FastAPI-based backend for the **LocalIoTCloud** platform — a self-hosted, multi-tenant IoT management system supporting device registration, real-time telemetry ingestion, rule-based alerting, dashboards, and more.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [FastAPI](https://fastapi.tiangolo.com/) 0.139+ |
| ORM | [SQLAlchemy](https://www.sqlalchemy.org/) 2.0 (async) |
| Migrations | [Alembic](https://alembic.sqlalchemy.org/) |
| Relational DB | MySQL / MariaDB |
| Time-Series DB | [InfluxDB](https://www.influxdata.com/) 2.x |
| Cache / Broker | [Redis](https://redis.io/) |
| Auth | JWT (python-jose) + bcrypt (passlib) |
| Validation | [Pydantic](https://docs.pydantic.dev/) v2 |
| Server | [Uvicorn](https://www.uvicorn.org/) |

---

## Project Structure

```
backend/
├── app/
│   ├── main.py                 # FastAPI application entry point
│   ├── api/                    # Top-level API router aggregator
│   ├── config/                 # Settings & environment loading
│   ├── core/                   # App-wide core (security, logging, events)
│   ├── database/               # DB engine, session factory, base model
│   ├── middleware/              # Custom ASGI middleware
│   ├── models/                 # Shared / base SQLAlchemy models
│   ├── schemas/                # Shared Pydantic schemas
│   ├── services/               # Shared cross-cutting services
│   ├── repositories/           # Shared base repository
│   ├── shared/                 # Common utilities, constants, enums
│   ├── utils/                  # Generic helpers
│   └── modules/                # Feature modules (vertical slices)
│       ├── authentication/
│       ├── organizations/
│       ├── tenants/
│       ├── projects/
│       ├── assets/
│       ├── gateways/
│       ├── devices/
│       ├── sensors/
│       ├── telemetry/
│       ├── channels/
│       ├── widgets/
│       ├── dashboards/
│       ├── rules/
│       ├── alerts/
│       ├── notifications/
│       ├── analytics/
│       ├── reports/
│       ├── settings/
│       └── licensing/
├── .env                        # Local secrets (not committed)
├── .env.example                # Template – safe to commit
├── requirements.txt
├── Dockerfile
├── .gitignore
└── README.md
```

Each module follows the same internal structure:

```
<module>/
├── api/            # FastAPI routers
├── models/         # SQLAlchemy models
├── schemas/        # Pydantic schemas
├── services/       # Business logic
├── repositories/   # Database queries
├── dependencies.py # FastAPI Depends() helpers
└── __init__.py
```

---

## Getting Started

### Prerequisites

- Python 3.12+
- MySQL / MariaDB 8+
- InfluxDB 2.x
- Redis 7+

### Local Development Setup

```bash
# 1. Clone the repository
git clone <repo-url>
cd LocalIoTCloud/backend

# 2. Create and activate virtual environment
python -m venv .venv
# Windows
.\.venv\Scripts\Activate.ps1
# macOS / Linux
source .venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Configure environment
cp .env.example .env
# Edit .env with your local values

# 5. Run database migrations
alembic upgrade head

# 6. Start the development server
uvicorn app.main:app --reload
```

The API will be available at:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health

---

## Running with Docker

```bash
# Build the image
docker build -t localiotcloud-backend .

# Run with environment file
docker run --env-file .env -p 8000:8000 localiotcloud-backend
```

---

## API Versioning

All endpoints are prefixed with `/api/v1/`. Example routes:

```
GET  /api/v1/organizations
POST /api/v1/devices
GET  /api/v1/telemetry/{device_id}
POST /api/v1/auth/login
```

---

## Environment Variables

See [.env.example](.env.example) for all required variables and descriptions.

---

## License

Private — All rights reserved.
