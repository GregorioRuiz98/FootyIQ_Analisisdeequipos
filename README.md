# Footy IQ

Footy IQ is a full stack web application for football data analysis. It centralizes the consultation of competitions, teams, players and matches, persists imported information in MongoDB and provides a clean interface for football-oriented analysis workflows.

## Highlights

- Secure authentication with JWT.
- Data ingestion from FotMob through a dedicated FastAPI scraper.
- Persisted football data in MongoDB.
- Match, team, player and competition views.
- Favorites system for quick access to tracked entities.
- Local network access from Android devices.
- Docker and local development scripts.

## Architecture

Footy IQ uses a modular architecture:

- `frontend`: React + TypeScript + Vite SPA.
- `backend`: Spring Boot REST API for security, business logic and persistence.
- `scraper`: FastAPI microservice for external football data extraction.
- `mongodb`: document database.

## Tech Stack

- Frontend: React 18, TypeScript, Vite, Axios, React Router, Recharts, jsPDF.
- Backend: Java 21, Spring Boot 3, Spring Security, Spring Data MongoDB, Maven.
- Scraper: Python 3, FastAPI, Uvicorn, HTTPX, BeautifulSoup, Playwright/CDP.
- Infrastructure: Docker, Docker Compose, PowerShell scripts.

## Repository Structure

```text
backend/      Spring Boot API
frontend/     React SPA
scraper/      FastAPI scraper
docs/         user and technical documentation
scripts/      local development scripts
```

## Quick Start

### One-Time Setup (New PC)

Before running the app for the first time on a new machine:

```powershell
.\instalar-requisitos-footyiq.bat
```

This installs Node, Java 21, Maven, Python, project dependencies and Playwright Chromium for the scraper.

### Docker Compose

```powershell
docker compose up --build
```

Services:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8080/api`
- Scraper: `http://localhost:8001`
- MongoDB: `localhost:27017`

### Local Development Launcher

```powershell
.\abrir-footyiq.bat
```

This launcher starts the local stack, opens Chrome for FotMob validation when required and opens the application.

### Backend Restart Helper

```powershell
.\reiniciar-backend.bat
```

Useful when port `8080` is blocked or the backend needs a clean restart.

## Android / LAN Access

Footy IQ can be opened from Android devices on the same local network:

1. Start the app on your PC.
2. Get the PC local IP with `ipconfig`.
3. Open `http://<PC_IP>:5173` on Android.

The PC and phone must be on the same network. If the page does not load, allow inbound traffic on ports `5173`, `8080` and `8001`.

## API and Health Checks

- Backend health: `http://localhost:8080/api/public/health`
- Scraper health: `http://localhost:8001/health`
- Scraper browser health: `http://localhost:8001/browser/health`
- Swagger UI: `http://localhost:8080/swagger-ui.html`

## Documentation

- User manual: `docs/manual-de-uso.md`
- Technical documentation: `docs/documentacion-aplicacion.md`

## Project Status

This project is maintained as an academic full stack application for football analytics, focused on service integration, persistence, authentication and external data ingestion.
