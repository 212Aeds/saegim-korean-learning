import type { Metadata, Viewport } from "next";
import "./styles.css";
import "./practice.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Saegim — Korean, remembered",
  description:
    "A free, friendly place to learn Korean one small step at a time.",
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
