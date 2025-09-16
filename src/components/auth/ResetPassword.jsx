import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Key,
  Eye,
  EyeOff,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  Lock,
} from "lucide-react";
import { toast } from "react-toastify";
import { passwordResetAPI } from "../../services/apis";
import Footer from "../layout/Footer";

const ResetPassword = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: [],
  });

  const resetToken = location.state?.resetToken;
  const email = location.state?.email;

  useEffect(() => {
    if (!resetToken) {
      navigate("/forgot-password");
      return;
    }
  }, [resetToken, navigate]);

  const evaluatePasswordStrength = (password) => {
    let score = 0;
    const feedback = [];

    if (password.length >= 8) score++;
    else feedback.push("Au moins 8 caractères");

    if (/[a-z]/.test(password)) score++;
    else feedback.push("Une lettre minuscule");

    if (/[A-Z]/.test(password)) score++;
    else feedback.push("Une lettre majuscule");

    if (/\d/.test(password)) score++;
    else feedback.push("Un chiffre");

    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score++;
    else feedback.push("Un caractère spécial");

    return { score, feedback };
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === "newPassword") {
      setPasswordStrength(evaluatePasswordStrength(value));
    }
  };

  const getPasswordStrengthColor = (score) => {
    if (score <= 1) return "bg-red-500";
    if (score <= 2) return "bg-orange-500";
    if (score <= 3) return "bg-yellow-500";
    if (score <= 4) return "bg-blue-500";
    return "bg-green-500";
  };

  const getPasswordStrengthText = (score) => {
    if (score <= 1) return "Très faible";
    if (score <= 2) return "Faible";
    if (score <= 3) return "Moyen";
    if (score <= 4) return "Bon";
    return "Excellent";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.newPassword.length < 8) {
      toast.error("Le mot de passe doit contenir au moins 8 caractères");
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }

    if (passwordStrength.score < 3) {
      toast.error("Le mot de passe est trop faible. Veuillez le renforcer.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await passwordResetAPI.confirmReset(
        resetToken,
        formData.newPassword,
        formData.confirmPassword
      );

      if (response.data) {
        toast.success("Mot de passe réinitialisé avec succès !");
        navigate("/login", {
          state: {
            message:
              "Votre mot de passe a été modifié. Vous pouvez maintenant vous connecter.",
          },
        });
      }
    } catch (err) {
      console.error("Erreur lors de la réinitialisation:", err);

      const errorData = err.response?.data;
      let errorMessage = "Erreur lors de la réinitialisation.";

      if (typeof errorData === "string") {
        errorMessage = errorData;
      } else if (errorData?.error) {
        errorMessage = errorData.error;
      } else if (errorData?.non_field_errors) {
        errorMessage = errorData.non_field_errors[0];
      }

      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div>
          <div className="mx-auto h-16 w-16 bg-red-100 rounded-full flex items-center justify-center">
            <Key className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Nouveau mot de passe
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Créez un mot de passe sécurisé pour votre compte
          </p>
          {email && (
            <p className="mt-1 text-center text-sm font-medium text-gray-900">
              {email}
            </p>
          )}
        </div>

        {/* Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {/* Nouveau mot de passe */}
          <div>
            <label
              htmlFor="newPassword"
              className="block text-sm font-medium text-gray-700"
            >
              Nouveau mot de passe
            </label>
            <div className="mt-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="newPassword"
                name="newPassword"
                type={showNewPassword ? "text" : "password"}
                required
                value={formData.newPassword}
                onChange={handleChange}
                className="appearance-none block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
                placeholder="Votre nouveau mot de passe"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
              >
                {showNewPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                )}
              </button>
            </div>

            {/* Indicateur de force */}
            {formData.newPassword && (
              <div className="mt-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-600">
                    Force du mot de passe
                  </span>
                  <span
                    className={`text-xs font-medium ${
                      passwordStrength.score <= 2
                        ? "text-red-600"
                        : passwordStrength.score <= 4
                        ? "text-yellow-600"
                        : "text-green-600"
                    }`}
                  >
                    {getPasswordStrengthText(passwordStrength.score)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${getPasswordStrengthColor(
                      passwordStrength.score
                    )}`}
                    style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                  ></div>
                </div>
                {passwordStrength.feedback.length > 0 && (
                  <div className="mt-1 text-xs text-gray-600">
                    Manque : {passwordStrength.feedback.join(", ")}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Confirmer mot de passe */}
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700"
            >
              Confirmer le mot de passe
            </label>
            <div className="mt-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="appearance-none block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
                placeholder="Confirmez votre nouveau mot de passe"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                )}
              </button>
            </div>

            {formData.confirmPassword && (
              <div className="mt-1 flex items-center text-xs">
                {formData.newPassword === formData.confirmPassword ? (
                  <div className="flex items-center text-green-600">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Les mots de passe correspondent
                  </div>
                ) : (
                  <div className="flex items-center text-red-600">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Les mots de passe ne correspondent pas
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bouton */}
          <div>
            <button
              type="submit"
              disabled={
                isLoading ||
                !formData.newPassword ||
                !formData.confirmPassword ||
                formData.newPassword !== formData.confirmPassword ||
                passwordStrength.score < 3
              }
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Réinitialisation...
                </div>
              ) : (
                "Réinitialiser le mot de passe"
              )}
            </button>
          </div>

          {/* Conseils */}
          <div className="bg-blue-50 p-4 rounded-md">
            <div className="flex items-start">
              <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-1">
                  Conseils pour un mot de passe sécurisé :
                </p>
                <ul className="space-y-1 text-xs">
                  <li>• Au moins 8 caractères (12+ recommandé)</li>
                  <li>
                    • Mélange de majuscules, minuscules, chiffres et symboles
                  </li>
                  <li>• Évitez les informations personnelles</li>
                  <li>• N'utilisez pas ce mot de passe ailleurs</li>
                  <li>• Changez-le régulièrement</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Retour */}
          <div className="text-center">
            <Link
              to="/login"
              className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Retour à la connexion
            </Link>
          </div>
        </form>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
};

export default ResetPassword;
