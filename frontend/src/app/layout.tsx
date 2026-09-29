import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "My Tasks — A little more headspace", description: "A simple, considered space for the things you want to do." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
