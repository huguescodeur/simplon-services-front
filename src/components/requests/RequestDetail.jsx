import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { requestsAPI, attachmentsAPI } from "../../services/apis";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Edit,
} from "lucide-react";
import { toast } from "react-toastify";
import RequestTimeline from "./RequestTimeline";
import AttachmentsManager from "./AttachmentsManager";

const RequestDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showEditRejectModal, setShowEditRejectModal] = useState(false);
  const [editRejectReason, setEditRejectReason] = useState("");

  // Nouveaux états pour la validation comptabilité
  const [showAccountingModal, setShowAccountingModal] = useState(false);
  const [budgetAvailable, setBudgetAvailable] = useState(null);
  const [finalCost, setFinalCost] = useState("");
  const [accountingComment, setAccountingComment] = useState("");

  // NOUVEAU: État pour gérer les fichiers en attente lors de la validation MG
  const [pendingValidationFiles, setPendingValidationFiles] = useState([]);

  useEffect(() => {
    fetchRequestDetail();
  }, [id]);

  // console.log("Request Infos:", request);

  const fetchRequestDetail = async () => {
    try {
      setLoading(true);
      const response = await requestsAPI.getRequest(id);
      setRequest(response.data);
    } catch (error) {
      toast.error("Erreur lors du chargement de la demande");
      // console.error("Request detail error:", error);
    } finally {
      setLoading(false);
    }
  };

  const canValidate = () => {
    if (!request) return false;
    if (user?.role === "mg" && request.status === "pending") return true;
    if (user?.role === "accounting" && request.status === "mg_approved")
      return true;
    if (user?.role === "director" && request.status === "accounting_reviewed")
      return true;
    return false;
  };

  const canEditRejection = () => {
    if (!request || request.status !== "rejected") return false;
    // Seule la personne qui a refusé peut modifier
    if (user?.role === "mg" && request.rejected_by_role === "mg") return true;
    if (
      user?.role === "accounting" &&
      request.rejected_by_role === "accounting"
    )
      return true;
    if (user?.role === "director" && request.rejected_by_role === "director")
      return true;
    return false;
  };

  // NOUVELLE FONCTION: Gérer les fichiers en attente lors de la validation MG
  const handlePendingFilesChange = (files) => {
    setPendingValidationFiles(files);
  };

  // const handleValidation = async (action) => {
  //   if (action === "reject") {
  //     setShowRejectModal(true);
  //     return;
  //   }

  //   // Si c'est la comptabilité qui valide, on a besoin d'infos supplémentaires
  //   if (user?.role === "accounting" && action === "approve") {
  //     setShowAccountingModal(true);
  //     return;
  //   }

  //   try {
  //     // MODIFICATION: Si c'est le MG qui valide et qu'il y a des fichiers en attente
  //     let validationData = { action };

  //     if (user?.role === "mg" && pendingValidationFiles.length > 0) {
  //       // Préparer les fichiers pour l'upload
  //       const filesToUpload = pendingValidationFiles.map((pendingFile) => {
  //         console.log("Processing pending file for validation:", {
  //           name: pendingFile.name,
  //           size: pendingFile.size,
  //           type: pendingFile.type,
  //           fileInstance: pendingFile.file instanceof File,
  //         });

  //         return {
  //           file: pendingFile.file,
  //           description: pendingFile.description || pendingFile.name,
  //           file_type: "other",
  //         };
  //       });

  //       validationData.files = filesToUpload;

  //       // Informer l'utilisateur que des fichiers vont être uploadés
  //       toast.info(
  //         `Validation en cours... Upload de ${filesToUpload.length} fichier(s)`
  //       );
  //     }

  //     await requestsAPI.validateRequest(id, validationData);
  //     toast.success("Demande validée avec succès");

  //     // Réinitialiser les fichiers en attente
  //     setPendingValidationFiles([]);

  //     fetchRequestDetail();
  //   } catch (error) {
  //     toast.error("Erreur lors de la validation");
  //     console.error("Validation error:", error);
  //   }
  // };

  const handleValidation = async (action) => {
    if (action === "reject") {
      setShowRejectModal(true);
      return;
    }

    // Si c'est la comptabilité qui valide, on a besoin d'infos supplémentaires
    if (user?.role === "accounting" && action === "approve") {
      setShowAccountingModal(true);
      return;
    }

    try {
      // MODIFICATION: Séparer la validation et l'upload des fichiers comme dans CreateRequest
      let validationData = { action };

      // D'abord, valider la demande
      await requestsAPI.validateRequest(id, validationData);

      // PUIS, si c'est le MG qui valide et qu'il y a des fichiers en attente, les uploader séparément
      if (user?.role === "mg" && pendingValidationFiles.length > 0) {
        toast.info(
          `Validation réussie. Upload de ${pendingValidationFiles.length} fichier(s) en cours...`
        );

        try {
          // Upload chaque fichier individuellement comme dans CreateRequest
          const uploadResults = await Promise.allSettled(
            pendingValidationFiles.map(async (pendingFile) => {
              if (!pendingFile.file) {
                throw new Error(
                  `Fichier manquant pour ${
                    pendingFile.name || "fichier inconnu"
                  }`
                );
              }

              console.log("Uploading file during validation:", {
                name: pendingFile.file.name || pendingFile.name,
                size: pendingFile.file.size,
                type: pendingFile.file.type,
              });

              // Utiliser la même méthode que CreateRequest
              return await attachmentsAPI.uploadAttachment({
                request: parseInt(id), // S'assurer que c'est un number
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
              `Demande validée avec succès. ${successfulUploads.length} fichier(s) ajouté(s), ${failedUploads.length} échec(s)`
            );
          } else {
            toast.success(
              "Demande validée et tous les fichiers ajoutés avec succès !"
            );
          }
        } catch (uploadError) {
          // console.error("Erreur upload fichiers:", uploadError);
          toast.warning(
            "Demande validée mais erreur lors de l'upload de certains fichiers"
          );
        }
      } else {
        toast.success("Demande validée avec succès");
      }

      // Réinitialiser les fichiers en attente
      setPendingValidationFiles([]);

      // Recharger les détails de la demande
      fetchRequestDetail();
    } catch (error) {
      toast.error("Erreur lors de la validation");
      // console.error("Validation error:", error);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error("Veuillez saisir un motif de refus");
      return;
    }

    try {
      await requestsAPI.validateRequest(id, {
        action: "reject",
        comment: rejectReason,
      });
      toast.success("Demande refusée avec succès");
      setShowRejectModal(false);
      setRejectReason("");
      fetchRequestDetail();
    } catch (error) {
      toast.error("Erreur lors du refus");
      // console.error("Validation error:", error);
    }
  };

  const handleAccountingValidation = async () => {
    if (budgetAvailable === null) {
      toast.error("Veuillez indiquer si le budget est disponible");
      return;
    }

    try {
      const data = {
        action: "approve",
        budget_available: budgetAvailable,
        comment: accountingComment.trim(),
      };

      if (finalCost.trim()) {
        data.final_cost = parseFloat(finalCost);
      }

      await requestsAPI.validateRequest(id, data);
      toast.success("Demande validée avec succès");
      setShowAccountingModal(false);
      setBudgetAvailable(null);
      setFinalCost("");
      setAccountingComment("");
      fetchRequestDetail();
    } catch (error) {
      toast.error("Erreur lors de la validation");
      // console.error("Validation error:", error);
    }
  };

  const handleEditRejection = () => {
    setEditRejectReason(request.rejection_reason || "");
    setShowEditRejectModal(true);
  };

  const handleUpdateRejection = async () => {
    if (!editRejectReason.trim()) {
      toast.error("Veuillez saisir un motif de refus");
      return;
    }

    try {
      await requestsAPI.updateRejectionReason(id, {
        comment: editRejectReason,
      });
      toast.success("Motif de refus mis à jour");
      setShowEditRejectModal(false);
      fetchRequestDetail();
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
      // console.error("Update rejection error:", error);
    }
  };

  // NOUVELLE FONCTION: Déterminer les permissions d'accès aux fichiers
  const getAttachmentPermissions = () => {
    if (!request) return { canUpload: false, canDelete: false };

    // Le créateur peut toujours gérer ses fichiers (sauf si approuvée/rejetée)
    if (
      request.user_id === user?.id &&
      !["rejected", "director_approved"].includes(request.status)
    ) {
      return { canUpload: true, canDelete: true };
    }

    // Le MG peut gérer les fichiers lors de la validation
    if (user?.role === "mg" && request.status === "pending") {
      return { canUpload: true, canDelete: true };
    }

    // Les autres rôles (comptabilité, direction) peuvent seulement consulter
    if (["accounting", "director"].includes(user?.role) && canValidate()) {
      return { canUpload: false, canDelete: false };
    }

    return { canUpload: false, canDelete: false };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">
          Demande introuvable
        </h3>
        <p className="text-gray-500 mt-1">
          Cette demande n'existe pas ou vous n'avez pas les droits pour la
          consulter.
        </p>
        <Link
          to="/requests"
          className="mt-4 inline-flex items-center text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux demandes
        </Link>
      </div>
    );
  }

  const attachmentPermissions = getAttachmentPermissions();

  return (
    <div className="space-y-6">
      {/* Header avec bouton retour */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate("/requests")}
            className="inline-flex items-center text-gray-600 hover:text-gray-900 cursor-pointer"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Retour aux demandes
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            Demande #{request.id}
          </h1>
        </div>
      </div>

      {/* Affichage du motif de refus - PLACÉ ICI EN PREMIER */}
      {request.status === "rejected" && request.rejection_reason && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-red-800">
                Demande refusée
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p className="font-medium">Motif du refus :</p>
                <p className="mt-1">{request.rejection_reason}</p>
              </div>
              {request.rejected_by && (
                <p className="mt-2 text-xs text-red-600">
                  Refusé par : {request.rejected_by_name} le{" "}
                  {new Date(request.rejected_at).toLocaleDateString("fr-FR")}
                </p>
              )}
              {canEditRejection() && (
                <button
                  onClick={handleEditRejection}
                  className="mt-2 inline-flex items-center px-3 py-1 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier le motif de refus
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Actions selon le statut */}
      {canValidate() && (
        <div className="flex space-x-3">
          <button
            onClick={() => handleValidation("reject")}
            className="inline-flex items-center px-4 py-2 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 cursor-pointer"
          >
            <XCircle className="h-4 w-4 mr-2" />
            Refuser
          </button>
          <button
            onClick={() => handleValidation("approve")}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700 cursor-pointer"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            {user?.role === "accounting"
              ? "Valider (vérification budgétaire)"
              : "Valider"}
          </button>
        </div>
      )}

      {/* Contenu principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Détails de la demande */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informations principales */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Détails de la demande
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <p className="text-sm text-gray-900">
                  {request.item_description}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Coût estimé
                </label>
                <p className="text-sm text-gray-900 font-semibold">
                  {new Intl.NumberFormat("fr-FR", {
                    style: "currency",
                    currency: "XOF",
                  }).format(request.estimated_cost)}
                </p>
              </div>

              {/* Afficher le coût final si disponible */}
              {request.final_cost && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Coût final validé
                  </label>
                  <p className="text-sm text-gray-900 font-semibold text-green-600">
                    {new Intl.NumberFormat("fr-FR", {
                      style: "currency",
                      currency: "XOF",
                    }).format(request.final_cost)}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Demandeur
                </label>
                <p className="text-sm text-gray-900">{request.user_name}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date de création
                </label>
                <p className="text-sm text-gray-900">
                  {new Date(request.created_at).toLocaleDateString("fr-FR", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>

              {/* Afficher le statut budgétaire si disponible */}
              {request.budget_available !== null && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Budget disponible
                  </label>
                  <p
                    className={`text-sm font-medium  ${
                      request.budget_available
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {request.budget_available ? "Oui " : "Non"}
                  </p>
                </div>
              )}
            </div>

            {request.justification && (
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Justification
                </label>
                <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
                  {request.justification}
                </p>
              </div>
            )}
          </div>

          {/* Timeline de progression */}
          <RequestTimeline request={request} />

          {/* Pièces jointes avec permissions contrôlées */}
          <AttachmentsManager
            requestId={request.id}
            initialAttachments={request.attachments || []}
            canUpload={attachmentPermissions.canUpload}
            canDelete={attachmentPermissions.canDelete}
            isInValidationMode={
              user?.role === "mg" && request.status === "pending"
            }
            pendingFiles={pendingValidationFiles}
            onFilesChange={handlePendingFilesChange}
            requestStatus={request.status}
            requestUserId={request.user_id}
          />
        </div>

        {/* Sidebar avec actions */}
        <div className="space-y-6">
          {/* Statut actuel */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Statut actuel
            </h3>

            <div className="text-center">
              {request.status === "pending" && (
                <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                  <Clock className="h-4 w-4 mr-2" />
                  En attente de validation MG
                </div>
              )}
              {request.status === "mg_approved" && (
                <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  <Clock className="h-4 w-4 mr-2" />
                  En attente de validation Compta
                </div>
              )}
              {request.status === "accounting_reviewed" && (
                <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                  <Clock className="h-4 w-4 mr-2" />
                  En attente d'approbation Direction
                </div>
              )}
              {request.status === "director_approved" && (
                <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approuvé
                </div>
              )}
              {request.status === "rejected" && (
                <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-red-100 text-red-800">
                  <XCircle className="h-4 w-4 mr-2" />
                  Refusé
                </div>
              )}
            </div>
          </div>

          {/* Actions rapides */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Actions
            </h3>

            <div className="space-y-3">
              <Link
                to="/requests"
                className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <FileText className="h-4 w-4 mr-2" />
                Voir toutes les demandes
              </Link>

              {user?.role === "employee" && (
                <Link
                  to="/requests/create"
                  className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  Nouvelle demande
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de refus */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Motif de refus
                </h3>
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Veuillez préciser le motif du refus *
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={4}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Expliquez pourquoi cette demande est refusée..."
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer "
                >
                  Annuler
                </button>
                <button
                  onClick={handleReject}
                  className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 cursor-pointer"
                >
                  Confirmer le refus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de validation comptabilité */}
      {showAccountingModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Vérification budgétaire
                </h3>
                <button
                  onClick={() => setShowAccountingModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-5 w-5 cursor-pointer" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Budget disponible */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Le budget est-il disponible ? *
                  </label>
                  <div className="space-y-2">
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        className="form-radio "
                        name="budget_available"
                        value="true"
                        checked={budgetAvailable === true}
                        onChange={() => setBudgetAvailable(true)}
                      />
                      <span className="ml-2 pr-4 text-sm text-gray-700">
                        Oui
                      </span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        className="form-radio"
                        name="budget_available"
                        value="false"
                        checked={budgetAvailable === false}
                        onChange={() => setBudgetAvailable(false)}
                      />
                      <span className="ml-2 text-sm text-gray-700">Non</span>
                    </label>
                  </div>
                </div>

                {/* Coût final */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Coût final (optionnel)
                  </label>
                  <input
                    type="number"
                    step="100"
                    min="0"
                    value={finalCost}
                    onChange={(e) => setFinalCost(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Coût final si différent de l'estimation"
                  />
                </div>

                {/* Commentaire */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Commentaire (optionnel)
                  </label>
                  <textarea
                    value={accountingComment}
                    onChange={(e) => setAccountingComment(e.target.value)}
                    rows={3}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Remarques sur la vérification budgétaire..."
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowAccountingModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  onClick={handleAccountingValidation}
                  className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700 cursor-pointer"
                >
                  Valider
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de modification du motif de refus */}
      {showEditRejectModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Modifier le motif de refus
                </h3>
                <button
                  onClick={() => setShowEditRejectModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Motif du refus *
                </label>
                <textarea
                  value={editRejectReason}
                  onChange={(e) => setEditRejectReason(e.target.value)}
                  rows={4}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Modifiez le motif du refus..."
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowEditRejectModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  onClick={handleUpdateRejection}
                  className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-orange-600 hover:bg-orange-700"
                >
                  Mettre à jour
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestDetail;
