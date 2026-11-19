// Sending feedback from Profile. The feedback server function checks it, saves it and adds it
// to feedback/FEEDBACK.md in the repository; the browser never holds a GitHub token.

import {
  cleanFeedback,
  FEEDBACK_MAX,
  FEEDBACK_MIN,
  type FeedbackArea,
} from '../../supabase/functions/_shared/feedback';
import { supabase } from './supabase';

/** This build's version: package version and commit, such as 0.1.0+1b56573. */
export const APP_VERSION = __APP_VERSION__;

export async function sendFeedback(area: FeedbackArea, message: string): Promise<void> {
  const clean = cleanFeedback(message);
  if (!clean)
    throw new Error(`Feedback needs between ${FEEDBACK_MIN} and ${FEEDBACK_MAX} characters.`);
  if (!supabase) throw new Error('Accounts are not set up in this build.');
  const { error } = await supabase.functions.invoke('feedback', {
    body: { area, message: clean, appVersion: APP_VERSION },
  });
  if (error) {
    const ctx = (error as { context?: Response }).context;
    const said =
      ctx && typeof ctx.json === 'function'
        ? ((await ctx.json().catch(() => null)) as { error?: string } | null)
        : null;
    throw new Error(said?.error ?? 'Your feedback could not be sent. Try again.');
  }
}
