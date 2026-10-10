# Supabase online gameplay

## Configuration

- Keep anonymous sign-ins enabled in Supabase Authentication.
- The app reads only `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` from Vite environment variables. Local values go in the root Git-ignored `.env.local`; Cloudflare values go in Pages → project → Settings → Variables and Secrets → Production/Preview. Rebuild after changing values. Never supply a service-role or secret key to the frontend.
- Database changes for both phases were applied directly to the connected Supabase project. No manual SQL migration is required for that project.

## Phase 2 implementation

The host publishes the existing visible game session through `trivia_publish_state`, which verifies the authenticated caller owns the room. `trivia_game_state` is readable only by the host, joined players and TV viewers. Clients have no direct insert/update/delete privileges on game state or submissions. Realtime publishes game-state and submission changes.

Player and TV sessions use the same online state: lobby, round introductions, questions, ordering items, countdowns, media playback/pause/replay timestamps, reveals, results, rankings and final standings. TV links include `/tv?room=CODE`; bare `/tv` offers room-code entry. TV joins as a viewer rather than becoming a player. Existing host UI and in-dashboard dev windows remain.

`trivia_submit_answer` derives the player ID from authentication, checks room membership, current question, open/reveal status and server time, and locks the first accepted answer. Answers before the buzzer are allowed. Raw answers are readable only by their owner and the host until the host publishes revealed results. `trivia_close_answers` locks the run and returns all accepted submissions atomically, including last-second submissions. A closed-run record prevents delayed snapshot updates from reopening it.

The existing scoring remains host-authoritative: full/half/zero grading for text and exact-order full/zero grading for ordering questions. The host executes the existing grading logic and publishes rankings/results; players cannot write scores or invoke the publish/close RPCs. This is not autonomous server grading or a server-driven game scheduler. The host tab must remain running to progress and grade the game.

Only the current visible public session is published. Answer keys, host notes, answer attachments and future question content are not uploaded into the shared state before reveal. Uploaded media uses a private `trivia-media` bucket and authenticated downloads. Media registry release flags restrict participant reads to paths in the currently published state. Filenames are stripped from network media descriptors to reduce answer hints. External links are included only when their media is published. Once content has been revealed/downloaded, it cannot be made secret again by replaying a question.

Homepage music is published with the room's waiting-screen state. Round music and foreground clips use the same TV audio controls as before, including restoring background music on pause, mute, volume and talk-over. Browser sound permission is still required on the TV. Device timestamps are translated using an authenticated server clock measurement; network and measurement latency still apply.

## Verification completed by assistant

- TypeScript checks on all changed source files passed.
- Database Realtime publication and RLS/privileges were inspected.
- Rollback-only RPC assertions passed for host-only publishing, pre-buzzer answers, duplicate first-answer lock, closed-run protection and expired-deadline rejection. Temporary test changes were rolled back.
- No production build command or separate-device phase-2 browser session was executed by the assistant. Phase 1 cross-device success was reported by the user.

## Cross-device acceptance checklist

1. Create/use a room in `/host`; open its TV link on another device, or enter the code on `/tv`. Verify the actual room code and roster.
2. Join from two separate player browsers, set names/avatars, and mark Ready.
3. Choose a game → Start game → Start round. Both players and TV must show the same round/question.
4. Submit one answer before Start buzzer; confirm it appears in host grading. Start buzzer and compare timers.
5. Submit a second answer before expiry. Confirm retries do not replace it and late submissions are rejected. Reload a player during a question: their submission lock should remain.
6. Grade text full/half/zero and Reveal answer. Compare scores, answer badges, rankings and player results.
7. Test ordering exact/wrong order, automatic timeout grading, Next, Previous and Replay. Replay starts a fresh run without old submission locks and removes the previous run's score as before.
8. Test uploaded video/audio/images, trim boundaries, play/pause/resume/replay, YouTube links, round music, talk-over, and homepage music before choosing a game. Phones still do not render question media, preserving existing behavior.
9. End the game, verify tied/single winners on TV, then Back to games and waiting music. Verify a second independent room does not receive these updates.

## Remaining limitations

Host gameplay state still lives in its existing React state and game definitions remain in host IndexedDB. Do not reload/close the host mid-game: it does not restore a live game and can publish its lobby state when it reconnects. Player/TV reloads fetch current online state. Host failover/resume, durable host login, presence/leave cleanup, room/media retention cleanup and autonomous server grading are not implemented. Uploads occur when content is first published; large clips can delay that state update and consume storage/bandwidth. Monitor Supabase quotas. Keep media filenames/content free of answer hints.

No new npm dependency was added during phase 2. This session cannot execute pnpm installation, production builds or GitHub pushes. Use the already working deployment pipeline to verify the exported package/lockfile and build; do not assume TypeScript checks replace those checks.
