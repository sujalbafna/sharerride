import type { Metadata } from 'next';
import './globals.css';
import { Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster"
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { ThemeProvider } from '@/components/theme-provider';
import { BottomNav } from '@/components/layout/bottom-nav';

export const metadata: Metadata = {
  title: 'ShareRide - Your Safety Companion',
  description: 'ShareRide ensures traveler safety by connecting them with a network of trusted friends.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased selection:bg-accent/30 min-h-screen bg-background text-foreground">
        <FirebaseClientProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            forcedTheme="light"
            disableTransitionOnChange
          >
            <SidebarProvider>
              <div className="flex min-h-screen w-full relative">
                <Suspense fallback={null}>
                  <AppSidebar />
                </Suspense>
                <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
                  <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
                    <Suspense fallback={null}>
                      {children}
                    </Suspense>
                  </main>
                  <BottomNav />
                </div>
              </div>
            </SidebarProvider>
          </ThemeProvider>
        </FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}