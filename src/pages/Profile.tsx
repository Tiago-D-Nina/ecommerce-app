import { useState, useEffect } from "react";
import { Navigate } from "react-router";
import {
  User,
  MapPin,
  CreditCard,
  Package,
  RefreshCw,
  XCircle,
  LogOut,
} from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { PersonalInfoSection } from "../components/feature/profile/PersonalInfoSection";
import { AddressSection } from "../components/feature/profile/AddressSection";
import { PaymentMethodsSection } from "../components/feature/profile/PaymentMethodsSection";
import { OrdersSection } from "../components/feature/profile/OrdersSection";
import { RefundsSection } from "../components/feature/profile/RefundsSection";
import { CancellationSection } from "../components/feature/profile/CancellationSection";
import { Button } from "../components/ui/Button";
import { Header } from "../components/layout/Header";

type ProfileTab =
  | "personal"
  | "addresses"
  | "payments"
  | "orders"
  | "refunds"
  | "cancellations";

const tabs = [
  { id: "personal" as ProfileTab, label: "Informações Pessoais", icon: User },
  { id: "addresses" as ProfileTab, label: "Endereços", icon: MapPin },
  {
    id: "payments" as ProfileTab,
    label: "Métodos de Pagamento",
    icon: CreditCard,
  },
  { id: "orders" as ProfileTab, label: "Pedidos", icon: Package },
  { id: "refunds" as ProfileTab, label: "Reembolsos", icon: RefreshCw },
  { id: "cancellations" as ProfileTab, label: "Cancelamentos", icon: XCircle },
];

export function Profile() {
  const [activeTab, setActiveTab] = useState<ProfileTab>("personal");
  const { isAuthenticated, user, signOut } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) return;
    // Load initial data if needed
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleLogout = () => {
    signOut();
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "personal":
        return <PersonalInfoSection />;
      case "addresses":
        return <AddressSection />;
      case "payments":
        return <PaymentMethodsSection />;
      case "orders":
        return <OrdersSection />;
      case "refunds":
        return <RefundsSection />;
      case "cancellations":
        return <CancellationSection />;
      default:
        return <PersonalInfoSection />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Meu Perfil</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Olá, {user?.firstName} {user?.lastName}
                </p>
              </div>
              <Button
                onClick={handleLogout}
                variant="outline"
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      activeTab === tab.id
                        ? "bg-primary-100 text-primary-700 border-r-2 border-primary-600"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              {renderTabContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
