import type { Metadata, Viewport } from "next";
import "./globals.css";

// Runs as a home-screen web app on a 390×844 iPhone (sprint-context.md,
// 2026-09-14). `black-translucent` lets pages draw under iOS's own status
// bar, so the exported exam plan frames sit full-bleed; Screen pads its top
// by the safe-area inset instead.
export const metadata: Metadata = {
  title: "Voice recall",
  description: "Knowunity voice active-recall prototype",
  appleWebApp: {
    capable: true,
    title: "Voice recall",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  colorScheme: "dark",
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
