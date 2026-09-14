import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FutureSchool AI",
  description: "2040 için sürdürülebilir okul kampüsü tasarım oyunu"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="tr"><body>{children}</body></html>;
}
