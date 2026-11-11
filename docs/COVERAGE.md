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
authorize the Codecov GitHub App for pull request comments. If Codecov requires
authenticated uploads, add its repository upload token as the GitHub Actions
repository secret `CODECOV_TOKEN` through the trusted repository settings UI.
Never commit the token. Fork pull requests do not receive repository secrets;
enable Codecov's supported tokenless uploads for this public repository to report
those runs. Upload failures are surfaced by the workflow, while the report remains
available as an artifact. The workflow uses only `contents: read`; PR comment
permissions belong to the Codecov App rather than the workflow token.

Remote Codecov uploads and comments require validation on a real pull request once
the integration is enabled; local coverage generation does not verify that setup.
