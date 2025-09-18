import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  Menu,
  X,
  User,
  LogOut,
  Settings,
  Home,
  FileText,
  Plus,
  CheckSquare,
  BarChart3,
} from "lucide-react";
import { Link, NavLink } from "react-router-dom";

const Navbar = () => {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
  };

  const getRoleDisplay = (role) => {
    const roles = {
      employee: "Employé",
      mg: "Moyens Généraux",
      accounting: "Comptabilité",
      director: "Direction",
    };
    return roles[role] || role;
  };

  // Navigation items (même que dans la sidebar)
  const navigation = [
    {
      name: "Dashboard",
      href: "/",
      icon: Home,
      allowedRoles: ["employee", "mg", "accounting", "director"],
    },
    {
      name: "Mes demandes",
      href: "/requests",
      icon: FileText,
      allowedRoles: ["employee", "mg", "accounting", "director"],
    },
    {
      name: "Nouvelle demande",
      href: "/requests/create",
      icon: Plus,
      allowedRoles: ["employee", "mg"],
    },
    {
      name: "Validations",
      href: "/validations",
      icon: CheckSquare,
      allowedRoles: ["mg", "accounting", "director"],
    },
    {
      name: "Statistiques",
      href: "/statistics",
      icon: BarChart3,
      allowedRoles: ["mg", "director"],
    },
  ];

  const filteredNavigation = navigation.filter((item) =>
    item.allowedRoles.includes(user?.role)
  );

  const closeMobileMenu = () => {
    setShowMobileMenu(false);
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo et titre */}
          <div className="flex items-center">
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              {showMobileMenu ? <X size={24} /> : <Menu size={24} />}
            </button>
            <div className="flex-shrink-0 flex items-center ml-4 md:ml-0">
              <img
                src="/Logo-Simplon-CI.webp"
                alt="Logo Simplon CI"
                className="h-10 w-auto"
              />
            </div>

            {/* <div className="flex-shrink-0 flex items-center ml-4 md:ml-0">
              <h1 className="text-xl font-bold text-gray-900">
                Gestion Moyens Généraux
              </h1>
            </div> */}
          </div>

          {/* Menu utilisateur */}
          <div className="flex items-center">
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center text-sm rounded-full text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 pr-4 pl-4 cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium text-gray-900">
                      {user?.first_name || user?.username}
                    </p>
                    <p className="text-xs text-gray-500">
                      {getRoleDisplay(user?.role)}
                    </p>
                  </div>
                  <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                    <User size={16} className="text-red-600" />
                  </div>
                </div>
              </button>

              {/* Dropdown menu */}
              {showUserMenu && (
                <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                  <div className="py-1">
                    <Link
                      to="/profile"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <Settings size={16} className="mr-3" />
                      Mon profil
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                    >
                      <LogOut size={16} className="mr-3" />
                      Déconnexion
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Menu mobile avec navigation */}
      {showMobileMenu && (
        <div className="md:hidden border-t border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white">
            {/* Informations utilisateur sur mobile */}
            <div className="px-3 py-3 border-b border-gray-200 mb-2">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                  <User size={20} className="text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {user?.first_name || user?.username}
                  </p>
                  <p className="text-xs text-gray-500">
                    {getRoleDisplay(user?.role)}
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation mobile */}
            {filteredNavigation.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  end={item.href === "/requests"}
                  onClick={closeMobileMenu}
                  className={({ isActive }) =>
                    `group flex items-center px-3 py-2 text-base font-medium rounded-md transition-colors ${
                      isActive
                        ? "bg-gray-200 text-gray-800"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`
                  }
                >
                  <Icon
                    className="mr-3 flex-shrink-0 h-5 w-5"
                    aria-hidden="true"
                  />
                  {item.name}
                </NavLink>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;

{
  /* Actions utilisateur dans le menu mobile */
}
{
  /* <div className="border-t border-gray-200 pt-3 mt-3">
              <Link
                to="/profile"
                onClick={closeMobileMenu}
                className="group flex items-center px-3 py-2 text-base font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900"
              >
                <Settings className="mr-3 flex-shrink-0 h-5 w-5" />
                Mon profil
              </Link>
              <button
                onClick={() => {
                  handleLogout();
                  closeMobileMenu();
                }}
                className="group flex items-center w-full text-left px-3 py-2 text-base font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900"
              >
                <LogOut className="mr-3 flex-shrink-0 h-5 w-5" />
                Déconnexion
              </button>
            </div> */
}
