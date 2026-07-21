// Live stream report reasons (William, 2026-07-21): every report is filled
// in on the report form with one of these reasons before it counts. Shared
// by the API route, the web viewer's report form, and the app's.
export const LIVE_REPORT_REASONS: Record<string, string> = {
  contact: 'Sharing contact details or steering buyers off Velor',
  inappropriate: 'Inappropriate or offensive behaviour',
  prohibited: 'Counterfeit or prohibited items',
  misleading: 'Spam or misleading claims',
  safety: 'Safety concern',
  other: 'Something else',
}
