---
name: release
description: Cut an evcc app release — version bump, EAS build + submit (TestFlight / Play), GitHub release with the F-Droid APK, release notes, store promotion. Use when the user says "release", "new version", "ship to stores", or "/release".
---

# Release

Steps are marked 🤖 (agent runs it) or 👤 (human does it). Stop and wait at every 👤 step. Never commit, push or publish without explicit go (user rule). Suggest `! <cmd>` for interactive commands so output lands in the session.

## Flow

0. 👤 **Ask first: beta or stable?** It decides the release notes range and the GitHub flags.
   - **Beta**: new build → TestFlight / Play testing track, GitHub **pre-release**. Notes cover changes since the **last tag** (beta or stable).
   - **Stable**: store production, GitHub **Latest**. Notes cover changes since the **last stable** (`gh release list` → "Latest"), including every beta in between.
   - Stable from an existing beta (build already tested): do steps 1–2, apply the notes with `gh release edit <ver> --notes-file <file>`, then step 9.

1. 🤖 **Preflight**
   - `git status` clean, on `main`, `git fetch && git status -sb` not behind.
   - `gh run list --branch main --workflow ci.yaml --limit 1` is green.
   - Releases: `gh release list --limit 5`. Changes: `git log --format='%h %s (%an)' <base>..HEAD`, where `<base>` is the range from step 0.
   - Propose version (minor if any feature, patch if only fixes) and build number = current `buildNumber` in `app.config.ts` + 1. 👤 confirms.

2. 👤🤖 **Release notes**, before anything is built:
   - Generated baseline (creates nothing): `gh api repos/evcc-io/app/releases/generate-notes -f tag_name=<ver> -f target_commitish=main -f previous_tag_name=<base> -q .body`. Read the PRs (`gh pr view <n>`) for wording.
   - Draft per [Release notes](#release-notes), show the final markdown, iterate until approved. Save it to a scratch file.
   - Also draft the store text: TestFlight "What to Test" for beta, "What's New" (en + de) for stable.

3. 🤖 **Bump**: `npm run bump -- <ver> <code>`, then `npm run lint`, then show `git diff --stat` (expect `package.json`, `package-lock.json`, `app.config.ts`).

4. 👤 **Commit + push**: propose `chore: version bump <ver>`. Human commits and pushes.

5. 👤 **Store builds**
   - `! eas build -p all --profile production` (~20 min, may ask about credentials).
   - `! eas submit -p ios --latest`: Apple ID login + 2FA → TestFlight.
   - `! eas submit -p android --latest` → Play internal track.
   - Tip: an App Store Connect API key in `eas.json` (`submit.production.ios.ascApiKeyPath/ascApiKeyIssuerId/ascApiKeyId`) removes the 2FA prompt.

6. 🤖 **F-Droid APK from CI**
   - `gh run list --branch main --workflow ci.yaml --commit <bump-sha>` → `gh run watch <id>` (the `F-Droid` job is enough, Detox can still be running).
   - `d=$(mktemp -d) && gh run download <id> -n evcc-<ver>-fdroid.apk -D "$d" && mv "$d/app-release.apk" "$d/evcc-<ver>-fdroid.apk"`
   - Name is always `evcc-<ver>-fdroid.apk`.

7. 🤖 **Draft release**: `gh release create <ver> --draft --target <bump-sha> --title <ver> --notes-file <notes> "$d/evcc-<ver>-fdroid.apk"`, plus `--prerelease` for beta or `--latest` for stable. Verify with `gh release view <ver> --json isDraft,assets` (~50 MB asset).

8. 👤 **Publish**: after explicit go, `gh release edit <ver> --draft=false`. ⚠️ Irreversible: tag + asset freeze (immutable releases), F-Droid builds the tag within days.

9. 👤 **Stores**
   - Beta: TestFlight external group ("What to Test") / Play testing track. Done; a later `/release` run promotes it to stable.
   - Stable: App Store Connect → new version, pick build, paste "What's New", submit for review (covers iOS + macOS). Play Console → promote release to production with notes. When promoting an existing beta, 🤖 also run `gh release edit <ver> --prerelease=false --latest`.

## Release notes

Target style is 1.5.0 (`gh release view 1.5.0`), but with `###` subheads instead of bold lines. Older releases were raw `--generate-notes` output; don't copy those.

```markdown
## What's Changed

### Highlights

- iOS Widget: support for the new smart charging modes (Off / Smart / Fast) … in https://github.com/evcc-io/app/pull/246

### Improvements & Fixes

- New loading animation, faster server switching, instant feedback for unreachable servers in https://github.com/evcc-io/app/pull/269

### Under the Hood

- Faster Detox CI pipeline in https://github.com/evcc-io/app/pull/270
- Dependency updates by @dependabot in https://github.com/evcc-io/app/pull/250, https://github.com/evcc-io/app/pull/249

## New Contributors

- @someone made their first contribution in https://github.com/evcc-io/app/pull/255

**Full Changelog**: https://github.com/evcc-io/app/compare/<prev>...<ver>
```

- Bullets describe the user-visible outcome, not the PR title. Keep platform prefixes (`iOS:`, `Android:`, `macOS:`, `iOS Widget:`). End with `in <PR url>`.
- Credit external contributors with `by @handle`, but not maintainers (@naltatis / Michael Geers).
- **Highlights**: 1–3 new features. **Improvements & Fixes**: smaller visible changes, fixes, translations as one line naming only what stands out, e.g. a new language ("Translations: added Latvian"), no PR links, no list of updated languages. **Under the Hood**: notable CI/tooling, plus one "Dependency updates" line that also folds in "chore: update dependencies" PRs.
- Keep `## New Contributors` from the generated notes if it's non-empty. Drop empty sections.
- Leave out: commits without a PR (version bumps, direct `ci:` fixes), agent/docs-only housekeeping (AGENTS.md, glossary, agent notices), and duplicates.
- Wording: product name "evcc" in lowercase. Check terms against `../evcc/i18n/glossary/`.

**Store text** (en + de, no links, 2–5 short lines, glossary terms): same range as the GitHub notes.

## Gotchas

- Immutable releases: the asset has to be attached while the release is a draft. Once published, the tag and assets can't change, but notes, title and the prerelease flag can.
- Never reuse a build number. App Store and Play reject duplicates. Bad build → bump again.
- F-Droid (`UpdateCheckMode: Tags`) builds every new tag, pre-releases included, so publishing (step 8) = F-Droid release.
- CI artifacts expire after 90 days. Download the APK before then.
