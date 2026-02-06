# AI-Enhanced Recommendation System

## Overview

The recommendation system uses a **multi-strategy scoring pipeline** that combines rule-based matching, popularity signals, and Google Gemini AI semantic analysis to suggest the best event packages for each user.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT (React)                       │
│                                                             │
│  ┌──────────────┐    ┌──────────────────────────────────┐   │
│  │ Recommendation│    │  "Personalized For You" Section  │   │
│  │    Form       │    │  (auto-loads for logged-in users)│   │
│  │ + AI Toggle   │    └──────────────┬───────────────────┘   │
│  └──────┬───────┘                    │                       │
│         │ POST /recommend            │ GET /recommendations/ │
│         │ { use_ai: true }           │     personalized      │
└─────────┼────────────────────────────┼───────────────────────┘
          │                            │
          ▼                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  BACKEND (Laravel)                           │
│                                                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              RecommendationController                  │ │
│  │                                                        │ │
│  │  recommend()        │    personalized()                │ │
│  │  - validates input  │    - requires auth               │ │
│  │  - optional AI      │    - auto-fills from prefs       │ │
│  │                     │    - always uses AI              │ │
│  └─────────┬───────────┴──────────────┬───────────────────┘ │
│            │                          │                     │
│            ▼                          ▼                     │
│  ┌─────────────────────────────────────────────────────┐    │
│  │            RecommendationService                    │    │
│  │                                                     │    │
│  │  enrichCriteriaWithPreferences()                    │    │
│  │  scorePackages(packages, criteria, useAI)           │    │
│  │  formatResults(scoredPackages, limit)               │    │
│  └──────────────────────┬──────────────────────────────┘    │
│                         │                                   │
│            ┌────────────┼────────────┐                      │
│            ▼            ▼            ▼                      │
│  ┌──────────────┐ ┌──────────┐ ┌──────────┐                │
│  │ Rule-Based   │ │Popularity│ │ AI (Gemini)│               │
│  │ Strategies   │ │ Strategy │ │ Strategy   │               │
│  │ (5 total)    │ │          │ │            │               │
│  └──────────────┘ └──────────┘ └──────────┘                │
└─────────────────────────────────────────────────────────────┘
```

---

## Scoring Strategies (7 Total)

Each package is scored by **all active strategies**, and scores are summed with weights:

| # | Strategy | Max Score | Weight | What It Does |
|---|----------|-----------|--------|--------------|
| 1 | **CategoryScoringStrategy** | 25 | 1.2× | Exact match on event type (wedding, birthday, etc.) |
| 2 | **BudgetScoringStrategy** | 25 | 1.5× | How well the package price fits within the user's budget |
| 3 | **CapacityScoringStrategy** | 25 | 1.0× | Whether the package can accommodate the guest count |
| 4 | **ThemeScoringStrategy** | 15 | 0.8× | Keyword matching between user's theme and package description |
| 5 | **PreferenceScoringStrategy** | 10 | 0.5× | Keyword matching for additional preferences (outdoor, photography, etc.) |
| 6 | **PopularityScoringStrategy** | 25 | 0.6× | Real booking count (0–15 pts) + average review rating (0–10 pts) |
| 7 | **AIScoringStrategy** | 30 | 1.0× | Gemini AI semantic analysis of theme/vibe match (only when AI is enabled) |

**Maximum possible weighted score:** ~147 points (rule-based) + 30 points (AI) = ~177 points

---

## Flow: Standard Recommendations

```
User fills form (type, guests, budget, theme, preferences)
         │
         │  Toggles "AI-Enhanced Matching" ON/OFF
         │
         ▼
  POST /api/recommend
  { type, budget, guests, theme, preferences, use_ai: true }
         │
         ▼
  Controller validates input
         │
         ├─ Queries EventPackage (filtered by type, or all)
         │
         ├─ If use_ai=false → check cache first
         │     ├─ Cache HIT → return cached results
         │     └─ Cache MISS → score & cache
         │
         ├─ If use_ai=true → always score fresh (bypasses cache)
         │
         ▼
  RecommendationService.scorePackages(packages, criteria, useAI)
         │
         ├─ For EACH package:
         │     ├─ Run 6 rule-based strategies → weighted sum
         │     ├─ If useAI=true:
         │     │     └─ AIScoringStrategy sends prompt to Gemini:
         │     │          "Rate how well this package matches
         │     │           the user's theme and preferences (0-30)"
         │     │          → Gemini returns { score, reason }
         │     │          → Cached 2 hours per package+criteria combo
         │     └─ Total = sum of all weighted scores
         │
         ├─ Sort packages by total score (descending)
         │
         ▼
  formatResults(top 5)
         │
         ├─ Normalize scores to 0–1 range
         ├─ Include ai_insight (Gemini's reasoning) if available
         │
         ▼
  Return JSON:
  {
    data: [ { id, name, price, score, ai_insight, ... } ],
    ai_enhanced: true,
    message: "Top 5 packages based on your criteria"
  }
         │
         ├─ If user is authenticated:
         │     ├─ Save recommendations to DB
         │     └─ Save preferences to event_preferences table
         │
         ▼
  Frontend displays results with AI insight badges on cards
```

---

## Flow: Personalized Recommendations (Auto-Load)

This fires **automatically** when an authenticated user visits the "For You" page, before they even fill out the form.

```
User opens ClientRecommendations page (authenticated)
         │
         ▼
  useEffect → fetchPersonalizedRecommendations()
         │
         ▼
  GET /api/recommendations/personalized
  (auth:sanctum protected)
         │
         ▼
  Controller checks authentication
         │
         ├─ Finds Client by email
         │
         ├─ Starts with empty/partial criteria
         │
         ├─ enrichCriteriaWithPreferences():
         │     ├─ Loads EventPreference record for this client
         │     ├─ Fills missing fields (type, budget, guests, theme)
         │     └─ Tracks which fields were auto-filled → enriched_fields[]
         │
         ├─ PreferenceSummaryService.generateSummary():
         │     ├─ Analyzes booking history
         │     ├─ Extracts preferred event type, budget range, themes
         │     └─ Fills remaining gaps in criteria
         │
         ├─ Queries ALL packages (no type filter)
         │
         ▼
  scorePackages(allPackages, enrichedCriteria, useAI=true)
         │
         │  (Always uses AI for personalized)
         │
         ▼
  formatResults(top 6)
         │
         ├─ Upserts recommendations in DB (updateOrCreate)
         │
         ▼
  Return JSON:
  {
    data: [...],
    ai_enhanced: true,
    personalized: true,
    enriched_fields: ["type", "budget (history)", "theme"]
  }
         │
         ▼
  Frontend shows "Personalized For You" card
  with top 3 packages + AI insights + enriched field tags
```

---

## Feedback Loop

The system creates a **learning cycle** where past interactions improve future recommendations:

```
  User submits form → preferences saved to event_preferences table
                             │
                             ▼
  User books a package → booking saved to booking_details table
                             │
                             ▼
  User leaves review → review saved to reviews table
                             │
                             ▼
  Next visit → personalized endpoint:
    ├─ Reads stored preferences (event_preferences)
    ├─ Analyzes booking history (booking_details)
    ├─ PopularityScoringStrategy reads reviews + booking counts
    └─ AI considers all of this → better recommendations
```

---

## New Files Created

| File | Purpose |
|------|---------|
| `app/Services/AI/GeminiService.php` | Reusable Gemini API wrapper (text, JSON, cached JSON generation) |
| `app/Services/ScoringStrategies/AIScoringStrategy.php` | Sends package+criteria to Gemini for semantic 0–30 scoring |
| `app/Services/ScoringStrategies/PopularityScoringStrategy.php` | Scores by real booking count + average review rating |

## Files Modified

| File | Changes |
|------|---------|
| `config/services.php` | Added `gemini` config block (api_key, model, base_url, etc.) |
| `app/Services/RecommendationService.php` | Added AI + Popularity strategies, `enrichCriteriaWithPreferences()`, `useAI` parameter |
| `app/Http/Controllers/Api/RecommendationController.php` | Added `use_ai` flag support, new `personalized()` endpoint |
| `routes/api.php` | Added `GET /api/recommendations/personalized` route |
| `src/pages/Dashboard/client/ClientRecommendations.jsx` | AI toggle, personalized section, AI insight badges on cards |

---

## API Endpoints

### `POST /api/recommend` (public)
Standard recommendation with optional AI enhancement.

**Request:**
```json
{
  "type": "wedding",
  "budget": 50000,
  "guests": 100,
  "theme": "rustic garden",
  "preferences": ["outdoor", "photography"],
  "use_ai": true
}
```

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Garden Wedding Package",
      "price": 45000,
      "score": 0.95,
      "match_score": 0.95,
      "justification": "Category match (weighted: 1.2x), Within budget ...",
      "ai_insight": "Strong thematic match — rustic garden aesthetic aligns well with outdoor venue and floral decor inclusions"
    }
  ],
  "ai_enhanced": true,
  "message": "Top 5 packages based on your criteria"
}
```

### `GET /api/recommendations/personalized` (auth required)
Auto-fills criteria from stored preferences and booking history, always uses AI.

**Response:**
```json
{
  "data": [...],
  "ai_enhanced": true,
  "personalized": true,
  "enriched_fields": ["type", "budget", "theme (history)"],
  "message": "Personalized recommendations based on your history and preferences"
}
```

---

## Caching Strategy

| What | TTL | Key Format |
|------|-----|------------|
| Standard recommendations (non-AI) | 1 hour | `rec_{md5(criteria)}` |
| AI scoring per package+criteria | 2 hours | `ai_score_{md5(package+criteria)}` |
| Package popularity stats | 1 hour | `pkg_stats_{package_id}` |
| AI requests bypass the standard cache | — | — |

---

## Gemini AI Prompt (AIScoringStrategy)

The prompt sent to Gemini for each package:

```
You are an event package recommendation engine.
Rate how well this package matches the user's criteria.

Package: {name}
Description: {description}
Category: {category}
Price: ₱{price}
Inclusions: {inclusions}

User wants:
- Event type: {type}
- Theme/vibe: {theme}
- Preferences: {preferences}

Score 0-30 based on:
- Theme/vibe match (0-15): How well the package aesthetic matches
- Inclusions/preferences match (0-15): How well inclusions cover needs

Respond in EXACT JSON: {"score": <0-30>, "reason": "<one sentence>"}
```

---

## Frontend UI Changes

1. **AI Toggle** — A switch on the form lets users turn AI-enhanced matching on/off (default: on)
2. **Personalized For You** — A card above the form shows 3 top AI-picked packages for returning users, with a refresh button
3. **AI Insight Badges** — Each result card can display a purple `Brain` icon with Gemini's reasoning
4. **Enriched Fields Indicator** — Shows which criteria were auto-filled ("Auto-filled: type, budget, theme")
5. **AI-Enhanced Banner** — Success banner indicates when results include AI analysis
