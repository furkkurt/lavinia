import type { Metadata } from "next";
import { Jost, Marcellus } from "next/font/google";
import "bootstrap/dist/css/bootstrap.min.css";
import "swiper/css";
import "./styles/normalize.css";
import "./styles/vendor.css";
import "./styles/style.css";
import Script from "next/script";
import ClientScripts from "./components/ClientScripts";

const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  style: ["normal", "italic"],
});

const marcellus = Marcellus({
  variable: "--font-marcellus",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "Boutique Lavinia - Moda Butiği",
  description: "Boutique Lavinia - Şık ve Zarif Moda Koleksiyonları",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className={`${jost.variable} ${marcellus.variable} homepage`}>
        <ClientScripts />
        {children}
        <Script
          src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha3/dist/js/bootstrap.bundle.min.js"
          integrity="sha384-ENjdO4Dr2bkBIFxQpeoTz1HIcje39Wm4jDKdf19U8gI4ddQ3GYNS7NTKfAdVQSZe"
          crossOrigin="anonymous"
        />
        <Script src="https://cdn.jsdelivr.net/npm/swiper@9/swiper-bundle.min.js" />
        <Script src="/js/jquery.min.js" strategy="beforeInteractive" />
        <Script src="/js/plugins.js" />
        <Script src="/js/SmoothScroll.js" />
        <Script src="/js/script.min.js" />
      </body>
    </html>
  );
}
