import { useState } from "react";
import { Link, Navigate } from "react-router";
import { Eye, EyeOff, Mail, Lock, ArrowLeft } from "lucide-react";
import { Header } from "../components/layout/Header";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { ErrorDisplay } from "../components/ui/ErrorDisplay";
import { useAuthStore } from "../store/authStore";

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {}
  );

  const { signIn, isLoading, error, isAuthenticated, clearError } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = "Email é obrigatório";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Email inválido";
    }

    if (!password.trim()) {
      newErrors.password = "Senha é obrigatória";
    } else if (password.length < 6) {
      newErrors.password = "Senha deve ter pelo menos 6 caracteres";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    await signIn(email, password);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main>
        <div className="max-w-screen-2xl mx-auto p-4">
          <div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden max-w-4xl w-full">
              <div className="grid grid-cols-1 lg:grid-cols-2">
                {/* Left Side - Login Form */}
                <div className="p-8 lg:p-12">
                  <div className="mb-8">
                    <Link
                      to="/"
                      className="inline-flex items-center text-sm text-gray-600 hover:text-primary-600 transition-colors mb-6"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Voltar para loja
                    </Link>

                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                      Fazer Login
                    </h1>
                    <p className="text-gray-600">
                      Entre em sua conta para continuar suas compras
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <label
                        htmlFor="email"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Email
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Mail className="h-5 w-5 text-gray-400" />
                        </div>
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className={`pl-10 ${
                            errors.email
                              ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                              : ""
                          }`}
                          placeholder="seu@email.com"
                          disabled={isLoading}
                        />
                      </div>
                      {errors.email && (
                        <p className="text-sm text-red-500 mt-1">
                          {errors.email}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="password"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Senha
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Lock className="h-5 w-5 text-gray-400" />
                        </div>
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className={`pl-10 pr-10 ${
                            errors.password
                              ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                              : ""
                          }`}
                          placeholder="Sua senha"
                          disabled={isLoading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          disabled={isLoading}
                        >
                          {showPassword ? (
                            <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                          ) : (
                            <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                          )}
                        </button>
                      </div>
                      {errors.password && (
                        <p className="text-sm text-red-500 mt-1">
                          {errors.password}
                        </p>
                      )}
                    </div>

                    {error && (
                      <ErrorDisplay error={error} onDismiss={clearError} />
                    )}

                    <Button
                      type="submit"
                      className="w-full h-12 text-base"
                      disabled={isLoading}
                    >
                      {isLoading ? "Entrando..." : "Entrar"}
                    </Button>

                    <div className="text-center">
                      <p className="text-sm text-gray-600">
                        Não tem uma conta?{" "}
                        <Link
                          to="/register"
                          className="font-medium text-primary-600 hover:text-primary-500 transition-colors"
                        >
                          Criar conta
                        </Link>
                      </p>
                    </div>
                  </form>
                </div>

                {/* Right Side - Brand/Image */}
                <div className="bg-gradient-to-br from-primary-500 to-[#72C7DA] p-8 lg:p-12 flex items-center justify-center text-white">
                  <div className="text-center">
                    <div className="mb-6">
                      <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <div className="text-4xl">🛍️</div>
                      </div>
                      <h2 className="text-3xl font-bold mb-4">
                        Bem-vindo de volta!
                      </h2>
                      <p className="text-lg opacity-90 mb-6">
                        Acesse sua conta e continue explorando nossos produtos
                        incríveis.
                      </p>
                    </div>

                    <div className="space-y-4 text-left">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                          <span className="text-sm">✓</span>
                        </div>
                        <span className="text-sm">
                          Acesso ao histórico de pedidos
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                          <span className="text-sm">✓</span>
                        </div>
                        <span className="text-sm">
                          Lista de desejos personalizada
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                          <span className="text-sm">✓</span>
                        </div>
                        <span className="text-sm">Checkout mais rápido</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
