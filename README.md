# 🎵 Wavely — A Music Streaming App on Google Cloud

Wavely is a music streaming application built with free royalty-free music from [Jamendo]Wavely is a royalty-free music streaming app built on Google Cloud Platform. I built it hands-on to understand the technical context of a **Cloud Customer Engineer** role — using as many GCP services as possible, each with a real justification.
 
**Live app:** [playwavely.web.app](https://playwavely.web.app)  
**Architecture & decisions:** [playwavely.web.app/presentation.html](https://playwavely.web.app/presentation.html)


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
