import type { Metadata } from 'next';
import './globals.css';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
export const metadata: Metadata = {
  title: 'Velor Marketplace — Buy and Sell Globally',
  description: 'The AI-powered global marketplace for sellers and buyers worldwide.',
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en"><body><Navigation /><main>{children}</main><Footer /></body></html>
  );
}
