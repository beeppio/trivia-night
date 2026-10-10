# Online lobby setup (phase 1)

The connected project has `trivia_rooms`, `trivia_players`, room creation/join RPCs, Row Level Security, and `trivia_players` in the Supabase Realtime publication. The schema was applied directly through Dyad; no SQL needs to be pasted for this phase.

## Required configuration

1. Supabase Dashboard → Authentication → Sign In / Providers → Anonymous Sign-Ins: enable anonymous sign-ins. Hosts and players use authenticated anonymous identities. These are browser-specific identities, not durable host accounts; clearing browser data loses access to that identity's rooms. Enable abuse protection/rate limits as appropriate before public use.
2. Local preview: edit the root `.env.local` file using these exact names:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   This file is ignored by Git through `*.local`. Restart the preview server after changing values.
3. Cloudflare Pages → your project → Settings → Variables and Secrets: add the same two values for Production (and Preview if needed), then redeploy. Vite reads them during build. The publishable key is public; never use a service-role or secret key here.
4. Use the same Supabase project whose database was configured in Dyad. A different URL requires the schema to be configured in that project too.

## What is implemented

- Host clicks **Create online room** to create a unique five-character database-backed room code. Last room restores for the same host browser identity.
- Player visits `/play`, enters that code, and joins with a Supabase identity.
- Host fetches the room's roster and subscribes to its database changes.
- Names, avatars, animated frames, and readiness are stored and synchronized.
- RLS limits reads to the host or members of the room. Players can update only their own profile fields. Direct client room creation and membership insertion are disallowed; authenticated RPCs generate rooms and join by code.
- No questions, answer keys, host notes, scores, or timer controls are exposed in the online lobby tables.

## Not yet implemented

Online gameplay (questions, submissions, scores, deadlines, server grading), TV synchronization, cloud media storage, presence/leave cleanup, durable host account login, and complete cross-device testing. The player intentionally stays in an online lobby rather than claiming local broadcasts are online gameplay. Existing host gameplay and in-dashboard dev player windows remain local.

## Manual cross-device acceptance check

After enabling anonymous sign-ins and deploying with both variables, open `/host` in one browser and create a room. Open `/play` in a separate browser or phone and enter the generated code. Set a team name and click Ready. Confirm the host's Players list updates without refreshing. Check an invalid code is rejected and a second player appears independently. Reload the host and confirm its room restores. This check has not been performed by the assistant; TypeScript checks are not a substitute.

The newly added Supabase dependency must also be included in a regenerated pnpm lockfile before any frozen-lockfile Cloudflare deployment. Dyad's dependency installer does not guarantee that the exported pnpm lockfile is updated, and there is no command runner available in this session to verify installation/build or push to GitHub.
