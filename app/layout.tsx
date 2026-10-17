import type { Metadata, Viewport } from 'next';
// Шрифты self-hosted через Fontsource (без запросов к Google на сборке и у посетителя):
// Manrope — ближайший к надписи логотипа гротеск; Golos Text — основной текст; IBM Plex Mono — размеры и подписи
import '@fontsource-variable/manrope/wght.css';
import '@fontsource-variable/golos-text/wght.css';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';
import './globals.css';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000');

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'АРКА 123 — зал для мастер-классов напротив Библиотеки',
  description: 'Зал 123 м² для мастер-классов и семинаров с арочными окнами на Национальную библиотеку. Минск, ул. Мстиславца, 10.',
  openGraph: {
    title: 'АРКА 123 — встречаемся напротив Библиотеки',
    description: 'Зал 123 м² с арочными окнами 4 × 3,5 м на Национальную библиотеку. Минск, Мстиславца, 10.',
    images: ['/img/sunset.webp'],
    locale: 'ru_RU',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: [{ media: '(prefers-color-scheme: light)', color: '#efede8' }, { media: '(prefers-color-scheme: dark)', color: '#141a1d' }],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
