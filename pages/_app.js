import "@/styles/globals.css";
import Script from "next/script"; // 👈 Importa Script de next/script

export default function App({ Component, pageProps }) {
  return (
    <>
      {/* Vercel Web Analytics */}
      <Script
        src="https://vercel.com/analytics/script.js"
        strategy="lazyOnload"
      />
      
      <Component {...pageProps} />
    </>
  );
}
