import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-primary",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "TEZCLUB.IN | Premium iGaming & Casino Lobby",
  description: "Play Aviator, Mines, Plinko, WinGo and other provably fair games. Win rewards, participate in promotions, and play instantly.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-bg-body text-text-primary" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
