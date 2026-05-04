import { redirect } from 'next/navigation';

// Admin Settings page has been removed.
// Any direct visit to /admin/settings redirects to the dashboard.
export default function AdminSettingsPage() {
  redirect('/admin/dashboard');
}
