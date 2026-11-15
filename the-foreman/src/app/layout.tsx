import type { Metadata, Viewport } from "next";
import "@fontsource/barlow-condensed/latin-600.css";
import "@fontsource/barlow-condensed/latin-700.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Foreman",
  description:
    "Run a virtual house build from set-out to handover. A site simulator for TAFE NSW construction students.",
  applicationName: "The Foreman",
  appleWebApp: { capable: true, title: "The Foreman", statusBarStyle: "default" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#F5F3EE",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-AU">
      <body>
        {/* One phone-width column, centred on larger screens. */}
        <div className="mx-auto flex min-h-dvh w-full max-w-[30rem] flex-col overflow-x-clip print:max-w-none">{children}</div>
      </body>
    </html>
  );
}
