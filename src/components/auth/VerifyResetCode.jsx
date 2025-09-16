import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Shield, ArrowLeft, RefreshCw, Clock, CheckCircle } from "lucide-react";
import { toast } from "react-toastify";
import { passwordResetAPI } from "../../services/apis";
import Footer from "../layout/Footer";

const VerifyResetCode = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [code, setCode] = useState(["", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300);
  const inputRefs = useRef([]);

  const email = location.state?.email;
  const initialExpiresIn = location.state?.expiresIn || 300;

  useEffect(() => {
    if (!email) {
      navigate("/forgot-password");
      return;
    }

    setTimeLeft(initialExpiresIn);
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [email, navigate, initialExpiresIn]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const handleInputChange = (index, value) => {
    if (value.length > 1 || !/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value && index < 4) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 5);
    if (!/^\d+$/.test(pastedData)) return;

    const newCode = [...code];
    for (let i = 0; i < pastedData.length && i < 5; i++) {
      newCode[i] = pastedData[i];
    }
    setCode(newCode);
    const lastFilledIndex = Math.min(pastedData.length - 1, 4);
    inputRefs.current[lastFilledIndex]?.focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fullCode = code.join("");

    if (fullCode.length !== 5) {
      toast.error("Veuillez saisir le code complet à 5 chiffres");
      return;
    }

    if (timeLeft <= 0) {
      toast.error("Le code a expiré. Veuillez en demander un nouveau.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await passwordResetAPI.verifyCode(email, fullCode);

      if (response.data?.reset_token) {
        toast.success("Code vérifié avec succès !");
        navigate("/reset-password", {
          state: {
            resetToken: response.data.reset_token,
            email: email,
          },
        });
      }
    } catch (err) {
      console.error("Erreur lors de la vérification:", err);

      const errorData = err.response?.data;
      let errorMessage = "Code incorrect ou expiré";

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

  const handleResendCode = async () => {
    setIsResending(true);

    try {
      const response = await passwordResetAPI.requestReset(email);

      if (response.data) {
        toast.success("Nouveau code envoyé !");
        setTimeLeft(response.data.expires_in || 300);
        setCode(["", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      }
    } catch (err) {
      console.error("Erreur lors du renvoi:", err);

      const errorData = err.response?.data;
      let errorMessage = "Erreur lors du renvoi du code. Veuillez réessayer.";

      if (typeof errorData === "string") {
        errorMessage = errorData;
      } else if (errorData?.error) {
        errorMessage = errorData.error;
      }

      toast.error(errorMessage);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
            <Shield className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Code de vérification
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Saisissez le code à 5 chiffres envoyé à
          </p>
          <p className="mt-1 text-center text-sm font-medium text-gray-900">
            {email}
          </p>
        </div>

        <div className="text-center">
          <div
            className={`inline-flex items-center px-3 py-2 rounded-full text-sm ${
              timeLeft <= 60
                ? "bg-red-100 text-red-700"
                : "bg-blue-100 text-blue-700"
            }`}
          >
            <Clock className="h-4 w-4 mr-1" />
            {timeLeft > 0
              ? `Expire dans ${formatTime(timeLeft)}`
              : "Code expiré"}
          </div>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700 text-center mb-4">
              Code de vérification
            </label>
            <div className="flex justify-center space-x-3">
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleInputChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  className="w-12 h-12 text-center text-xl font-bold border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  disabled={timeLeft <= 0}
                />
              ))}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={
                isLoading || code.join("").length !== 5 || timeLeft <= 0
              }
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Vérification...
                </div>
              ) : (
                "Vérifier le code"
              )}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={handleResendCode}
              disabled={isResending}
              className="inline-flex items-center text-sm text-blue-600 hover:text-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <RefreshCw
                className={`h-4 w-4 mr-1 ${isResending ? "animate-spin" : ""}`}
              />
              {isResending ? "Envoi..." : "Renvoyer le code"}
            </button>
          </div>

          <div className="bg-yellow-50 p-4 rounded-md">
            <div className="flex items-start">
              <CheckCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
              <div className="text-sm text-yellow-700">
                <p className="font-medium mb-1">Conseils :</p>
                <ul className="space-y-1 text-xs">
                  <li>• Vérifiez vos spams si vous ne recevez pas le code</li>
                  <li>• Vous pouvez coller le code directement</li>
                  <li>• Le code expire automatiquement après 5 minutes</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="text-center">
            <Link
              to="/forgot-password"
              className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Changer d'email
            </Link>
          </div>
        </form>

        <Footer />
      </div>
    </div>
  );
};

export default VerifyResetCode;
