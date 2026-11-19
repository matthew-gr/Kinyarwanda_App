# Learner feedback

The Feedback box on Profile lets a signed-in member send a message about the app. Each message
is saved in Supabase and added to [`feedback/FEEDBACK.md`](../feedback/FEEDBACK.md), so it can be
read and talked through in the repository.

## How it works

1. The app sends `{ area, message, appVersion }` to the `feedback` server function
   (`supabase/functions/feedback`) with the learner's sign-in token. The browser never holds a
   GitHub token.
2. The function checks the sender is signed in and a member, cleans the message (3 to 2,000
   characters), and limits each account to 5 messages an hour and 20 a day.
3. It saves the message in the `feedback` table, with the account, so admins can follow up.
4. It then adds every message not yet in the repository to `feedback/FEEDBACK.md` in one commit
   through GitHub's contents API, and marks those rows with `committed_at`. If GitHub is down or
   the token is missing, the message is still saved and goes into the file with the next one.
   Each entry carries a hidden marker with its ID, so a retry never adds it twice.

## What is public

The repository is public, so the file holds no name, email or account: only the time (UTC), the
part of the app the learner picked, the app version and the message. The box tells learners this
and asks them to leave out anything private. Message text is escaped so it shows as plain text
(no HTML, links, images or headings).

## Keeping commits quiet

- Feedback commits end in `[skip ci]`, so GitHub Actions doesn't run the tests for them.
- `vercel.json` has an `ignoreCommand`: Vercel skips a build when the latest commit changes
  nothing outside `feedback/`, so feedback doesn't redeploy the app.

## Setting it up (once)

1. **Make a GitHub token.** GitHub, Settings, Developer settings, Fine-grained personal access
   tokens, Generate new token. Resource owner: matthew-gr. Repository access: only
   `matthew-gr/kinyarwanda_app`. Repository permissions: Contents, Read and write (Metadata, Read
   only, is added automatically). Nothing else. Pick an expiry and note the date.
2. **Give it to the function** as a Supabase secret, never a Vercel or `VITE_` variable:
   ```
   supabase secrets set GITHUB_FEEDBACK_TOKEN=<the token>
   ```
   Optional: `GITHUB_FEEDBACK_REPO` (default `matthew-gr/kinyarwanda_app`) and
   `GITHUB_FEEDBACK_BRANCH` (default `main`).
3. **Create the table:** `supabase db push` (migration `20261119120000_feedback.sql`).
4. **Deploy the function:** `supabase functions deploy feedback --use-api`.
5. Merge the pull request so the box appears in the app.

When the token expires, messages keep saving in the table; set a new token and the next message
brings the file up to date (50 at a time).
