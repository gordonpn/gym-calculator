# Gym Calculator

## Description

A comprehensive web application for gym enthusiasts to calculate warm-up sets, analyze 1-rep max (1RM), and evaluate strength levels based on established strength standards.

The standout feature is the **plate optimization algorithm** that minimizes plate changes between sets, making your workout more efficient!

## Features

### 🔥 Warm-up Calculator

Calculate efficient warm-up progressions to your target weight using journey-based routines:

- **Barbell Pre-Climbing (Cold)**: Empty bar × 15, 50% × 5, 75% × 3, then working set.
- **Barbell Post-Climbing (Warm)**: Empty bar × 10, 60% × 4, then working set.
- **Dumbbell Pre-Climbing (Rule of 3)**: 50% × 10-12, 75% × 4-6, then working set.
- **Dumbbell Post-Climbing (Energy Saver)**: 50% × 8, then working set.
- **Weighted Bodyweight**: Bodyweight + incremental loading to your target added weight.

**Key Options:**
- Adjust bar weight (standard 45 lbs or customize for specialty bars)
- Minimize plate changes between sets to reduce setup time
- Enable backoff sets at a configurable percentage (useful for recovery work)
- Guided setup for session timing (pre/post climbing) and equipment type
- Input target weight and get calculated warm-up progression
- Visual plate breakdown showing exactly which plates to load

**Automatic Rep Ranges:**
- ≤50% intensity: 10 reps
- 51-60% intensity: 8 reps
- 61-70% intensity: 6 reps
- 71-80% intensity: 5 reps
- 81-85% intensity: 3 reps
- >85% intensity: 2 reps

### 🧮 Rep Max Calculator

Estimate your one-rep max (1RM) from submaximal lifts using proven formulas:

- **Epley Formula**: For reps ≤ 10 → `1RM = weight × (1 + reps / 30)`
- **Brzycki Formula**: For reps > 10 → `1RM = weight × (36 / (37 - reps))`

**Features:**
- Add multiple sets with different weight/rep combinations
- Choose calculation method:
  - **Average**: Calculate 1RM for each set, then average them
  - **Highest**: Use the highest estimated 1RM
  - **Lowest**: Use the lowest estimated 1RM
  - **Weighted**: Weight results by effort (weight × reps)
- View rep ranges at different percentages of your 1RM
- Get immediate strength level evaluation based on your bodyweight

### 💪 Strength Level Checker

Compare your estimated 1RM against established strength standards from training literature:

- Support for 9 major barbell lifts:
  - Back Squat
  - Bench Press
  - Bent Over Barbell Row
  - Deadlift
  - Overhead Press
  - Barbell Lunge
  - Dips

- **5-Level Strength Standards**:
  - Untrained
  - Novice
  - Intermediate
  - Advanced
  - Elite

- **Progressive Feedback**: Shows your current level and what weight you need to reach the next level
- **Bodyweight-Relative Scaling**: Standards scale based on your bodyweight for fair comparison

## How It Works

### Warm-up Calculator Workflow

1. Enter your **target weight** (the main working set)
2. Select your **session timing** (pre-climbing or post-climbing)
3. Select your **equipment type** (barbell, dumbbells, or weighted bodyweight)
4. Configure options:
   - Bar weight (default 45 lbs)
   - Plate changes optimization
   - Backoff sets (optional)
   - Weighted bodyweight body mass (when that equipment type is selected)
5. **Automatic Calculation**:
   - Algorithm selects the matching pre/post routine for your equipment
   - Algorithm generates intermediate warm-up sets and rep targets
   - Plates are optimally configured to minimize changes if enabled
6. Review your warm-up progression in a clean table format with weight, reps, and intensity
7. See the exact plate breakdown for your working set

### Rep Max Calculator Workflow

1. Enter a **weight and rep count** for a submaximal lift
2. Add multiple sets for more accuracy (optional)
3. Choose your calculation method (Average, Highest, Lowest, or Weighted)
4. Algorithm automatically:
   - Selects the appropriate formula (Epley for ≤10 reps, Brzycki for >10 reps)
   - Calculates estimated 1RM for each set
   - Combines results using your chosen method
   - Generates rep ranges at 50-95% of your 1RM
5. View estimated 1RM and rep ranges for training
6. Optionally evaluate your strength level

### Strength Level Checker Workflow

1. Select your **lift** and enter your **bodyweight**
2. Choose your **1-rep max** (can use the rep max calculator first)
3. Select **calculation method** (if using multiple sets)
4. Algorithm:
   - Calculates your estimated 1RM
   - Computes your strength ratio (1RM / bodyweight)
   - Compares against standards for your lift
   - Determines your level and progress to next level
5. View your **strength level** and **next milestone**

## Data Persistence

The app automatically saves your settings to **browser local storage**:

