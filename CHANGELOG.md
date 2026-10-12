# Changelog

## 0.3.0 (2026-10-12)

- Expose opt-in Git `export-ignore` exclusions through the release actions. ([#236](https://github.com/wpelevator/basement/pull/236) by @kasparsd, [`f4cd6f1`](https://github.com/wpelevator/basement/commit/f4cd6f1ab2c8f1f34050547e1047b5a21047220c))

## 0.2.2 (2026-10-11)

- Bundle wp-release 0.7.0.

## 0.2.1 (2026-10-11)

- Keep the release actions pinned to a stable wp-release version while the monorepo root resolves them to its local workspace; support explicit changelog insertion markers before the first version heading.

## 0.2.0 (2026-10-11)

- Each run adds a section to the job summary with the manifest and its number of files. A failed run adds its error.
- Bundles `@wpelevator/wp-release` 0.5.0.

## 0.1.0 (2026-10-10)

- First release.
