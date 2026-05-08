import type {Metadata} from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DocAlly | Enterprise document accessibility",
  description: "Private accessibility intelligence for neurodivergent employees and enterprise compliance teams.",
};

export default function RootLayout({children}: Readonly<{children: React.ReactNode}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
