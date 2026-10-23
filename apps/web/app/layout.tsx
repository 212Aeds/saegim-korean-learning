import type { Metadata, Viewport } from "next";
import "./styles.css";
import "./practice.css";
import "./globals.css";
import "./conversation-guide.css";
import "./learning-polish.css";
import "./public-site.css";

export const metadata: Metadata = {
  title: "Saegim — Korean, remembered",
  description:
    "Learn Korean with free lessons, speaking practice, and review.",
  applicationName: "Saegim",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#fffaf3",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
