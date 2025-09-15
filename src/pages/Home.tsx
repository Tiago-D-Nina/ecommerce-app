import { Header } from '../components/layout/Header';
import { Carousel } from '../components/feature/Carousel';
import { ProductShelf } from '../components/feature/ProductShelf';
import { StaticBanner } from '../components/ui/StaticBanner';
import { CartDrawer } from '../components/feature/cart/CartDrawer';
import { STATIC_BANNERS } from '../constants';

export const Home = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main>
        <section className="py-6">
          <div className="max-w-screen-2xl mx-auto p-4">
            <Carousel />
          </div>
        </section>

        <ProductShelf />

        {/* Banner Estático Sazonal */}
        <section className="py-6">
          <div className="max-w-screen-2xl mx-auto p-4 flex justify-center">
            <StaticBanner 
              banner={STATIC_BANNERS.seasonal}
            />
          </div>
        </section>

        <ProductShelf />
      </main>
      
      <CartDrawer />
    </div>
  );
};