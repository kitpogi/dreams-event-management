# Recommendation System — Complete Documentation

## Overview

The D'Dreams recommendation system suggests event packages to users based on their preferences (event type, budget, guest count, theme, and keywords). It uses a **weighted multi-strategy scoring algorithm** — not AI/ML — to rank packages by relevance.

---

## Table of Contents

1. [How It Works (Summary)](#how-it-works-summary)
2. [User Flow](#user-flow)
3. [Entry Points](#entry-points)
4. [API Endpoints](#api-endpoints)
5. [Scoring Algorithm](#scoring-algorithm)
6. [Caching](#caching)
7. [Database Tables](#database-tables)
8. [File Reference](#file-reference)
9. [Flow Diagram](#flow-diagram)

---

## How It Works (Summary)

1. User fills out a preference form (event type, guests, budget, theme, preferences)
2. Frontend sends a `POST /api/recommend` request
3. Backend fetches matching packages, scores each using 5 weighted strategies
4. Top 5 packages are returned with normalized scores (0–100%)
5. If the user is authenticated, results and preferences are saved to the database
6. Frontend displays results with match percentages, justifications, filtering, sorting, and comparison

---

## User Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER ENTERS PREFERENCES                       │
│                                                                  │
│  Event Type: [Wedding ▼]     Guests: [150]                      │
│  Budget:     [₱50,000]       Theme:  [Elegant, Modern]          │
│  Preferences: [outdoor, garden, buffet]                          │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │  POST /api/recommend   │
              │  { type, budget,       │
              │    guests, theme,      │
              │    preferences[] }     │
              └────────┬───────────────┘
                       │
                       ▼
              ┌────────────────────────┐
              │    CHECK CACHE         │
              │  (MD5 hash of input)   │
              └────┬───────────┬───────┘
                   │           │
              HIT  │           │  MISS
                   │           │
                   │           ▼
                   │  ┌──────────────────────────┐
                   │  │  LOAD PACKAGES            │
                   │  │  (filter by type or all)  │
                   │  └────────┬─────────────────┘
                   │           │
                   │           ▼
                   │  ┌──────────────────────────────────┐
                   │  │     SCORE EACH PACKAGE            │
                   │  │                                   │
                   │  │  ├─ Category Match    (×1.2)      │
                   │  │  ├─ Budget Fit        (×1.5)      │
                   │  │  ├─ Capacity Match    (×1.0)      │
                   │  │  ├─ Theme Keywords    (×0.8)      │
                   │  │  └─ Preference Match  (×0.5)      │
                   │  │                                   │
                   │  │  Total = sum of weighted scores   │
                   │  └────────┬─────────────────────────┘
                   │           │
                   │           ▼
                   │  ┌──────────────────────────┐
                   │  │  SORT BY SCORE (desc)     │
                   │  │  TAKE TOP 5               │
                   │  │  NORMALIZE TO 0–1         │
                   │  │  CACHE RESULTS (1 hour)   │
                   │  └────────┬─────────────────┘
                   │           │
                   ▼           ▼
              ┌─────────────────────────────────────┐
              │  IF AUTHENTICATED:                   │
              │  ├─ Save to recommendations table    │
              │  └─ Save to event_preferences table  │
              └────────┬────────────────────────────┘
                       │
                       ▼
              ┌─────────────────────────────────────┐
              │  RETURN TOP 5 PACKAGES               │
              │  { data: [...], message: "Top 5..." } │
              └────────┬────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│                    FRONTEND DISPLAYS RESULTS                      │
│                                                                   │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │ Package A        │  │ Package B        │  │ Package C        │ │
│  │ ████████░░ 92%   │  │ ██████░░░░ 78%   │  │ █████░░░░░ 65%   │ │
│  │ ₱45,000 · 200pax │  │ ₱38,000 · 150pax │  │ ₱52,000 · 180pax │ │
│  │ [View] [Book]    │  │ [View] [Book]    │  │ [View] [Book]    │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
│                                                                   │
│  Features: Filter | Sort | Search | Compare (up to 3)            │
└──────────────────────────────────────────────────────────────────┘
```

---

## Entry Points

Users can access the recommendation system from 3 places:

| Route                        | Page                   | Auth Required | Description                                                         |
| ---------------------------- | ---------------------- | ------------- | ------------------------------------------------------------------- |
| `/recommendations`           | Public Recommendations | No            | Full preference form + results page                                 |
| `/dashboard/recommendations` | Client "For You"       | Yes           | Dashboard version for logged-in clients                             |
| `/set-an-event`              | Set An Event           | No            | Multi-step form; Step 1 collects info, Step 2 shows recommendations |

---

## API Endpoints

### Core Recommendation

| Method | Endpoint         | Auth                  | Purpose                          |
| ------ | ---------------- | --------------------- | -------------------------------- |
| `POST` | `/api/recommend` | Public (rate-limited) | Generate package recommendations |

**Request Body:**

```json
{
  "type": "Wedding",
  "budget": 50000,
  "guests": 150,
  "theme": "Elegant, Modern",
  "preferences": ["outdoor", "garden", "buffet"]
}
```

**Response:**

```json
{
  "data": [
    {
      "package_id": 12,
      "package_name": "Royal Wedding Package",
      "package_description": "...",
      "package_price": 45000,
      "capacity": 200,
      "package_category": "Wedding",
      "package_image": "...",
      "score": 0.92,
      "reason": "Type match (+40), Within budget (+30), Capacity suitable (+25), Theme match (+15)"
    }
  ],
  "message": "Top 5 matching packages"
}
```

### User Preferences

| Method  | Endpoint                   | Auth | Purpose                                           |
| ------- | -------------------------- | ---- | ------------------------------------------------- |
| `GET`   | `/api/preferences`         | Yes  | Get saved preferences                             |
| `POST`  | `/api/preferences`         | Yes  | Save/update preferences                           |
| `PATCH` | `/api/preferences`         | Yes  | Partially update preferences                      |
| `GET`   | `/api/preferences/summary` | Yes  | Get preference summary + booking history analysis |

---

## Scoring Algorithm

The system uses a **Strategy Pattern** with 5 independent scoring strategies. Each package is evaluated against all 5, then scores are combined with weights.

### Strategy Breakdown

#### 1. Budget Scoring (Weight: ×1.5 — Highest Priority)

| Condition                           | Raw Score     |
| ----------------------------------- | ------------- |
| Package price ≤ budget              | **40 points** |
| Package price up to 15% over budget | **20 points** |
| Package price 15–25% over budget    | **5 points**  |
| Package price >25% over budget      | **0 points**  |

> Budget has the highest weight because affordability is the most practical concern.

#### 2. Category Scoring (Weight: ×1.2)

| Condition                                       | Raw Score     |
| ----------------------------------------------- | ------------- |
| Package category exactly matches requested type | **40 points** |
| No match                                        | **0 points**  |

#### 3. Capacity Scoring (Weight: ×1.0)

| Condition                                   | Raw Score     |
| ------------------------------------------- | ------------- |
| Package capacity within ±20% of guest count | **25 points** |
| Package capacity within ±50% of guest count | **15 points** |
| Package capacity larger but >50% difference | **5 points**  |
| Too small                                   | **0 points**  |

#### 4. Theme Scoring (Weight: ×0.8)

| Condition                                             | Raw Score     |
| ----------------------------------------------------- | ------------- |
| First theme keyword found in package name/description | **15 points** |
| Each additional keyword match                         | **+5 points** |
| Maximum                                               | **25 points** |

> Theme keywords are split by commas and searched case-insensitively in the package name and description.

#### 5. Preference Scoring (Weight: ×0.5 — Lowest Priority)

| Condition                                                 | Raw Score     |
| --------------------------------------------------------- | ------------- |
| Each preference keyword found in package name/description | **+5 points** |
| No cap                                                    | Varies        |

### Score Calculation Example

```
Package: "Royal Wedding Package" — ₱45,000, 200 pax, category: Wedding
User Input: type=Wedding, budget=₱50,000, guests=150, theme="Elegant", preferences=["outdoor"]

Category:    40 × 1.2 = 48.0  (exact match: Wedding)
Budget:      40 × 1.5 = 60.0  (₱45,000 ≤ ₱50,000)
Capacity:    15 × 1.0 = 15.0  (200 is within 50% of 150)
Theme:       15 × 0.8 = 12.0  ("elegant" found in description)
Preferences:  5 × 0.5 =  2.5  ("outdoor" found in description)
                        ─────
Total:                  137.5
```

### Score Normalization

After scoring all packages, scores are **normalized to 0–1** by dividing each score by the highest score in the result set. The frontend then displays this as a percentage (e.g., `0.92` → `92% match`).

```
Package A: 137.5 → 137.5/137.5 = 1.00 → 100%
Package B: 110.0 → 110.0/137.5 = 0.80 →  80%
Package C:  85.0 →  85.0/137.5 = 0.62 →  62%
```

---

## Caching

| Aspect           | Detail                                                                     |
| ---------------- | -------------------------------------------------------------------------- |
| **Cache Key**    | MD5 hash of normalized criteria (type, budget, guests, theme, preferences) |
| **TTL**          | 1 hour (3600 seconds)                                                      |
| **Invalidation** | Automatic when any `EventPackage` is created or updated                    |
| **Driver**       | Uses Laravel's default cache driver (configured in `.env`)                 |

---

## Database Tables

### `recommendations`

Stores generated recommendations per user.

| Column              | Type                      | Description                                |
| ------------------- | ------------------------- | ------------------------------------------ |
| `recommendation_id` | int (PK)                  | Auto-increment ID                          |
| `client_id`         | int (FK → clients)        | The client who received the recommendation |
| `package_id`        | int (FK → event_packages) | The recommended package                    |
| `score`             | decimal                   | Normalized score (0–1)                     |
| `reason`            | text                      | Comma-separated justification string       |
| `created_at`        | timestamp                 | When the recommendation was generated      |

### `event_preferences`

Stores user preferences for future personalization.

| Column                  | Type     | Description                    |
| ----------------------- | -------- | ------------------------------ |
| `preference_id`         | int (PK) | Auto-increment ID              |
| `client_id`             | int (FK) | Client ID                      |
| `user_id`               | int (FK) | User ID                        |
| `preferred_event_type`  | varchar  | e.g., "Wedding"                |
| `preferred_budget`      | decimal  | Budget amount                  |
| `preferred_theme`       | varchar  | e.g., "Elegant, Modern"        |
| `preferred_guest_count` | int      | Number of guests               |
| `preferred_venue`       | varchar  | Venue preference               |
| `preferences`           | JSON     | Additional preference keywords |

### `event_packages`

The packages being scored and recommended.

| Column                | Type     | Description                                      |
| --------------------- | -------- | ------------------------------------------------ |
| `package_id`          | int (PK) | Auto-increment ID                                |
| `package_name`        | varchar  | Package display name                             |
| `package_description` | text     | Full description (searched for keyword matching) |
| `package_price`       | decimal  | Price (used for budget scoring)                  |
| `capacity`            | int      | Max guests (used for capacity scoring)           |
| `package_category`    | varchar  | Category (used for category scoring)             |
| `package_image`       | varchar  | Image path                                       |

---

## File Reference

### Backend

| Type       | File                                                           | Purpose                                                                |
| ---------- | -------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Controller | `app/Http/Controllers/Api/RecommendationController.php`        | Handles `/recommend` endpoint, validates input, orchestrates scoring   |
| Controller | `app/Http/Controllers/Api/EventPreferenceController.php`       | CRUD for user preferences, generates preference summaries              |
| Service    | `app/Services/RecommendationService.php`                       | Core scoring engine — iterates strategies, sums weights, sorts results |
| Service    | `app/Services/PreferenceSummaryService.php`                    | Analyzes booking history, stores/retrieves preferences                 |
| Cache      | `app/Services/Cache/RecommendationCacheService.php`            | MD5-based caching layer for recommendation results                     |
| Strategy   | `app/Services/ScoringStrategies/CategoryScoringStrategy.php`   | Category match scoring                                                 |
| Strategy   | `app/Services/ScoringStrategies/BudgetScoringStrategy.php`     | Budget fit scoring                                                     |
| Strategy   | `app/Services/ScoringStrategies/CapacityScoringStrategy.php`   | Guest count/capacity scoring                                           |
| Strategy   | `app/Services/ScoringStrategies/ThemeScoringStrategy.php`      | Theme keyword matching                                                 |
| Strategy   | `app/Services/ScoringStrategies/PreferenceScoringStrategy.php` | Preference keyword matching                                            |
| Interface  | `app/Services/ScoringStrategies/ScoringStrategyInterface.php`  | Contract all strategies implement                                      |
| Interface  | `app/Services/Contracts/RecommendationServiceInterface.php`    | Service contract                                                       |
| Model      | `app/Models/Recommendation.php`                                | Recommendation Eloquent model                                          |
| Model      | `app/Models/EventPreference.php`                               | Preference Eloquent model                                              |
| Repository | `app/Repositories/RecommendationRepository.php`                | DB operations for recommendations                                      |

### Frontend

| Type    | File                                                   | Purpose                                           |
| ------- | ------------------------------------------------------ | ------------------------------------------------- |
| Page    | `src/pages/public/Recommendations.jsx`                 | Public recommendation form + results (1353 lines) |
| Page    | `src/pages/Dashboard/client/ClientRecommendations.jsx` | Dashboard "For You" page (930 lines)              |
| Page    | `src/pages/public/SetAnEvent.jsx`                      | Multi-step event setup with recommendations       |
| Service | `src/api/services/recommendationService.js`            | API service wrapper                               |

---

## Flow Diagram

```
                    ┌──────────────────────┐
                    │      3 ENTRY POINTS   │
                    ├──────────────────────┤
                    │ /recommendations      │ (Public)
                    │ /dashboard/recommendations │ (Client)
                    │ /set-an-event         │ (Public)
                    └──────────┬───────────┘
                               │
                    User fills preference form
                               │
                               ▼
                    ┌──────────────────────┐
                    │ POST /api/recommend   │
                    │ rate-limited          │
                    └──────────┬───────────┘
                               │
                    ┌──────────▼───────────┐
                    │  RecommendationController  │
                    │  - Validates input          │
                    │  - Normalizes criteria      │
                    └──────────┬─────────────────┘
                               │
                    ┌──────────▼───────────┐
                    │  RecommendationCacheService │
                    │  Key: MD5(criteria)          │
                    ├─────────┬────────────────────┤
                    │  HIT    │         MISS        │
                    │  ↓      │           ↓         │
                    │ Return  │  RecommendationService │
                    │ cached  │  scorePackages():     │
                    │         │                       │
                    │         │  FOR each package:    │
                    │         │  ├─ CategoryScore ×1.2│
                    │         │  ├─ BudgetScore  ×1.5 │
                    │         │  ├─ CapacityScore×1.0 │
                    │         │  ├─ ThemeScore   ×0.8 │
                    │         │  └─ PrefScore    ×0.5 │
                    │         │                       │
                    │         │  Sort → Top 5         │
                    │         │  Normalize → 0–1      │
                    │         │  Cache (1hr TTL)       │
                    └─────────┴───────────────────────┘
                               │
                    ┌──────────▼───────────┐
                    │  If authenticated:    │
                    │  → Save recommendations │
                    │  → Save preferences    │
                    └──────────┬───────────┘
                               │
                    ┌──────────▼───────────┐
                    │  Return JSON response │
                    │  Top 5 packages with  │
                    │  scores & reasons     │
                    └──────────┬───────────┘
                               │
                    ┌──────────▼───────────────────┐
                    │  FRONTEND RENDERS             │
                    │  - Package cards with match % │
                    │  - Justification breakdown    │
                    │  - Filter / Sort / Search     │
                    │  - Compare up to 3 packages   │
                    │  - Save for Later (localStorage) │
                    │  - Book Now / View Details     │
                    └──────────────────────────────┘
```

---

## Notes

- **No AI/ML is used.** The sidebar labels "AI suggestions" but the algorithm is deterministic weighted scoring.
- **Preferences are saved** but not automatically re-used. Each recommendation request uses only the criteria submitted in that request.
- **Feedback buttons** (thumbs up/down) exist in the frontend UI but are not connected to a backend endpoint yet.
- **Cache invalidation** happens automatically when packages are created or updated.
- The **"Set An Event"** form also creates a `ContactInquiry` record in addition to generating recommendations.
