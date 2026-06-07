import { Space_Grotesk } from "next/font/google";
import "./globals.css";

const primaryFont = Space_Grotesk({
  variable: "--font-primary",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const monoFont = Space_Grotesk({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata = {
  title: "TEZCLUB.IN | Premium iGaming & Casino Lobby",
  description: "Play Aviator, Mines, Plinko, WinGo and other provably fair games. Win rewards, participate in promotions, and play instantly.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${primaryFont.variable} ${monoFont.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-bg-body text-text-primary" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
