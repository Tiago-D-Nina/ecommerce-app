import { Search } from "lucide-react";
import { Input } from "../ui/Input";
import { CartIcon } from "../ui/CartIcon";
import { useCartStore } from "../../store/cartStore";

export const HeaderContent = () => {
  const { openDrawer } = useCartStore();

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-screen-2xl mx-auto p-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-primary-600">NextUZ</h1>
          </div>

          <div className="flex-1 max-w-lg mx-8">
            <div className="relative">
              <Input
                type="text"
                placeholder="Buscar produtos..."
                className="pr-10"
              />
              <button
                title="Buscar"
                className="absolute inset-y-0 right-0 flex items-center pr-3"
              >
                <Search className="h-5 w-5 text-gray-400" />
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <CartIcon />

            <button 
              onClick={openDrawer}
              className="uppercase px-6 py-3 rounded-full text-white text-sm font-medium bg-[#72C7DA] hover:bg-[#5fb3c7] transition-colors"
            >
              <span>Finalizar sua compra</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
