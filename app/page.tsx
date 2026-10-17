import Booking from '@/components/Booking';
import Gallery from '@/components/Gallery';
import Header from '@/components/Header';
import Preloader from '@/components/Preloader';
import { SceneProvider } from '@/components/SceneProvider';
import { About, Footer, Prices, Reviews } from '@/components/Sections';
import Space from '@/components/Space';
import Tour from '@/components/Tour';

export default function Home() {
  return (
    <SceneProvider>
      <Preloader />
      <Header />
      <main id="main">
        <Tour />
        <About />
        <Space />
        <Prices />
        <Gallery />
        <Reviews />
        <Booking />
      </main>
      <Footer />
    </SceneProvider>
  );
}
