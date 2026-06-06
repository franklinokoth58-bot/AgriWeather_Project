# AgriWeather KE 🌿

Designed By: Franklin Okoth Onyango
mail: franklinokoth002@gmail.com

Agricultural weather intelligence dashboard for Kenyan farmers, powered by the [WeatherAI REST API](https://weather-ai.co/docs).

![AgriWeather KE Screenshot](screenshot-placeholder.png)

## Features

- **Auto-location detection** — fetches weather instantly via IP geolocation
- **7-day forecast** with expandable hourly breakdown per day
- **Gemini AI summary** with English / Swahili toggle
- **Crop advisory panel** — actionable farming advice derived from live weather data
- **Hourly temperature + rain chart** built with Recharts
- **Farm Tree Analyzer** — upload aerial/satellite imagery for AI-powered tree count, canopy coverage, and health analysis
- **API usage panel** — real-time request quota tracking
- **Dark mode** with system preference detection
- **Responsive** — works on mobile (375px) to desktop (1440px)
- **Smooth skeletons** and Framer Motion card animations

---

## Prerequisites

- Node.js 18+
- A WeatherAI API key from [weather-ai.co](https://weather-ai.co)

---

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/your-username/agriweather-ke.git
cd agriweather-ke
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy the example env file and add your API key:

```bash
cp .env.example .env.local
```

Then edit `.env.local`:

```
VITE_WEATHER_API_KEY=wai_your_actual_key_here
```

>  Never commit `.env.local` — it is listed in `.gitignore`.

### 4. Start the development server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Build & Deploy to Netlify

### Build

```bash
npm run build
```

The production bundle is output to `dist/`.

### Deploy (drag-and-drop)

1. Run `npm run build`
2. Drag the `dist/` folder to [app.netlify.com/drop](https://app.netlify.com/drop)

### Deploy (GitHub integration)

1. Push the repo to GitHub
2. Connect the repo in Netlify's dashboard
3. Set build command: `npm run build`, publish directory: `dist`
4. Add `VITE_WEATHER_API_KEY` as an environment variable in Netlify

The `netlify.toml` at the project root handles SPA routing redirects automatically.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `VITE_WEATHER_API_KEY` |  | Your WeatherAI Bearer token (`wai_...`) |

---

## API Endpoints Used

| Endpoint | Purpose |
|---|---|
| `GET /v1/weather-geo` | Auto-detect location + full weather on app start |
| `GET /v1/weather` | Full forecast by coords or city name (manual search) |
| `GET /v1/current` | Refresh current conditions only |
| `GET /v1/hourly` | Hour-by-hour breakdown for today |
| `GET /v1/usage` | Plan usage stats |
| `POST /v1/trees/analyze` | Farm image tree analysis |
| `GET /v1/trees/quota` | Tree analysis quota check |

---

## Tech Stack

| Layer | Library |
|---|---|
| Framework | React 18 + Vite |
| Styling | Tailwind CSS v4 |
| HTTP | Axios |
| Data fetching | TanStack Query (React Query) |
| Charts | Recharts |
| Animations | Framer Motion |
| Date formatting | date-fns |
| Deployment | Netlify |

---

## Docker Setup

**Prerequisite:** [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.

The project ships with a **3-stage Dockerfile**:

| Stage | Base image | Purpose |
|---|---|---|
| `development` | `node:18-alpine` | Vite dev server with HMR |
| `builder` | `node:18-alpine` | Compiles the production bundle |
| `production` | `nginx:alpine` | Serves the compiled bundle |

> `.env.local` is listed in `.dockerignore` so your API key is **never baked into the image**. Pass it at runtime via `env_file` in `docker-compose.yml`, or use Docker secrets / CI environment variables in production.

---

### Development mode (hot-module replacement)

```bash
docker-compose up agriweather-dev
```

Open [http://localhost:5173](http://localhost:5173).

Source files are bind-mounted into the container, so every save triggers an instant HMR update — no rebuild needed.

---

### Production mode (nginx)

```bash
docker-compose --profile prod up agriweather-prod
```

Open [http://localhost:80](http://localhost:80).

The `prod` profile keeps this service opt-in — a plain `docker-compose up` won't start it accidentally.

---

### Build the production image only (no compose)

```bash
docker build --target production -t agriweather-ke .
```

Run it:

```bash
docker run -p 80:80 --env-file .env.local agriweather-ke
```

---

### Docker file overview

```
agriweather-ke/
├── Dockerfile          # 3-stage build (development → builder → production)
├── docker-compose.yml  # dev + prod services
├── nginx.conf          # SPA routing, asset caching, gzip, security headers
└── .dockerignore       # Excludes node_modules, dist, .env.local, .git
```
