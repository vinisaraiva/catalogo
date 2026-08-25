# Plan 001 — Urgent: live secrets in the repo + no commit history

**Status:** TODO
**Category:** security / process
**Type:** Manual runbook — NOT a code change. There is nothing here for an
automated executor to "implement"; this is a short list of commands for a
human (or an agent with shell access to the real machine) to run once,
carefully, in order. Read the whole plan before running anything.

## Why this is first

Two facts about the real repository (`C:\Users\Vini\CATALOGO`, remote
`origin` = `https://github.com/vinisaraiva/catalogo.git`), confirmed by
directly inspecting it:

1. It has exactly one commit ("initial commit"). Every file from Phases 1
   through 5 of this project — essentially the entire working application
   — exists only as uncommitted changes in the working tree (`git status`
   shows dozens of modified/untracked files, zero of them committed).
2. Two files sitting at the repo root, **neither covered by `.gitignore`**,
   contain live credentials for the project's real Supabase instance:
   - `cata-suupa.txt` — a Supabase anon key, a **service-role key** (bypasses
     Row Level Security entirely), and the project URL, in plain text.
   - `catalogo.json` — a Supabase **personal access token** (`sbp_...`), which
     is more powerful than either of the above: it authenticates against the
     Supabase *Management API*, so it can create/delete projects and rotate
     other keys for the whole account/organization, not just read one
     project's data.

These two facts compound: the very next `git add -A && git commit` — which
is inevitable, since nothing is committed yet — will write both files into
git history permanently. `.gitignore` only excludes `.env`, `.env.local`,
`.env.*.local`, and `*.pem`; it does not match either filename. If that
history is ever pushed to the `origin` remote (which already exists and is
a real GitHub URL), the credentials are compromised the moment the
repository is anything other than a private repo only you can see — and
even then, anyone who ever clones it, or the token if it's ever pasted
elsewhere, has permanent access via git history even after the files are
later deleted.

There is also a stray `.git/index.lock` left behind by some earlier
interrupted process. Until it's removed, `git status`, `git commit`, and
most other git commands in that repo will fail outright — including any
attempt to fix the problem above.

## Steps

Run these on the actual machine, inside `C:\Users\Vini\CATALOGO` (not the
cloud-workspace mirror — this plan only makes sense against the real
repository with its real git history and remote).

### 1. Clear the stale lock

```bash
rm -f .git/index.lock
git status
```

Expected: `git status` now runs cleanly (no "unable to unlink" error) and
shows the same modified/untracked file list described above.

**If `git status` still errors** after removing the lock, STOP and
investigate before continuing — something else may be wrong with the git
directory, and forcing further git operations on a possibly-corrupt
`.git/` risks losing history rather than protecting it.

### 2. Get the two secret files out of the working tree

```bash
mkdir -p _to_delete
mv cata-suupa.txt catalogo.json _to_delete/
```

(`_to_delete/` rather than an outright delete, in case either file's exact
values are needed one more time during step 3 below — delete the folder
yourself once you've confirmed the rotation succeeded.)

### 3. Rotate all three credentials in the Supabase dashboard

Do this regardless of whether you believe the files were ever pushed
anywhere — they've already existed unprotected on disk and potentially
been read by multiple tools/processes during this project's development,
which is reason enough:

- Project Settings → API: regenerate/roll the **anon** key and the
  **service-role** key.
- Account → Access Tokens (or Organization settings, depending on where it
  was issued): revoke the personal access token starting `sbp_...` and
  issue a new one only if something still needs it (the MCP config in
  `catalogo.json` was a stray file, not obviously something actively
  relied on — confirm before reissuing).
- After rotating, update `.env.local` (which IS gitignored) with the new
  anon/service-role values so the app keeps working locally.

### 4. Add the two filenames to `.gitignore` as a backstop

Even after moving them out, add explicit entries so a similarly-named
scratch file never gets swept into a commit by accident:

```gitignore
# Accidental credential-scratch files from earlier in development —
# see plans/001-urgent-secrets-and-vcs-hygiene.md
cata-suupa.txt
catalogo.json
```

Append these two lines to the existing `.gitignore` (it currently ends
after the `*.pem` line — just add a blank line and the block above).

### 5. Start committing — in phase-sized chunks, not one giant commit

The project's own `TASKS.md` already has natural boundaries (Phase 1
Foundation, Phase 2 Admin Core, Phase 3 Public Catalog, Phase 4 WhatsApp
and Selection, Phase 5 Product Images/Storage) and `DECISIONS.md` has a
matching ADR per phase (ADR-023 through ADR-027, though see plan
`006`'s sibling note in `plans/README.md` about the ADR-025/026/027 gap).
Committing along those same boundaries — rather than one `git add -A`
covering everything at once — gives you real history to bisect/revert
against going forward, and mirrors how the work actually happened:

```bash
git add .gitignore
git status   # re-check nothing unexpected is staged before each commit below

# repeat per phase, adjusting the `git add` paths to that phase's files —
# use `git status` output to identify which files belong to which phase
git commit -m "feat: Phase 1 — foundation, schema, RLS, auth"
git commit -m "feat: Phase 2 — admin core (teams, collections, products CRUD)"
git commit -m "feat: Phase 3 — public catalog"
git commit -m "feat: Phase 4 — WhatsApp and local selection"
git commit -m "feat: Phase 5 — product image storage"
```

Exact file-to-phase mapping is left to you (or whoever runs this) rather
than hardcoded here, since `git status`'s live output is the source of
truth, not this plan. If splitting cleanly by phase turns out to be more
trouble than it's worth, a single commit for everything is still far
better than the current state — don't let perfect be the enemy of "this
work is now safely in version control."

### 6. Push to `origin` once you're satisfied with the local history

```bash
git push origin master
```

## Done criteria

- `git status` (in the real repo) runs without error and shows a clean or
  expected working tree — no stray lock file.
- `cata-suupa.txt` and `catalogo.json` no longer exist anywhere under
  `C:\Users\Vini\CATALOGO` (moved to `_to_delete/` and then actually
  deleted once rotation is confirmed).
- The anon key, service-role key, and personal access token have all been
  rotated in the Supabase dashboard, and `.env.local` reflects the new
  anon/service-role values.
- `.gitignore` includes the two filenames.
- `git log --oneline` shows more than one commit, and `git status` shows
  little or nothing left uncommitted.

## Escape hatches

- If you're not comfortable rotating the personal access token yourself
  (e.g. it's shared with other tooling you don't want to break), at
  minimum rotate the anon and service-role keys — those are the two that
  matter for this application's own security — and treat the token
  rotation as a follow-up, but don't skip moving the file out of the repo.
- If `git push` fails because `origin/master` has diverged in a way you
  don't understand, STOP and don't force-push — investigate what's on the
  remote first (it's possible the "initial commit" already exists there
  and nothing else does, which is the expected/safe case, or it's possible
  something else is going on).
