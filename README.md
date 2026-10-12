# WP Release Checksums

[![GitHub Marketplace](https://img.shields.io/badge/Marketplace-WP%20Release%20Checksums-blue?logo=github)](https://github.com/marketplace/actions/wp-release-checksums) [![Latest release](https://img.shields.io/github/v/release/wpelevator/wp-release-checksums?include_prereleases&sort=semver)](https://github.com/wpelevator/wp-release-checksums/releases) [![npm](https://img.shields.io/npm/v/@wpelevator/wp-release?label=wp-release)](https://www.npmjs.com/package/@wpelevator/wp-release)

GitHub Action that writes a checksums manifest of a WordPress plugin or theme using [`@wpelevator/wp-release`](https://www.npmjs.com/package/@wpelevator/wp-release). It's named after the [`wp-release checksums`](https://www.npmjs.com/package/@wpelevator/wp-release#checksums) command that it runs.

**Status:** first release (0.x). Boolean inputs must be `true` or `false`; anything else fails the run.

The manifest lists the MD5 and SHA-256 hash of every distributed file in the format of the WordPress.org plugin checksums API, with paths relative to the plugin or theme folder. Because it lists the files and not the ZIP, it stays valid for the GitHub release ZIP, the ZIP that WordPress.org builds from SVN and an installed copy. To get one together with the ZIP, use the `checksums` input of [`wp-release-zip`](https://github.com/wpelevator/wp-release-zip) instead, so that both select the same files. [`wp-release-sign`](https://github.com/wpelevator/wp-release-sign) signs the manifest so that it can be trusted.

## Usage

```yaml
      - id: checksums
        uses: wpelevator/wp-release-checksums@0.2.0
        with:
          source-dir: dist
```

### Manifest inside the plugin

To ship the signed manifest inside the plugin, so that an installed copy can be verified later, write it into the directory that is zipped and deployed, sign it, and then zip and deploy that directory:

```yaml
      - uses: wpelevator/wp-release-checksums@0.2.0
        with:
          source-dir: dist
          output: dist/checksums.json

      - uses: wpelevator/wp-release-sign@0.2.0
        with:
          files: dist/checksums.json
          signing-key: ${{ secrets.WP_RELEASE_SIGNING_KEY }}

      - uses: wpelevator/wp-release-zip@0.2.0
        with:
          source-dir: dist # Without the checksums input, which would write a second manifest.
```

The manifest doesn't list itself or its `.sig`, and `output` can be any path inside `source-dir`, such as `dist/includes/checksums.json`; missing folders are created. Attach the two files to the release as well. See [Manifest inside the plugin](https://www.npmjs.com/package/@wpelevator/wp-release#manifest-inside-the-plugin) for the post-deploy check against WordPress.org.

## Inputs

| Input | Default | Description |
|---|---|---|
| `source-dir` | `.` | Directory to hash. |
| `slug` | repository name | Plugin or theme slug. |
| `version` | `Version` header | Version for the manifest and its filename. |
| `filename-format` | `{slug}.{version}` | Filename with `{slug}` and `{version}`, followed by `.checksums.json`. |
| `output` | the filename in the repository root | Path of the manifest. |
| `distignore` | `.distignore` in `source-dir` when present | Path to the ignore file, or `false` to not read one. |
| `exclude` | | Extra gitignore-style patterns separated by commas or new lines, like `build/,assets/*,images/**/*`. They're applied after the ignore file, so a `!` pattern can re-include a file. |
| `exclude-gitattributes` | `false` | Also exclude paths marked `export-ignore` by Git attributes. Requires `source-dir` to be inside a Git repository. |
| `type` | detected from the headers, else `plugin` | `plugin` or `theme`. |
| `force` | `false` | Overwrite an existing manifest. |

## Outputs

| Output | Description |
|---|---|
| `checksums-path` | Absolute path of the checksums manifest. |
| `files` | Number of hashed files. |

## Job summary

Each run adds a section to the job summary of the run with the manifest and its number of files. A failed run adds its error instead, and the run fails. The paths are relative to the workspace.

## Without the action

When you can't use a GitHub Action, such as on another CI system or in a local release script, add the same tooling as a development dependency and run the CLI command that the action runs:

```bash
npm install --save-dev @wpelevator/wp-release
npx wp-release checksums dist
```

The inputs map to the flags of [`wp-release checksums`](https://www.npmjs.com/package/@wpelevator/wp-release#checksums): `source-dir` is the first argument, `slug`, `version`, `type`, `filename-format`, `output`, `distignore`, `exclude`, `exclude-gitattributes` and `force` keep their names, and `distignore: false` is `--no-distignore`. Add `--json` to read the path of the manifest from the output. The CLI needs Node.js 22.12 or later, and has no other dependencies on the runner. Run `npx wp-release checksums --help` for all options.

## How it works

[`src/run.ts`](src/run.ts) reads the inputs with [`@actions/core`](https://github.com/actions/toolkit/tree/main/packages/core), maps them to the arguments of the [`wp-release checksums`](https://www.npmjs.com/package/@wpelevator/wp-release#checksums) command and runs it through the `execute()` function of [`@wpelevator/wp-release`](https://www.npmjs.com/package/@wpelevator/wp-release), so the action and the CLI always behave the same. The action runs `dist/index.js`, a single file bundled with esbuild that includes `wp-release` and all other dependencies, so nothing is installed from npm when the action runs. The tooling version is fixed by the action ref you pin.

## Development

The source is TypeScript in `src/`. `dist/` is git-ignored in the monorepo. `npm run build` bundles the `@wpelevator/wp-release` dependency at the version that the action's `package.json` pins (`0.9.0`). The dependents policy of the monorepo release configuration re-releases the actions whenever a later version falls outside their pins and rewrites them, so they don't need a manual update. A pin that drifts from the published version, like a deliberate pin to an older release, selects a registry install instead, and `changeset-status` warns until the pin resolves the package again. The split-push workflow commits the bundle to the action's release repository. `npm test` runs the input mapping tests with Node.js type stripping, and `npm run lint` runs ESLint and a `tsc` type check.

```bash
npm run build --workspace @wpelevator/wp-release-checksums-action
```
