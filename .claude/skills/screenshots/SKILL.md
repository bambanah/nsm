---
name: screenshots
description: Capture before/after screenshots of a view in this app, for a PR's Evidence section or to check a UI change.
---

# Screenshots

Run two dev servers against the e2e database, one on the base branch and one on the PR branch, and screenshot the same URL on each. Start Postgres as the README describes. The e2e database is already migrated once `pnpm test:e2e` has run.

1. Take the **before** shot from the base branch, checked out in this checkout with `git switch --detach origin/main` (the working tree must be clean). A `git worktree` with `node_modules` symlinked in will not work: pnpm's store breaks nitro's dev entry, and the server fails with "Failed to load url ... dev-entry.mjs".
2. Start each server with the `webServer.env` values from `playwright.config.ts`, a free port, and `BETTER_AUTH_URL` set to `http://localhost:<that port>`: `npx vite dev --port <port>`, in the background. Wait until `curl localhost:<port>` responds.
3. Screenshot with `node .claude/skills/screenshots/shot.mjs <url> <out.png>`, writing to the scratchpad, never the repo. Run it from the repo root so `@playwright/test` resolves.
4. Stop the server with `pkill -f "vite dev --port <port>"` and switch back to the PR branch.
5. Read both PNGs to check they show the intended view, not an error overlay or a half-rendered page.

A fresh browser context is a Guest. To shoot a signed-in view, extend the script to sign up first with `POST /api/auth/sign-up/email`, as `e2e/auth.setup.ts` does.
