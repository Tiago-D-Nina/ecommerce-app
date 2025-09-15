import { Routes, Route, Navigate } from 'react-router-dom';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { CheckoutBilling } from './pages/CheckoutBilling';
import { CheckoutPayment } from './pages/CheckoutPayment';
import { CheckoutSuccess } from './pages/CheckoutSuccess';
import { Profile } from './pages/Profile';
import EmailConfirmation from './pages/EmailConfirmation';

// Admin components
import { AdminLogin } from './pages/admin/AdminLogin';
import { Dashboard } from './pages/admin/Dashboard';
import { Products } from './pages/admin/Products';
import { ProductNew } from './pages/admin/ProductNew';
import { ProductEdit } from './pages/admin/ProductEdit';
import { Categories } from './pages/admin/Categories';
import { Orders } from './pages/admin/Orders';
import { AdminLayout } from './components/admin/layout/AdminLayout';
import { AdminRoute } from './components/admin/guards/AdminRoute';
import { NotificationCenter } from './components/admin/ui/NotificationCenter';

function App() {
  return (
    <>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/checkout" element={<CheckoutBilling />} />
        <Route path="/checkout/payment" element={<CheckoutPayment />} />
        <Route path="/checkout/success" element={<CheckoutSuccess />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/email-confirmation" element={<EmailConfirmation />} />

        {/* Admin routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="products" element={<Products />} />
          <Route path="products/new" element={<ProductNew />} />
          <Route path="products/:id/edit" element={<ProductEdit />} />
          <Route path="categories" element={<Categories />} />
          <Route path="orders" element={<Orders />} />
          {/* Add more admin routes as they are implemented */}
        </Route>

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      
      {/* Global notification center */}
      <NotificationCenter />
    </>
  );
}

export default App;
