# Task 5 Report: User Dashboard (Trophy Case & Leaderboard)

## Status: DONE

### Implementation Details:

#### 1. Data Fetching (`col-achievements.js`)
- Implemented `getUserProgress()`: Fetches user achievement records and joins with `achievement_definitions`.
- Implemented `getGlobalLeaderboard()`: Fetches top 10 users from the `global_leaderboard` view.
- Implemented `getCategoryLeaderboard(category)`: Calls the `get_category_leaderboard` RPC to fetch rankings for specific domains (Physics, Coding, etc.).
- All methods are exposed on `window` for use in `dashboard.html`.

#### 2. User Dashboard (`dashboard.html`)
- **Layout**: Modern, responsive design using the project's design system (`--void`, `--signal`, `--ion`).
- **Auth State**: 
    - Implemented an `#auth-overlay` that appears if `window.colUser` is null, prompting the user to sign in via `openGlobalLogin()`.
    - The dashboard UI (`#dashboard-ui`) is only displayed after successful authentication.
- **Trophy Case**:
    - Rendered as a grid of cards.
    - **Completed State**: Cards have full color, `border-color: var(--signal)`, and a "Share" button.
    - **Locked State**: Cards use `filter: grayscale(1)`, lower opacity, and a "Locked" button.
- **Leaderboard**:
    - Integrated a category dropdown (Global, Physics, Coding, Vision, Game Dev).
    - Table updates dynamically when the category is changed.
- **Sharing**:
    - "Share" button generates a verification link: `window.location.origin + '/verify?cert=' + slug + '&token=' + token`.
    - Uses the Web Share API if available, falling back to clipboard copy with a toast notification.

### Verification:
- [x] Logged-out state $\rightarrow$ Shows authentication overlay.
- [x] Logged-in state $\rightarrow$ Loads user profile and achievements.
- [x] Trophy Case $\rightarrow$ Correctly distinguishes between locked and unlocked achievements.
- [x] Leaderboard $\rightarrow$ Correctly switches between Global and Category rankings.
- [x] Share functionality $\rightarrow$ Correctly generates and copies verification links.

### Final Files:
- Modified: `col-achievements.js`
- Created: `dashboard.html`
