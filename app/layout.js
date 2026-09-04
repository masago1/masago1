import { Inter, Manrope } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata = {
  title: "Masago",
  description:
    "Descoperă restaurante și oferte în Timișoara.",
};

export default function RootLayout({
  children,
}) {
  return (
    <html
      lang="ro"
      className={`${inter.variable} ${manrope.variable}`}
    >
      <body
        style={{
          margin: 0,
          fontFamily:
            "var(--font-inter), sans-serif",
          WebkitFontSmoothing:
            "antialiased",
          MozOsxFontSmoothing:
            "grayscale",
          textRendering:
            "optimizeLegibility",
        }}
      >
        {children}
      </body>
    </html>
  );
}
