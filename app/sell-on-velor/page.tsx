import { redirect } from 'next/navigation';

// This page has been consolidated into /sell. Keeping this route alive so any
// bookmarked or indexed links to /sell-on-velor land on the live seller page
// instead of a dead end.
export default function SellOnVelorRedirect() {
    redirect('/sell');
}
