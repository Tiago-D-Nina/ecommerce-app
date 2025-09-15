import { useState } from 'react';
import { ChevronDown, User } from 'lucide-react';
import { Link } from 'react-router';
import { HEADER_LINKS } from '../../constants';
import { useAuthStore } from '../../store/authStore';

export const Topbar = () => {
  const { isAuthenticated, user } = useAuthStore();
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <>
      <div className="bg-[#72C7DA]">
        <div className="max-w-screen-2xl mx-auto px-4 uppercase">
          <div className="flex items-center justify-between h-10 text-sm">
            <div className="flex items-center gap-6">
              {HEADER_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-white hover:text-gray-400 transition-colors duration-200"
                >
                  {link.label}
                </a>
              ))}
            </div>
            
            <div className="flex items-center space-x-4">
              {isAuthenticated && user ? (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 text-white hover:text-gray-400 transition-colors duration-200"
                  >
                    <User className="h-4 w-4" />
                    <span>Olá, {user.firstName}</span>
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  
                  {showUserMenu && (
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                      <Link
                        to="/profile"
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowUserMenu(false)}
                      >
                        Meu Perfil
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-white hover:text-gray-400 transition-colors duration-200"
                  >
                    Login
                  </Link>
                  <span className="text-white">|</span>
                  <Link
                    to="/register"
                    className="text-white hover:text-gray-400 transition-colors duration-200"
                  >
                    Registrar
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Click outside to close user menu */}
      {showUserMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </>
  );
};