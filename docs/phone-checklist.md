# Phone install: test on real phones

The browser tests cover the manifest and opening offline in Chrome. These checks need real phones. Do them on one iPhone (iOS 16.4 or later) and one Android phone, signed in.

## Install

- [ ] **Android (Chrome).** Open https://kinyarwandaapp.vercel.app, go to Profile, and tap **Install the app**, or use ⋮ → Install app. The icon is the green "Rw" speech bubble, and the app opens without the browser bar.
- [ ] **iPhone (Safari).** Profile shows "tap Share, then Add to Home Screen". Do that. The icon matches, and the app opens full screen.

## Offline

- [ ] Open the app once with a connection. On Profile → On this phone, tap **Save all audio** and wait for "All N clips are saved".
- [ ] Turn on airplane mode, then close the app completely and open it again.
- [ ] Learn and Review work, and every card's audio plays.
- [ ] Answer a few cards, then turn airplane mode off. Profile → Signed in shows the answers synced within a minute.

## Reminders

- [ ] On Profile → Review reminders, choose the hour that starts next (for example, at 2:20 pm choose 3 pm) and tap **Turn reminders on**. Allow notifications when asked.
- [ ] Make sure a review is due within that hour. Learn a new word: its first review is due 5 minutes later.
- [ ] Within that hour, the phone shows "Time to review". The reminder job runs at 5 minutes past each hour; run it sooner from GitHub → Actions → Review reminders → Run workflow.
- [ ] Tapping the notification opens Review.
- [ ] Turn reminders off; no further reminder comes.

## Updates

- [ ] After a new version is deployed, the open app shows "A new version of the app is ready" within an hour. **Update** reloads it. **Later** keeps working.
