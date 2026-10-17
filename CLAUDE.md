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
