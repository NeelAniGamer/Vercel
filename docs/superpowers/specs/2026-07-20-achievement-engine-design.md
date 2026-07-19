# Design Spec: Achievement Engine (Leaderboards & Certificates)
Date: 2026-07-20
Status: Proposed
Author: Claude Code

## 1. Context
The project currently has fragmented progress tracking and a non-functional certificate system. There is a disconnect between the modern React-based Traffic Simulator and the legacy static pages. This design implements a unified "Achievement Engine" to drive global/category leaderboards and verifiable public certificates.

## 2. Goals
- **Unified Progress**: Single source of truth for all user achievements and scores.
- **Competitive Play**: Real-time global and category-based leaderboards.
- **Verifiable Certification**: Unique, public-facing URLs to verify earned certificates.
- **Secure Architecture**: Prevention of score spoofing and unauthorized certificate claims.

## 3. Database Architecture (Supabase/Postgres)

### 3.1 Tables
#### `achievement_definitions`
Defines the library of all possible milestones.
| Column | Type | Notes |
| :--- | :--- | :--- |
| `id` | UUID (PK) | Primary Key |
| `slug` | Text (Unique) | Used for URL routing (e.g., `city-center-pro`) |
| `type` | Enum | `score` or `milestone` |
| `category` | Text | e.g., `Global`, `Academy`, `City Center` |
| `display_name` | Text | Human-readable name |
| `description` | Text | Description of the achievement |
| `is_certificate` | Boolean | If true, grants a formal cert upon completion |

#### `user_achievements`
Tracks individual user progress.
| Column | Type | Notes |
| :--- | :--- | :--- |
| `user_id` | UUID (FK) | References `auth.users` |
| `achievement_id`| UUID (FK) | References `achievement_definitions` |
| `current_value` | Numeric | The current score/progress |
| `is_completed` | Boolean | Whether the milestone is reached |
| `completed_at` | Timestamp | Date of completion |
| `verification_token`| UUID | Unique, random token generated on completion |

### 3.2 Views
- **`global_leaderboard`**: A view joining `user_achievements` (where `category = 'Global'`) and `user_profiles` to return top users by `current_value`.
- **`category_leaderboard`**: A parameterized view or function that returns top users for a specific category.

### 3.3 Security & RLS
- **`user_achievements`**:
    - `TO authenticated USING (auth.uid() = user_id)` $\rightarrow$ Full access for the owner.
    - `TO anon USING (true)` $\rightarrow$ Read-only access to the `verification_token` and `is_completed` columns *only* when the token is provided in the query (via a secure RPC or filtered view).
- **Server-Side Validation**: 
    - Use a **Supabase RPC (Stored Procedure)** to handle "Completion" events. The function will verify if prerequisite achievements are met before setting `is_completed = true` and generating the `verification_token`.

## 4. User Experience (UX)

### 4.1 The Civic Dashboard
A new hub for user progress:
- **Trophy Case**: A grid of earned certificates. locked items are grayscale.
- **Leaderboard Toggle**: Switch between Global and Category views.
- **Share Interface**: "Copy Link" button for each earned certificate.

### 4.2 Public Verification Page
Route: `/verify?cert=[slug]&token=[uuid]`
- Displays a high-fidelity certificate layout using the design system (`--void`, `--signal`, `--ion`).
- Displays User Name, Certificate Name, and Date of Issuance.
- "Verified by Supabase" badge.

### 4.3 Simulator Integration (`react-src/`)
- **HUD Notifications**: Sleek glassmorphism pop-ups when a milestone is triggered.
- **Sync Layer**: Push scores to Supabase via the Achievement Engine API.

## 5. Technical Implementation Details

### 5.1 Verification URL Logic
1. User shares link: `site.com/verify?cert=city-pro&token=abc-123`.
2. Frontend calls Supabase: `SELECT * FROM user_achievements WHERE achievement_id = (SELECT id FROM achievement_definitions WHERE slug = 'city-pro') AND verification_token = 'abc-123'`.
3. If a match exists, the certificate is rendered.

### 5.2 Performance Optimization
- **Indexing**: B-Tree index on `user_achievements(user_id)` and `user_achievements(achievement_id)`.
- **Caching**: The public verification page will be cached to prevent database hammering on viral shares.

## 6. Verification Plan
- **SQL Audit**: Verify that `anon` roles cannot update `current_value` or `is_completed`.
- **Integration Test**: Trigger a milestone in the simulator $\rightarrow$ check Supabase table $\rightarrow$ visit verification link.
- **UI Test**: Ensure the Dashboard correctly renders both locked and unlocked certificates.
