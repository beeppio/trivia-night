# Player connections and removal

## Implemented

- Player pages send authenticated `trivia_player_heartbeat` calls every four seconds, plus on network recovery and visibility changes. No unload event is needed.
- Server time determines active status: a player is offline after 15 seconds without an accepted heartbeat. Active rosters poll every two seconds as well as subscribing to Realtime updates, so expiry normally appears within approximately 15–17 seconds of the last successful heartbeat. Browser/network delays can increase this.
- This is membership-level liveness, not one entry per tab. Multiple tabs with the same anonymous Supabase identity share one player; any live tab keeps that player active.
- Offline players are excluded from lobby readiness/counts and live rankings, but remain visible to the host as `Offline · history retained`. Their accepted answers remain available for grading. When the same browser identity reconnects, the original membership/profile and historical score return; no duplicate membership is inserted.
- The host dashboard has a visible **Remove Player** action with confirmation for active and offline players. The host-only RPC writes a permanent `kicked_at` marker, does not delete the player or answers, and removes the player from published rankings. Realtime updates refresh the other screens; polling provides a fallback.
- Removed players return to `/play?removed=1`, which displays **You have been removed from this room**. The same authenticated identity cannot rejoin, heartbeat, submit answers or switch to TV viewing to regain access. Detection normally uses Realtime; the heartbeat supplies a four-second fallback when Realtime is interrupted.
- Expired/offline memberships cannot submit answers until a successful heartbeat reconnects them. Existing question/deadline and first-answer rules still apply.
- Scores remain in the host's existing grading/results state, and accepted answers remain in Supabase. This change does not implement host refresh recovery; keep the host tab open during gameplay as before.

## Security

Database changes were applied directly to the connected project. RLS remains enabled. Clients can update only their own non-kicked profile fields, not heartbeat timestamps or kick markers. Direct membership deletion is revoked so a player cannot delete a kick marker and rejoin. `trivia_kick_player` checks `auth.uid()` against the room's actual host and serializes with answer/join operations using the existing room lock. Database triggers prevent delayed host snapshots from restoring offline/kicked ranking entries.

Anonymous authentication identifies a browser session, not a verified person. Clearing storage, using another browser or obtaining a new anonymous identity can bypass an identity-specific ban. Preventing that requires durable verified accounts or stronger room admission controls; no such changes were requested or added. A heartbeat proves that an authenticated client is communicating, not that a human is looking at the page.

## Verified

- TypeScript checks passed for modified source files.
- Rollback-only server assertions passed for duplicate-free joins, host-only removal, 15-second expiry, offline answer rejection, reconnect without lost answers, kicked heartbeat/join/answer/access rejection, and rejection of delayed snapshots restoring kicked rankings.
- Permissions inspected: RLS enabled; authenticated clients cannot delete memberships or directly update heartbeat/kick fields; anonymous role cannot call the kick RPC. Authenticated callers still require the host check inside that RPC.
- Temporary SQL test rooms and changes were rolled back; existing user rooms were not kicked or deleted by verification.

## Still requires deployed browser testing

1. Connect host, TV and two players in separate browsers/devices. Close one player tab; confirm its active count/lobby/rankings disappear after roughly 15 seconds, with the host's offline history retained.
2. Reopen in the same browser identity. Confirm one player entry, same profile and previous scores; try submitting during an open question.
3. Submit an answer, disable the phone's network for more than 15 seconds, grade/reveal from the host, then restore network. Confirm historical scoring is restored and no duplicate/second answer is accepted.
4. Remove an active player; test both Cancel and confirmation. Confirm host/TV/other player lists update and the removed device shows the required join-screen message. Attempt the same room code again: the server must reject it.
5. Remove an offline player, then reconnect that device. Confirm it is still blocked. Verify a player cannot kick another player or the host.
6. Check two tabs sharing one browser identity: closing just one must not disconnect the surviving player tab. Test mobile background/sleep and network recovery. Phones may suspend background timers; such clients are treated as temporarily offline and recover on return.
7. Check ordering/text grades, timer closure, score retention and TV music/media continue normally. Historical accepted answers remain gradable while an unsubmitted offline player no longer blocks readiness.

Production build and cross-device/browser tests have not been executed in this assistant session; no shell command runner is available. Deploy through the existing Cloudflare pipeline and use the checks above. Environment-variable names remain unchanged; no new npm packages or secret keys are needed.
