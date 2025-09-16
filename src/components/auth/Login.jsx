import React, { useState, useEffect } from "react";
import { Navigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  Eye,
  EyeOff,
  Lock,
  User,
  Mail,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { toast } from "react-toastify";
import Footer from "../layout/Footer";

const Login = () => {
  const { login, isAuthenticated, loading } = useAuth();
  const [formData, setFormData] = useState({ login: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [isLogging, setIsLogging] = useState(false);
  const [loginError, setLoginError] = useState(null);

  const location = useLocation();
  const from = location.state?.from?.pathname || "/";
  const successMessage = location.state?.message;

  useEffect(() => {
    if (loginError) {
      setLoginError(null);
    }
  }, [formData.login, formData.password]);

  // Redirection si authentifié (même pendant isLogging si c'est un succès)
  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  // Écran de chargement seulement pendant l'initialisation (pas pendant le login)
  if (loading && !isLogging) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLogging(true);
    setLoginError(null);

    try {
      const result = await login(formData);
      if (result.success) {
        toast.success("Connexion réussie !");
        // La redirection se fera automatiquement via <Navigate>
        // On peut arrêter le spinner après un court délai pour le feedback visuel
        setTimeout(() => setIsLogging(false), 500);
      } else {
        setLoginError(result.error || "Erreur de connexion");
        toast.error(result.error || "Erreur de connexion");
        setIsLogging(false);
      }
    } catch (err) {
      console.error("Error during login:", err);
      const errorMsg = "Une erreur est survenue";
      setLoginError(errorMsg);
      toast.error(errorMsg);
      setIsLogging(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Contenu principal centré verticalement */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Header */}
          <div>
            <div className="mx-auto h-16 w-16 bg-red-100 rounded-full flex items-center justify-center">
              <Lock className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Connexion
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Gestion des Services
            </p>
            <p className="mt-1 text-center text-xs text-gray-500">
              Simplon Côte d'Ivoire
            </p>
          </div>

          {/* Message de succès */}
          {successMessage && (
            <div className="flex items-center space-x-2 text-green-600 bg-green-50 p-3 rounded-md">
              <CheckCircle className="h-5 w-5" />
              <span className="text-sm">{successMessage}</span>
            </div>
          )}

          {/* Formulaire */}
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* Login */}
              <div>
                <label
                  htmlFor="login"
                  className="block text-sm font-medium text-gray-700"
                >
                  Nom d'utilisateur ou Email
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    {formData.login.includes("@") ? (
                      <Mail className="h-5 w-5 text-gray-400" />
                    ) : (
                      <User className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                  <input
                    id="login"
                    name="login"
                    type="text"
                    required
                    value={formData.login}
                    onChange={handleChange}
                    className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
                    placeholder="Nom d'utilisateur ou email"
                  />
                </div>
              </div>

              {/* Mot de passe */}
              <div>
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Mot de passe
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-sm text-blue-600 hover:text-blue-500 transition-colors"
                  >
                    Mot de passe oublié ?
                  </Link>
                </div>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    autoComplete="off"
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="appearance-none block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
                    placeholder="Votre mot de passe"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Erreur login */}
            {loginError && (
              <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-md">
                <AlertCircle className="h-5 w-5" />
                <span className="text-sm">{loginError}</span>
              </div>
            )}

            {/* Bouton */}
            <div>
              <button
                type="submit"
                disabled={isLogging}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                {isLogging ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Connexion...
                  </div>
                ) : (
                  "Se connecter"
                )}
              </button>
            </div>

            {/* Info */}
            <div className="text-center">
              <div className="bg-blue-50 p-4 rounded-md">
                <p className="text-xs text-red-600 font-medium mb-2">
                  Informations de connexion
                </p>
                <div className="text-xs text-gray-600 space-y-1">
                  <p>• Utilisez votre nom d'utilisateur ou email</p>
                  <p>• Vos identifiants vous ont été transmis par email</p>
                  <p>
                    • Vous pouvez modifier votre mot de passe après connexion
                  </p>
                  <p>• En cas de problème, contactez l'administrateur</p>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Footer toujours en bas */}
      <Footer />
    </div>
  );
};

export default Login;
