# Show available recipes.
default:
    @just --list

# Start the development server.
dev:
    pnpm run dev

# Build the production site.
build:
    pnpm run build

# Preview the production build.
preview:
    pnpm run preview

# Check lint rules without changing files.
lint:
    pnpm exec biome lint .

# Format supported files in place.
format:
    pnpm exec biome format --write .

# Check formatting without changing files.
check-format:
    pnpm exec biome format .

# Run the unit test suite once.
test:
    pnpm test

# Check TypeScript and Astro component types.
typecheck:
    pnpm exec tsc --noEmit
    pnpm exec astro check

# Run lint, formatting, and import checks without changing files.
check:
    pnpm exec biome check .

# Run application checks, tests, and a production build.
verify: check typecheck test build
