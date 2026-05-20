# 🎵 Wavely — A Music Streaming App on Google Cloud

Wavely is a music streaming application built with free royalty-free music from [Jamendo](https://www.jamendo.com). I built this project to start learning Google Cloud Platform — rather than following tutorials, I wanted to build something real and use as many GCP services as possible in a meaningful context.

**Live:** [playwavely.web.app](https://playwavely.web.app)

---

## ☁️ GCP Services Used

| Service | Purpose |
|---|---|
| **Google Kubernetes Engine (GKE)** | Runs the 3 backend microservices with horizontal autoscaling |
| **Firebase Hosting + Cloud CDN** | Serves the Angular SPA globally with CDN caching |
| **Firebase Authentication** | User authentication — email/password and Google OAuth2 |
| **Cloud Firestore** | NoSQL database for songs catalog, playlists, and liked songs |
| **Cloud Storage** | Object storage for 1000+ MP3 audio files |
| **Cloud Pub/Sub** | Async messaging — streams play/skip/like events from the API |
| **BigQuery** | Data warehouse — stores and queries 1M+ play events for analytics |
| **Artifact Registry** | Docker image registry for the 3 microservices |
| **Cloud Build** | Continuous Deployment — automatically builds and deploys on every git push |
| **Secret Manager** | Secure storage for Firebase tokens, API keys, and Angular environment config |
| **Cloud Armor** | DDoS protection and rate limiting in front of the load balancer |
| **Cloud IAM + Workload Identity** | Fine-grained access control — GKE pods authenticate to GCP without service account key files |
| **GKE Gateway** | L7 global external load balancer with HTTPS routing to the 3 services |
| **Certificate Manager** | SSL/TLS certificate for the GKE Gateway domain |

---

## 🏗️ Architecture

### High-Level Overview

```
                        ┌──────────────────────────────────┐
                        │         USER BROWSER             │
                        │   Angular 21 SPA                 │
                        │   Firebase Hosting + Cloud CDN   │
                        └──────────────┬───────────────────┘
                                       │ HTTPS
                                       ▼
                        ┌──────────────────────────────────┐
                        │         CLOUD ARMOR              │
                        │   DDoS protection                │
                        │   Rate limiting: 1000 req/10s    │
                        └──────────────┬───────────────────┘
                                       │
                                       ▼
                        ┌──────────────────────────────────┐
                        │         GKE GATEWAY              │
                        │   L7 Global Load Balancer        │
                        │   HTTPS + SSL termination        │
                        │   HTTPRoute path-based routing   │
                        └──────┬───────────┬──────────┬────┘
                               │           │          │
                    /songs/*   │  /playlists/*   /streaming/*
                               │           │          │
                               ▼           ▼          ▼
               ┌───────────────────┐ ┌──────────────────┐ ┌───────────────────┐
               │   songs-service   │ │playlists-service │ │ streaming-service │
               │   Node.js/Express │ │  Node.js/Express │ │  Node.js/Express  │
               │   port 3001       │ │  port 3002       │ │  port 3003        │
               │   2–10 pods (HPA) │ │  2–10 pods (HPA) │ │  2–10 pods (HPA)  │
               └────────┬──────────┘ └────────┬─────────┘ └────────┬──────────┘
                        │                     │                    │
                        │      ┌──────────────┘                    │
                        │      │                                   │
                        ▼      ▼                                   ▼
               ┌────────────────────────┐              ┌────────────────────────┐
               │       FIRESTORE        │              │       PUB/SUB          │
               │  - songs (1000 docs)   │              │  wavely-play-events    │
               │  - playlists           │              │  topic                 │
               │  - likes               │              └────────────┬───────────┘
               └────────────────────────┘                           │
                        │                                           │ BigQuery
                        │                                           │ subscription
               ┌────────────────────────┐                           ▼
               │    CLOUD STORAGE       │              ┌────────────────────────┐
               │  mini-spotify-audio    │              │       BIGQUERY         │
               │  1000 MP3 files        │              │  wavely_analytics      │
               └────────────────────────┘              │  play_events table     │
                                                       │  1M+ rows              │
                                                       └────────────┬───────────┘
                                                                    │
                                                                    │ SQL queries
                                                                    ▼
                                                       ┌────────────────────────┐
                                                       │    songs-service       │
                                                       │  /songs/trending       │
                                                       │  /songs/recommendations│
                                                       └────────────────────────┘
```

### Authentication & Security Flow

```
  Browser                Firebase Auth           GKE Services
     │                        │                       │
     │── login() ────────────>│                       │
     │<─ JWT token ───────────│                       │
     │                        │                       │
     │── API request ─────────────────────────────── >│
     │   Authorization: Bearer <JWT>                  │
     │                        │                       │
     │                        │<── verifyIdToken() ───│ (Firebase Admin SDK)
     │                        │─── user.uid ─────────>│
     │                        │                       │
     │<────────────────────── response ───────────────│
```

### Event-Driven Analytics Pipeline

```
  User                Streaming Service         Pub/Sub              BigQuery
   │                        │                     │                     │
   │── plays a song ────────>│                     │                     │
   │                        │── publishEvent() ──>│                     │
   │<── 200 OK (instant) ───│                     │                     │
   │                        │                     │── subscription ────>│
   │                        │                     │   (automatic)       │
   │                        │                     │                     │── INSERT row
   │                        │                     │                     │   { userId,
   │                        │                     │                     │     songId,
   │                        │                     │                     │     genre,
   │                        │                     │                     │     eventType,
   │                        │                     │                     │     timestamp }
```

The key design decision here is that the API responds immediately to the user (the play event is fire-and-forget). The write to BigQuery happens asynchronously via Pub/Sub — the user never waits for it.

### Recommendation Pipeline

```
  Frontend                   songs-service              BigQuery / Firestore
     │                            │                            │
     │── GET /songs/recommendations/:userId ─────────────────>│
     │                            │                            │
     │                            │── SELECT genre, COUNT(*)  │
     │                            │   FROM play_events         │
     │                            │   WHERE userId = '...'     │
     │                            │   GROUP BY genre           │
     │                            │   ORDER BY plays DESC      │
     │                            │   LIMIT 3 ────────────────>│
     │                            │<── ['folk','jazz','chillout']
     │                            │                            │
     │                            │── WHERE genre IN (top 3) ->│ (Firestore)
     │                            │<── 20 songs ───────────────│
     │<── personalized songs ─────│
```

### Continuous Deployment Pipeline

```
  Developer               GitHub              Cloud Build             GCP
     │                      │                     │                    │
     │── git push main ─────>│                     │                    │
     │                      │── trigger ─────────>│                    │
     │                      │                     │                    │
     │                      │              Build songs-service          │
     │                      │              docker buildx ──────────────>│ Artifact Registry
     │                      │                     │                    │
     │                      │              Build playlists-service ────>│ Artifact Registry
     │                      │                     │                    │
     │                      │              Build streaming-service ────>│ Artifact Registry
     │                      │                     │                    │
     │                      │              kubectl rollout restart ────>│ GKE
     │                      │                     │                    │
     │                      │              gcloud secrets access ──────>│ Secret Manager
     │                      │              → environment.ts             │
     │                      │                     │                    │
     │                      │              ng build                     │
     │                      │              firebase deploy ────────────>│ Firebase Hosting
```

---

## 🧩 Architectural Decisions & Justifications

### Why GKE instead of Cloud Run?

Cloud Run would have been simpler and cheaper. I chose GKE because:
- **Learning goal**: GKE gave me exposure to Kubernetes concepts — pods, deployments, services, ingress, HPA
- **Horizontal Pod Autoscaler**: Each service scales independently from 2 to 10 pods based on CPU (70% threshold)
- **Workload Identity**: Native GCP identity for pods without managing key files
- **GKE Gateway**: Gives fine-grained L7 routing control per path prefix

In a real project with simpler needs, Cloud Run would probably be the right choice.

### Why Pub/Sub instead of writing directly to BigQuery?

I could have written play events directly from the streaming service to BigQuery. Pub/Sub adds a layer but brings real benefits:
- **Decoupling**: The streaming service doesn't know or care where events go. It just publishes
- **Reliability**: If BigQuery is unavailable, messages stay in Pub/Sub for up to 7 days and are retried automatically
- **Extensibility**: Adding a new consumer (e.g. a real-time recommendation engine) means adding a new subscription — the streaming service code doesn't change
- **Response time**: The API responds immediately. BigQuery writes happen asynchronously in the background

### Why Firestore instead of Cloud SQL?

- **Scalability**: Firestore scales automatically — no connection pool management
- **Schema flexibility**: Song metadata from Jamendo is inconsistent — Firestore handles missing fields gracefully
- **Firebase integration**: Works natively with Firebase Auth security rules
- **No operations**: No database server to manage, patch, or back up

For a music catalog that needs complex relational queries, Cloud SQL or Cloud Spanner would be more appropriate. For this project, Firestore was a pragmatic choice.

### Why BigQuery for analytics?

- **Designed for analytical queries**: Aggregating 1M rows by genre or play count is fast
- **Pub/Sub native integration**: The BigQuery subscription handles ingestion automatically — no consumer code to write
- **SQL interface**: Easy to explore and query data
- **Separation of concerns**: Operational data (songs, playlists) stays in Firestore. Analytical data (play events) goes to BigQuery. Each is optimized for its use case

### Why Cloud Armor?

The GKE Gateway is publicly accessible. Without rate limiting, a single script could send thousands of requests per second and take down the service. Cloud Armor sits in front of the load balancer and throttles any IP exceeding 1000 requests per 10 seconds with an HTTP 429 response.

### Why Secret Manager?

The Angular `environment.ts` file contains Firebase API keys. Committing this to GitHub would expose the keys publicly. Secret Manager stores it encrypted, and Cloud Build fetches it at build time — the file is never in the repository.

### Why Workload Identity?

Without Workload Identity, GKE pods would need a service account key file (a JSON file with credentials) to authenticate to GCP services like Firestore and BigQuery. Key files are a security risk — they can be leaked, they don't expire automatically, and they're hard to rotate. Workload Identity links the Kubernetes service account to a GCP service account using GCP's internal identity infrastructure — no key files needed.

---

## 🛠️ Tech Stack

### Frontend
- **Angular 21** — Standalone components, no NgModule
- **TypeScript**
- **RxJS BehaviorSubjects** — Shared state across components (player state, playlists, liked songs)
- **MediaSession API** — Hardware media key and lock screen integration

### Backend (3 Microservices on GKE)
- **Node.js + Express + TypeScript**
- **Firebase Admin SDK** — Server-side JWT verification and Firestore access
- **@google-cloud/bigquery** — Analytics queries from songs-service
- **@google-cloud/pubsub** — Event publishing from streaming-service

### Infrastructure
- **Docker** — Containerized microservices
- **Kubernetes** — Orchestration on GKE
- **Cloud Build** — CD pipeline triggered on git push to main

---

## 📱 Features

- Stream 1000+ free royalty-free songs from Jamendo
- Persistent music player across page navigation
- ±15 second skip, shuffle, loop (one/all) modes
- Volume control, progress bar, MediaSession API
- **Trending** — Top songs by real play count from BigQuery
- **For You** — Personalized recommendations based on listening history in BigQuery
- **Random Picks** — Shuffled selection, deduplicated across all sections
- Search across all songs and artists
- Like/unlike songs with real-time sync across components
- Create playlists, add/remove songs
- Browse 80+ genres with search

---

## 📊 Data

| | |
|---|---|
| Songs in catalog | 1,000 (Jamendo, Creative Commons) |
| MP3 files in Cloud Storage | 1,000 |
| Test users | 51 (50 fake + 1 real) |
| Play events in BigQuery | 1,000,000+ (seeded with realistic genre preferences per user) |
| GKE nodes | 2 × e2-medium |
| Pods per service (normal) | 2 |
| Pods per service (peak, HPA) | up to 10 |

---

## 📁 Project Structure

```
mini-spotify-gcp/
├── frontend/                      # Angular 21 SPA
│   └── src/app/
│       ├── components/
│       │   ├── home/              # Trending, For You, Random, Genres sections
│       │   ├── search/            # Full-text search
│       │   ├── library/           # Liked songs + playlists
│       │   ├── genres/            # Genre browser with search
│       │   └── layout/            # Shell: sidebar, player bar, modals
│       ├── services/
│       │   ├── player.ts          # Shared audio state (BehaviorSubjects)
│       │   ├── songs.ts           # Songs, trending, recommendations API
│       │   ├── playlists.ts       # Playlists + shared likedIds$ state
│       │   └── auth.ts            # Firebase Auth wrapper
│       └── utils/
│           └── genre-colors.ts    # Color map for 80+ genres
│
├── backend-gke/
│   ├── songs-service/             # /songs — catalog, search, trending, recommendations
│   ├── playlists-service/         # /playlists — CRUD + song management
│   └── streaming-service/         # /streaming — play/skip/like events + Pub/Sub
│
├── k8s/
│   ├── *-deployment.yaml          # Deployments for each service
│   ├── gateway.yaml               # GKE Gateway (L7 load balancer)
│   ├── httproute.yaml             # Path-based routing rules
│   └── hpa.yaml                   # Horizontal Pod Autoscaler
│
└── cloudbuild.yaml                # CD pipeline
```

---

## 🔭 What I would do next

- **Vertex AI Recommendations AI** — Train a real collaborative filtering model on the BigQuery play events. The data pipeline is already designed for this. The current "For You" section uses a BigQuery genre-affinity query, which is not ML
- **Memorystore (Redis)** — Cache trending songs to reduce BigQuery query latency on every page load
- **Cloud Spanner** — For stronger consistency guarantees if the app needed transactional operations across multiple documents
- **Private GKE cluster** — Move nodes to a VPC without public IPs, expose only the Gateway
- **Automated tests** — Add unit and integration tests to the CD pipeline to make it a proper CI/CD setup

---

## 👨‍💻 Author

**Mehrdad Zeinali**  
Software Engineering Apprentice — BNP Paribas CIB