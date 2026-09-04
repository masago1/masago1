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
      <head>
        <style>{`
          html {
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            text-rendering: optimizeLegibility;
          }

          body,
          body *,
          button,
          input,
          select,
          textarea {
            font-family: var(--font-inter), sans-serif !important;
          }

          h1,
          h2,
          h3,
          h4,
          h5,
          h6 {
            font-family: var(--font-manrope), sans-serif !important;
            letter-spacing: -0.03em;
          }

          button,
          input,
          select,
          textarea {
            font-feature-settings: "kern";
          }
        `}</style>
      </head>

      <body
        style={{
          margin: 0,
          background: "#FAFAF8",
        }}
      >
        {children}
      </body>
    </html>
  );
}
