# Quiz Social

A React + TypeScript + Vite + Tailwind trivia-night application, built in phases.

## Current status: Phase 1 foundation

This is an interactive interface foundation, not a working multiplayer game. Every game screen is labeled as a preview. There is no Supabase connection, authentication, server authorization, database, realtime synchronization, automatic grading, or working countdown yet.

### Routes

- `/`: responsive homepage with host/join actions, how-to-play dialog, and party/Halloween theme selection.
- `/host`: local host walkthrough with lobby, round introduction, example questions, local reveal controls, sample leaderboard, replay, question navigation, and end confirmation.
- `/join`: validated six-digit sample room code and nickname form. Only preview code `482913` is supported.
- `/player/:roomCode`: mobile lobby, example multiple-choice selection, and local confirmation. Answers are not saved or scored.
- `/display/:roomCode`: TV-friendly lobby. Add `?view=question` or `?view=leaderboard` to inspect other public layouts. Fullscreen uses the browser Fullscreen API where available.

Host, player, and display previews are independent. Refresh resets walkthrough state. The nickname is kept in session storage for preview navigation, and the theme is kept in local storage. Neither is a secure identity or persisted game session.

## File structure

- `src/App.tsx`: all React Router routes and shared providers.
- `src/pages/Index.tsx`: homepage.
- `src/pages/Host.tsx`: host dashboard preview and local stage transitions.
- `src/pages/Join.tsx`: sample join form and client-side input validation.
- `src/pages/Player.tsx`: mobile player walkthrough.
- `src/pages/Display.tsx`: public display layouts and fullscreen action.
- `src/components/PartyLayout.tsx`: branding, navigation, instructions dialog, theme provider, and preview notices.
- `src/components/PartyArtwork.tsx`: original, lightweight SVG hero artwork; no external image asset required.
- `src/components/QuestionCard.tsx`: reusable public question and answer-choice presentation.
- `src/components/Leaderboard.tsx`: sample ranking presentation with tied ranks.
- `src/lib/preview-data.ts`: public example questions and simulated players only.
- `src/globals.css`: centralized theme variables, Google Fonts with system fallbacks, shared Tailwind styles, and reduced-motion support.

## Phase 2 requirements

Connect a Supabase project through the app integration before implementing multiplayer. Frontend environment configuration will use `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (or a public publishable key). Never place service-role keys, database passwords, or secret keys in frontend variables, code, or GitHub.

Implement and verify:

1. Host authentication and ownership-authorized sessions.
2. Database migrations with RLS and distinct private answer keys/public question snapshots.
3. Server-authorized room creation, guest joining, and answer submission with secure guest identities.
4. Unique room codes/nicknames, idempotent submission and grading, and server-side deadline checks.
5. Scoped realtime subscriptions and persisted recovery state.
6. Multi-browser/device tests and adversarial authorization tests before claiming multiplayer or answer-key protection works.

All answer keys currently shown in the host walkthrough are hard-coded examples, not secrets. The production answer system must replace this sample content; hiding it in frontend code is not security.

Later phases add the game editor, synchronized timers and Web Audio sounds, grading/overrides, additional question formats/media, exports, and full deployment verification.

## Cloudflare Pages configuration

The existing package build script is `vite build`. For a GitHub-connected Cloudflare Pages project, use the React/Vite preset, build command field `npm run build`, and output directory `dist` with the repository root as the project directory. Cloudflare Pages provides SPA fallback for this project because no top-level `404.html` is included. Verify direct navigation to nested routes in the deployment.

No GitHub repository or Cloudflare project has been provisioned by Phase 1. A production build and deployed route checks remain to be verified. No environment variables are needed for the Phase 1 preview.

## Verification

TypeScript diagnostics were checked for all new/modified TypeScript files with no errors. This does not constitute browser interaction testing, a production build, multi-device testing, or a security audit. Those checks remain part of the phased implementation.