- Selected session timing and equipment type
- Bar weight and plate settings
- Available plates
- Last entered weights and rep counts
- Bodyweight
- Selected lift for strength checker
- Calculation method preferences
- Theme preference (light/dark mode)

Settings persist across sessions, so your preferences are remembered!

## Technologies Used

### Frontend Framework
- **Astro** (v5.16.12) - Modern static site framework with dynamic components
- **Alpine.js** (v3.14.8) - Lightweight JavaScript framework for interactivity without a build step complexity

### Styling & Components
- **Bootstrap 5** (v5.3.3) - CSS framework for responsive, accessible design
- **Bootstrap Icons** (v1.11.3) - Icon library for UI enhancements
- **PopperJS** (v2.11.8) - Positioning library for Bootstrap components

### Development Tools
- **TypeScript** (v5.9.3) - Type safety and better developer experience
- **Biome** (v1.9.4) - Fast linter and code formatter (replaces ESLint + Prettier)
- **Lefthook** (v1.11.12) - Git hooks for pre-commit validation
- **pnpm** (v10.28.1+) - Fast, disk-efficient package manager

### Architecture

```
src/
├── alpine.ts                 # Alpine.js initialization and component registration
├── components/
│   ├── calculator.ts         # Main warm-up calculator logic
│   ├── repMaxCalculator.ts   # Rep max estimation component
│   ├── strengthLevelCalculator.ts  # Strength standards evaluation
│   ├── warmup-formulas.ts    # Warm-up progression algorithms
│   └── util.ts               # Utility functions (debounce, rounding, etc.)
├── layouts/
│   └── Layout.astro          # Base HTML layout with theme toggle
├── pages/
│   └── index.astro           # Main page with all modals and UI
└── styles/
    └── style.css             # Custom styles (overrides + enhancements)
```

### Key Algorithms

**Plate Optimization**: Minimizes the number of plate changes by intelligently reordering warm-up sets. The algorithm generates all possible weight combinations from your available plates, then snaps warm-up weights to the closest achievable combination to reduce setup time between sets.

**Rep Max Formulas**: Implements both Epley and Brzycki formulas with automatic selection based on rep count for accuracy.

**Strength Standards**: Uses bodyweight-relative strength standards from strength training literature to evaluate performance across different body weights fairly.

**Journey-Based Warm-up Mapping**: Automatically picks pre-climbing or post-climbing routines by equipment type so warm-ups match fatigue state and movement pattern.

## Development

### Prerequisites
- Node.js >= 23.11.0
- pnpm >= 8.7.1

### Setup & Running

```bash
# Install dependencies
pnpm install

# Start development server
pnpm run dev
# Opens at http://localhost:3000

# Build for production
pnpm run build

# Preview production build locally
pnpm run preview

# Format and lint code
pnpm run check
```

### Project Structure

- **Responsive Design**: Works seamlessly on mobile, tablet, and desktop
- **Dark Mode**: Toggle between light and dark themes (system preference aware)
- **Accessible**: Built with accessibility in mind using semantic HTML and Bootstrap
- **No Build Complexity**: Alpine.js eliminates the need for a complex JavaScript build pipeline
- **Type Safe**: Full TypeScript support for all components

## Data Storage

All data is stored **locally in your browser** using the Web Storage API (localStorage). No data is sent to any server. Your workouts and preferences are completely private.

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance

- **Lightweight**: ~50KB gzipped (including all dependencies)
- **Fast Calculations**: Instant warm-up set generation
- **Offline Capable**: Works without internet connection after initial load
- **No Tracking**: Zero analytics, no cookies, no external requests

## Roadmap & Future Features

- [ ] Mobile app (PWA)
* [x] Improve warm-up table to include reps
* [x] Improve on formulas: allow a custom formula where the user can specify how many warm-up sets they want
* [x] Implement dark mode
* [x] Add footer information
* [x] Add option to optimize for minimal plate changes
* [x] Add TypeScript tooling
* [x] Add Biome for linting and formatting
* [x] Add lefthook for pre-commit hooks
* [ ] Add PostCSS for CSS optimizations
* [x] Add section to display the working set plate configuration
* [x] Add colours to the plate badges to make it easily distinguishable
* [x] Add option to warm-up to weighted bodyweight exercises
* [x] 1RM calculator
* [x] Persist last selected sets and bodyweight
* [x] Migrate to Astro framework

## License

MIT License - See LICENSE file for details

## Credits

- **Strength Standards** based on established training literature and research
- **Formulas** based on peer-reviewed strength training research (Epley, Brzycki)
- **UI/UX** inspired by modern gym apps and strength training tools

## Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest features
- Submit pull requests
- Improve documentation

## Author

**gordonpn** - Created as a practical tool for gym enthusiasts and strength athletes

---

**Made with ❤️ for the gym community** 🏋️
