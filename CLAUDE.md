# Working agreements

## Push, PR and merge mean the whole flow

When the user asks to "push", "PR", "merge", "ship it" or anything like it, they mean the whole
flow, every time, without asking again at each step:

1. If on `main`, branch first (`feat/…`, `fix/…`, `chore/…`).
2. Commit anything uncommitted, with a sensible message.
3. Push the branch and open a pull request into `main` with `gh pr create`.
4. Merge it with `gh pr merge --merge --delete-branch` (the repo's history uses merge commits).
5. Switch back to `main` and pull, so the local checkout matches.

A pending Vercel preview check does not block the merge. A failing check, a merge conflict or a
review that asks for changes does: stop and say so.

## Where things are written down

- `README.md` is the way in: what the site is, the commands, the folder layout and the rules the code
  relies on. `docs/` holds the rest: `architecture.md`, `design-system.md`, `testing.md`,
  `operations.md`, `content.md` and `launch-checklist.md`.
- A change that alters behaviour updates the doc that describes it, in the same pull request.
  `docs/superpowers/` holds dated design records; they are not updated.
- Before a pull request, run `pnpm test`, `pnpm lint` and `pnpm typecheck`, and the browser specs the
  change touches (`docs/testing.md` says which). `pnpm test` also reads the README and `docs/`.
