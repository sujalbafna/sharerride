import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/app-sidebar';

export const metadata: Metadata = {
  title: 'Setu Guardian - Your Safety Companion',
  description: 'Setu Guardian ensures traveler safety by connecting them with a network of trusted contacts.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased selection:bg-accent/30 min-h-screen bg-background text-foreground">
        <FirebaseClientProvider>
          <SidebarProvider>
            <div className="flex min-h-screen w-full">
              <AppSidebar />
              <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
                {children}
              </main>
            </div>
          </SidebarProvider>
        </FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
