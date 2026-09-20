import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chatversio AI - Voice Agent",
  description: "Single-tenant voice agent for conversations, leads, handoff, and meetings",
  icons: {
    icon: "/logo.png",          // ← favicon
    shortcut: "/logo.png",
    apple: "/logo.png",         // for Apple devices
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen">{children}</body>
    </html>
  );
}