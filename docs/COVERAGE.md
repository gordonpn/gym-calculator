# Test coverage

Run `pnpm run test:coverage` to execute the unit tests with Vitest's V8 provider.
The console shows coverage metrics; `coverage/lcov.info` and
`coverage/coverage-summary.json` contain machine-readable reports. All application
TypeScript files are included, including files not exercised by the current tests.
Generated reports are ignored by Git.

The Test Coverage workflow runs on pull requests and pushes to `main`, retains the
reports as a workflow artifact, and uploads LCOV to Codecov. Codecov posts and
updates the pull request coverage comment using `codecov.yml`.

A repository maintainer must enable this repository in Codecov and install or
authorize the Codecov GitHub App for pull request comments. Trusted repository
runs authenticate uploads using GitHub OIDC instead of a long-lived upload token.
The coverage job has `contents: read` and `id-token: write` so it can request the
short-lived identity token required by Codecov, including for protected branches.
Fork pull requests use Codecov's supported tokenless uploads for public
repositories; enable that option in Codecov to report those runs. Upload failures
fail trusted runs. Fork uploads are best-effort so external authentication
settings cannot block fork test checks; their reports remain available as artifacts.
PR comment permissions belong to the Codecov App rather than the workflow token.

Remote Codecov uploads and comments require validation on a real pull request once
the integration is enabled; local coverage generation does not verify that setup.
