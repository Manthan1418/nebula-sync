# Nebula Sync Recommendation Plan

## Goal
Build a Spotify-inspired recommendation system that suggests the next songs a user should hear while they are currently listening in a room or solo session. The system should start simple, support fast iteration, and gradually evolve into a personalized ranking pipeline.

## Product Scope
- Next-song suggestions for the currently playing track.
- Personalized "Up Next" recommendations.
- Autoplay when the queue ends.
- Room-aware suggestions that respect the shared listening context.
- A later "radio from this track" mode.

## Core Principles
- Start with implicit feedback instead of requiring likes or ratings.
- Separate short-term session taste from long-term user taste.
- Use a two-stage system: candidate generation first, ranking second.
- Keep recommendations explainable with a short reason for each suggestion.
- Optimize for continuation, not only clicks.

## Available Backend Foundations
The current backend already provides useful building blocks:
- Room state, queue, and playback history in `server/app/rooms.py`.
- Track catalog and search in `server/app/music.py`.
- Playback metadata in `server/app/models.py`.
- REST and WebSocket transport in `server/app/main.py`.

## Data We Need To Capture
### Interaction Events
Log every meaningful user action:
- play
- pause
- skip
- replay
- add to queue
- remove from queue
- search to play
- recommendation accepted
- recommendation dismissed
- session ended

### Context For Each Event
Store these fields where possible:
- user_id
- room_id
- track_id
- source of action, such as manual, queue, or recommendation
- timestamp
- current playback position
- session length so far
- whether the user was host or listener
- device or client context when available

### Implicit Labels
Use behavior to infer signals:
- strong positive: full listen, replay, queue add, recommendation accepted
- weak positive: partial listen past a threshold
- negative: quick skip, dismissal, remove from queue

## Recommendation Architecture
### Phase 1: Rule-Based Baseline
Ship a deterministic baseline first.
- Recommend similar artists, albums, and tracks from the catalog.
- Bias toward trending or popular tracks when the profile is sparse.
- Exclude recently played tracks and tracks already in the queue.
- Add artist and album diversity so the list does not feel repetitive.

### Phase 2: Candidate Generation
Build a broader candidate set before ranking.
- Similar artist matches.
- Similar track metadata matches.
- Tracks that commonly follow the current track.
- Tracks from users with similar listening patterns.
- Trending and editorial fallback candidates.
- Session-mood candidates derived from recent plays.

### Phase 3: Ranking
Score each candidate using features such as:
- user affinity for the artist
- user affinity for the album
- skip rate for similar tracks
- completion rate for similar tracks
- recency of artist exposure
- popularity
- novelty
- room context
- current session momentum

### Phase 4: Re-ranking And Diversity
After ranking, apply guardrails:
- avoid duplicate artists back-to-back
- avoid duplicate albums back-to-back
- keep a mix of familiar and new tracks
- prevent the same recommendation from repeating too soon
- enforce a maximum number of tracks from the same artist in the top results

## User Model Strategy
### Short-Term Session Model
Represents what the user wants right now.
- Based on the current track and the last N plays.
- Updated in real time as the session progresses.
- Useful for vibe, energy, and momentum.

### Long-Term Taste Model
Represents stable user preferences.
- Based on listening history over many sessions.
- Tracks preferred artists, genres, tempos, and eras.
- Updates more slowly than the session model.

### Blending Strategy
Final score should combine both layers:
- short-term session preference
- long-term user preference
- room context
- exploration bonus for novelty

## Spotify-Inspired Product Behaviors
- Show a suggested-next row under the player.
- Explain why a song was recommended.
- Let users add, play next, or dismiss a recommendation.
- Support a radio-like endless sequence seeded from the current track.
- Keep the queue feeling alive by refreshing candidates when the current track changes.
- Favor smooth transitions rather than random jumps in mood.

## API Plan
Add endpoints that can be implemented incrementally:
- `GET /api/recommendations/next?track_id=...&user_id=...&room_id=...`
- `GET /api/recommendations/radio?track_id=...&user_id=...`
- `POST /api/events`
- `GET /api/users/{user_id}/taste`
- `GET /api/rooms/{room_id}/recommendations`

Recommended response shape:
- track data
- score
- reason
- source
- explanation tags
- confidence

## Training Data Plan
### Step 1: Event Table
Create a table or log stream for all events.

### Step 2: Session Table
Derive one row per listening session with summary stats.

### Step 3: Pairwise Training Set
Build rows that compare a chosen track with nearby candidates and label whether the user accepted it.

### Step 4: Sequence Dataset
Create ordered track sequences for next-track prediction.

## Model Roadmap
### Baseline
Rule-based scoring using metadata and recency.

### Ranking Model
A lightweight model trained on logged interactions.
Good initial choices:
- gradient boosted trees
- logistic regression
- factorization machines

### Sequence Model
Use once enough listening history exists.
Possible later upgrade:
- session-based neural ranker
- transformer-based next-track predictor

## Evaluation Plan
### Offline Metrics
- precision at K
- recall at K
- NDCG at K
- skip rate
- completion rate
- diversity score

### Online Metrics
- recommendation accept rate
- skip-after-recommendation rate
- queue add rate
- time to next play
- session length increase

## Rollout Milestones
### Milestone 1: Instrumentation
- Log playback and recommendation events.
- Persist room and user interaction history.

### Milestone 2: Baseline Recommendations
- Add a rule-based next-song endpoint.
- Return ranked suggestions and reasons.

### Milestone 3: UI Integration
- Show suggested next songs in the player UI.
- Support play next, add to queue, and dismiss actions.

### Milestone 4: Ranking Model
- Train a model from logged behavior.
- Replace part of the rule scoring with learned ranking.

### Milestone 5: Personalization And Exploration
- Blend session and long-term profiles.
- Add diversity and exploration controls.

### Milestone 6: Radio Mode
- Seed endless recommendations from a current track.
- Continue generating suggestions as the queue drains.

## Risks And Guardrails
- Sparse data can make the model overfit popular tracks.
- Room listening can blur individual taste if not separated carefully.
- Too much novelty can hurt trust, so keep diversity controlled.
- Too much repetition makes the experience feel robotic.
- Recommendations must stay fast enough for realtime playback.

## Immediate Next Steps
1. Add event logging endpoints and storage.
2. Implement a deterministic recommendation baseline.
3. Expose a next-song API.
4. Wire the client to display suggested tracks.
5. Start collecting interaction data for the first model.
