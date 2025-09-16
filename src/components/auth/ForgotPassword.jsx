import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { toast } from "react-toastify";
import { passwordResetAPI } from "../../services/apis";
import Footer from "../layout/Footer";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Veuillez entrer une adresse email.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await passwordResetAPI.requestReset(email);

      if (response.data) {
        toast.success("Code de vérification envoyé par email !");
        navigate("/verify-reset-code", {
          state: {
            email: email.toLowerCase(),
            expiresIn: response.data.expires_in || 300,
          },
        });
      }
    } catch (err) {
      console.error("Erreur lors de la demande de réinitialisation:", err);

      const errorData = err.response?.data;

      let errorMessage = "Une erreur est survenue. Veuillez réessayer.";

      if (typeof errorData === "string") {
        errorMessage = errorData;
      } else if (errorData?.error) {
        errorMessage = errorData.error;
      } else if (err.response?.status === 400) {
        errorMessage = "Email invalide ou compte non trouvé.";
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
          <div className="mx-auto h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
            <Mail className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Mot de passe oublié
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Saisissez votre email pour recevoir un code de vérification
          </p>
        </div>

        {/* Formulaire */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Adresse email
            </label>
            <div className="mt-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="votre.email@exemple.com"
              />
            </div>
          </div>

          {/* Bouton d'envoi */}
          <div>
            <button
              type="submit"
              disabled={isLoading || !email.trim()}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Envoi en cours...
                </div>
              ) : (
                "Envoyer le code"
              )}
            </button>
          </div>

          {/* Informations */}
          <div className="bg-blue-50 p-4 rounded-md">
            <div className="flex items-start">
              <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-1">Comment ça marche :</p>
                <ul className="space-y-1 text-xs">
                  <li>• Un code à 5 chiffres sera envoyé à votre email</li>
                  <li>• Le code expire dans 5 minutes</li>
                  <li>• Vérifiez aussi vos spams/courriers indésirables</li>
                  <li>• Vous pourrez renvoyer le code si nécessaire</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Retour à la connexion */}
          <div className="text-center">
            <Link
              to="/login"
              className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
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

export default ForgotPassword;
