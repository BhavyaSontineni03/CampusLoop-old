import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "CampusLoop · Your week, together",
  description: "Find a campus commute partner once. Ride together each week.",
  icons: { icon: "/favicon.svg" },
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
