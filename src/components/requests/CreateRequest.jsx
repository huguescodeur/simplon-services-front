import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { requestsAPI, attachmentsAPI } from "../../services/apis";
import { useAuth } from "../../context/AuthContext";
import {
  ShoppingCart,
  FileText,
  AlertCircle,
  DollarSign,
  Package,
  MessageSquare,
  Clock,
  Upload,
  X,
  File,
  Image,
} from "lucide-react";
import AttachmentsManager from "./AttachmentsManager";

const CreateRequest = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [pendingFiles, setPendingFiles] = useState([]);

  const [formData, setFormData] = useState({
    item_description: "",
    quantity: "",
    estimated_cost: "",
    urgency: "medium",
    justification: "",
  });

  const [errors, setErrors] = useState({});

  // Options d'urgence selon le modèle
  const urgencyOptions = [
    { value: "low", label: "Faible", color: "text-green-600" },
    { value: "medium", label: "Moyenne", color: "text-yellow-600" },
    { value: "high", label: "Élevée", color: "text-orange-600" },
    { value: "critical", label: "Critique", color: "text-red-600" },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Nettoyer l'erreur du champ modifié
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Gestion des fichiers pour MG
  const handleFilesChange = (files) => {
    setPendingFiles(files);
  };

  const validateForm = () => {
    const newErrors = {};

    // Validation description
    if (!formData.item_description.trim()) {
      newErrors.item_description =
        "La description du produit/service est obligatoire";
    } else if (formData.item_description.trim().length < 10) {
      newErrors.item_description =
        "La description doit contenir au moins 10 caractères";
    }

    // Validation quantité
    if (!formData.quantity) {
      newErrors.quantity = "La quantité est obligatoire";
    } else if (parseInt(formData.quantity) <= 0) {
      newErrors.quantity = "La quantité doit être supérieure à 0";
    }

    // // Validation coût estimé
    // if (!formData.estimated_cost) {
    //   newErrors.estimated_cost = "Le coût estimé est obligatoire";
    // } else if (parseFloat(formData.estimated_cost) <= 0) {
    //   newErrors.estimated_cost = "Le coût estimé doit être supérieur à 0";
    // }
    // Validation coût estimé — uniquement si le rôle est "mg"
    if (user?.role === "mg") {
      if (!formData.estimated_cost) {
        newErrors.estimated_cost = "Le coût estimé est obligatoire";
      } else if (parseFloat(formData.estimated_cost) <= 0) {
        newErrors.estimated_cost = "Le coût estimé doit être supérieur à 0";
      }
    }

    // Validation justification
    if (!formData.justification.trim()) {
      newErrors.justification = "La justification est obligatoire";
    } else if (formData.justification.trim().length < 20) {
      newErrors.justification =
        "La justification doit contenir au moins 20 caractères";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Veuillez corriger les erreurs du formulaire");
      return;
    }

    setIsLoading(true);

    try {
      // Préparer les données pour l'API
      const submitData = {
        ...formData,
        quantity: parseInt(formData.quantity),
        estimated_cost: parseFloat(formData.estimated_cost),
        auto_validate_mg: user?.role === "mg",
      };

      const response = await requestsAPI.createRequest(submitData);
      const requestId = response.data.id;

      // Si MG a ajouté des fichiers, on les upload après création
      if (user?.role === "mg" && pendingFiles.length > 0) {
        toast.info("Upload des pièces jointes en cours...");

        try {
          // Upload chaque fichier avec gestion d'erreur individuelle
          const uploadResults = await Promise.allSettled(
            pendingFiles.map(async (pendingFile) => {
              if (!pendingFile.file) {
                throw new Error(
                  `Fichier manquant pour ${
                    pendingFile.name || "fichier inconnu"
                  }`
                );
              }

              console.log("Uploading file:", {
                name: pendingFile.file.name || pendingFile.name,
                size: pendingFile.file.size,
                type: pendingFile.file.type,
              });

              return await attachmentsAPI.uploadAttachment({
                request: requestId,
                file: pendingFile.file,
                file_type: "other",
                description:
                  pendingFile.description ||
                  pendingFile.file.name ||
                  pendingFile.name,
              });
            })
          );

          // Vérifier les résultats des uploads
          const failedUploads = uploadResults.filter(
            (result) => result.status === "rejected"
          );
          const successfulUploads = uploadResults.filter(
            (result) => result.status === "fulfilled"
          );

          if (failedUploads.length > 0) {
            // console.error(
            //   "Erreurs upload:",
            //   failedUploads.map((f) => f.reason)
            // );
            toast.warning(
              `Demande créée avec succès. ${successfulUploads.length} fichier(s) ajouté(s), ${failedUploads.length} échec(s)`
            );
          } else {
            toast.success(
              "Demande créée et tous les fichiers ajoutés avec succès !"
            );
          }
        } catch (uploadError) {
          // console.error("Erreur upload fichiers:", uploadError);
          toast.warning(
            "Demande créée mais erreur lors de l'upload de certains fichiers"
          );
        }
      } else {
        toast.success("Demande créée avec succès !");
      }

      // Message spécial pour MG
      if (user?.role === "mg") {
        toast.info(
          "Votre demande a été automatiquement validée côté MG et transmise à la comptabilité",
          {
            duration: 5000,
          }
        );
      }

      // Rediriger vers le détail de la demande créée
      navigate(`/requests/${requestId}`);
    } catch (error) {
      // console.error("Erreur lors de la création:", error);

      if (error.response?.data) {
        // Erreurs de validation du serveur
        const serverErrors = error.response.data;

        if (typeof serverErrors === "object") {
          setErrors(serverErrors);
          toast.error("Veuillez corriger les erreurs du formulaire");
        } else {
          toast.error("Erreur lors de la création de la demande");
        }
      } else {
        toast.error("Erreur de connexion au serveur");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/requests");
  };

  // Déterminer si on affiche la section pièces jointes
  const showAttachmentsSection = user?.role === "mg";

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center space-x-3">
        {/* <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
            <ShoppingCart className="w-6 h-6 text-gray-600" />
          </div>
        </div> */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Nouvelle demande d'achat
          </h1>
          <p className="text-gray-600">
            Créer une nouvelle demande de matériel ou service
            {user?.role === "mg" && (
              <span className="block text-sm text-red-600 mt-1">
                En tant que MG, votre demande sera automatiquement validée
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Formulaire */}
      <div className="bg-white shadow-sm rounded-lg">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Description du produit/service */}
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              {/* <Package className="w-4 h-4 mr-2" /> */}
              Description du produit/service *
            </label>
            <textarea
              name="item_description"
              value={formData.item_description}
              onChange={handleChange}
              placeholder="Décrivez le produit ou service à acheter (marque, modèle, caractéristiques...)"
              rows={4}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 ${
                errors.item_description ? "border-red-300" : "border-gray-300"
              }`}
            />
            {errors.item_description && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.item_description}
              </p>
            )}
          </div>

          <div
            className={`grid gap-6 ${
              user?.role === "mg" ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"
            }`}
          >
            {/* Quantité */}
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                Quantité *
              </label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                min="1"
                placeholder="Ex: 5"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 ${
                  errors.quantity ? "border-red-300" : "border-gray-300"
                }`}
              />
              {errors.quantity && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.quantity}
                </p>
              )}
            </div>

            {/* Coût estimé - affiché seulement si le rôle est "mg" */}
            {user?.role === "mg" && (
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  Coût estimé (FCFA) *
                </label>
                <input
                  type="number"
                  name="estimated_cost"
                  value={formData.estimated_cost}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  placeholder="Ex: 50000"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 ${
                    errors.estimated_cost ? "border-red-300" : "border-gray-300"
                  }`}
                />
                {errors.estimated_cost && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.estimated_cost}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Urgence */}
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              {/* <Clock className="w-4 h-4 mr-2" /> */}
              Niveau d'urgence *
            </label>
            <select
              name="urgency"
              value={formData.urgency}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              {urgencyOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {/* Indicateur visuel du niveau d'urgence */}
            <div className="mt-2 flex items-center">
              <div
                className="w-3 h-3 rounded-full mr-2"
                style={{
                  backgroundColor:
                    formData.urgency === "low"
                      ? "#10b981"
                      : formData.urgency === "medium"
                      ? "#f59e0b"
                      : formData.urgency === "high"
                      ? "#f97316"
                      : "#ef4444",
                }}
              ></div>
              <span
                className={`text-sm ${
                  urgencyOptions.find((opt) => opt.value === formData.urgency)
                    ?.color || "text-gray-600"
                }`}
              >
                Niveau:{" "}
                {
                  urgencyOptions.find((opt) => opt.value === formData.urgency)
                    ?.label
                }
              </span>
            </div>
          </div>

          {/* Justification */}
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              {/* <MessageSquare className="w-4 h-4 mr-2" /> */}
              Justification de la demande *
            </label>
            <textarea
              name="justification"
              value={formData.justification}
              onChange={handleChange}
              placeholder="Expliquez pourquoi cet achat est nécessaire, son impact sur votre travail, etc."
              rows={4}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 ${
                errors.justification ? "border-red-300" : "border-gray-300"
              }`}
            />
            {errors.justification && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.justification}
              </p>
            )}
          </div>

          {/* Section pièces jointes pour MG uniquement */}
          {showAttachmentsSection && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Upload className="w-5 h-5 mr-2" />
                Pièces jointes (optionnel)
              </h3>

              {/* Utilisation du composant AttachmentsManager en mode création */}
              <AttachmentsManager
                requestId={null}
                initialAttachments={[]}
                canUpload={true}
                canDelete={true}
                isInValidationMode={true}
                pendingFiles={pendingFiles}
                onFilesChange={handleFilesChange}
                requestStatus="creating"
                requestUserId={user?.id}
              />
            </div>
          )}

          {/* Note d'information */}
          <div
            className={`border rounded-md p-4 ${
              user?.role === "mg"
                ? "bg-green-50 border-green-200"
                : "bg-blue-50 border-blue-200"
            }`}
          >
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle
                  className={`h-5 w-5 ${
                    user?.role === "mg" ? "text-green-400" : "text-blue-400"
                  }`}
                />
              </div>
              <div className="ml-3">
                <h3
                  className={`text-sm font-medium ${
                    user?.role === "mg" ? "text-green-800" : "text-blue-800"
                  }`}
                >
                  Processus de validation
                </h3>
                <div
                  className={`mt-2 text-sm ${
                    user?.role === "mg" ? "text-green-700" : "text-blue-700"
                  }`}
                >
                  {user?.role === "mg" ? (
                    <>
                      <p>
                        En tant que Moyen Généraux, votre demande suivra ce
                        processus :
                      </p>
                      <ol className="list-decimal list-inside mt-1 space-y-1">
                        <li>
                          Validation MG : <strong>Automatique</strong>
                        </li>
                        <li>Étude budgétaire par la Comptabilité</li>
                        <li>Approbation finale par la Direction</li>
                      </ol>
                      {pendingFiles.length > 0 && (
                        <p className="mt-2 text-sm font-medium text-green-600">
                          {pendingFiles.length} fichier(s) sera/ont ajouté(s)
                          automatiquement.
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      <p>Votre demande suivra ce processus de validation :</p>
                      <ol className="list-decimal list-inside mt-1 space-y-1">
                        <li>Validation par les Moyens Généraux</li>
                        <li>Étude budgétaire par la Comptabilité</li>
                        <li>Approbation finale par la Direction</li>
                      </ol>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="flex flex-col sm:flex-row sm:justify-end sm:space-x-4 space-y-3 sm:space-y-0 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isLoading}
              className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 cursor-pointer"
            >
              Annuler
            </button>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-auto px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 flex items-center justify-center cursor-pointer"
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Création en cours...
                </>
              ) : user?.role === "mg" ? (
                pendingFiles.length > 0 ? (
                  "Créer, valider et ajouter les fichiers"
                ) : (
                  "Créer et valider la demande"
                )
              ) : (
                "Créer la demande"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateRequest;
