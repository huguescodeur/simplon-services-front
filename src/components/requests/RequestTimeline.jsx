import React from "react";
import { CheckCircle, Clock, XCircle, User, Calendar } from "lucide-react";

const RequestTimeline = ({ request }) => {
  // Définir les étapes du workflow avec leurs conditions
  const getTimelineSteps = () => {
    const steps = [
      {
        id: "creation",
        title: "Demande créée",
        description: `Par ${request.user_name}`,
        status: "completed",
        date: request.created_at,
        user: request.user_name,
        role: "Employé",
      },
      {
        id: "mg_validation",
        title: "Validation Moyens Généraux",
        description: "Vérification de la demande",
        status: getMGStatus(),
        date: getMGDate(),
        user: getMGUser(),
        role: "Moyens Généraux",
      },
      {
        id: "accounting_validation",
        title: "Validation Comptabilité",
        description: "Vérification budgétaire",
        status: getAccountingStatus(),
        date: getAccountingDate(),
        user: getAccountingUser(),
        role: "Comptabilité",
      },
      {
        id: "director_validation",
        title: "Approbation Direction",
        description: "Approbation finale",
        status: getDirectorStatus(),
        date: getDirectorDate(),
        user: getDirectorUser(),
        role: "Direction",
      },
    ];

    return steps;
  };

  // Fonctions pour déterminer le statut de chaque étape
  function getMGStatus() {
    if (request.status === "rejected" && request.rejected_by_role === "mg") {
      return "rejected";
    }
    if (
      ["mg_approved", "accounting_reviewed", "director_approved"].includes(
        request.status
      )
    ) {
      return "completed";
    }
    if (request.status === "pending") {
      return "current";
    }
    return "pending";
  }

  function getAccountingStatus() {
    if (
      request.status === "rejected" &&
      request.rejected_by_role === "accounting"
    ) {
      return "rejected";
    }
    if (["accounting_reviewed", "director_approved"].includes(request.status)) {
      return "completed";
    }
    if (request.status === "mg_approved") {
      return "current";
    }
    return "pending";
  }

  function getDirectorStatus() {
    if (
      request.status === "rejected" &&
      request.rejected_by_role === "director"
    ) {
      return "rejected";
    }
    if (request.status === "director_approved") {
      return "completed";
    }
    if (request.status === "accounting_reviewed") {
      return "current";
    }
    return "pending";
  }

  // Fonctions pour récupérer les dates et utilisateurs depuis les steps
  function getMGDate() {
    const step = request.steps?.find(
      (s) => s.user_role === "Moyens Généraux" || s.user_role === "MG"
    );
    return step?.created_at;
  }

  function getAccountingDate() {
    const step = request.steps?.find(
      (s) => s.user_role === "Comptabilité" || s.user_role === "Accounting"
    );
    return step?.created_at;
  }

  function getDirectorDate() {
    const step = request.steps?.find(
      (s) => s.user_role === "Direction" || s.user_role === "Director"
    );
    return step?.created_at;
  }

  function getMGUser() {
    const step = request.steps?.find(
      (s) => s.user_role === "Moyens Généraux" || s.user_role === "MG"
    );
    return step?.user_name;
  }

  function getAccountingUser() {
    const step = request.steps?.find(
      (s) => s.user_role === "Comptabilité" || s.user_role === "Accounting"
    );
    return step?.user_name;
  }

  function getDirectorUser() {
    const step = request.steps?.find(
      (s) => s.user_role === "Direction" || s.user_role === "Director"
    );
    return step?.user_name;
  }

  // Configuration visuelle pour chaque statut
  const getStepConfig = (status) => {
    switch (status) {
      case "completed":
        return {
          icon: CheckCircle,
          iconClass: "text-green-600",
          bgClass: "bg-green-100",
          borderClass: "border-green-600",
          lineClass: "bg-green-600",
        };
      case "current":
        return {
          icon: Clock,
          iconClass: "text-blue-600",
          bgClass: "bg-blue-100",
          borderClass: "border-blue-600",
          lineClass: "bg-gray-300",
        };
      case "rejected":
        return {
          icon: XCircle,
          iconClass: "text-red-600",
          bgClass: "bg-red-100",
          borderClass: "border-red-600",
          lineClass: "bg-red-600",
        };
      default: // pending
        return {
          icon: Clock,
          iconClass: "text-gray-400",
          bgClass: "bg-gray-100",
          borderClass: "border-gray-300",
          lineClass: "bg-gray-300",
        };
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const steps = getTimelineSteps();

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">
        Suivi de la demande
      </h3>

      <div className="flow-root">
        <ul className="-mb-8">
          {steps.map((step, stepIdx) => {
            const config = getStepConfig(step.status);
            const Icon = config.icon;

            return (
              <li key={step.id}>
                <div className="relative pb-8">
                  {stepIdx !== steps.length - 1 && (
                    <span
                      className={`absolute top-4 left-4 -ml-px h-full w-0.5 ${config.lineClass}`}
                      aria-hidden="true"
                    />
                  )}
                  <div className="relative flex space-x-3">
                    <div>
                      <span
                        className={`h-8 w-8 rounded-full ${config.bgClass} border-2 ${config.borderClass} flex items-center justify-center ring-8 ring-white`}
                      >
                        <Icon
                          className={`h-4 w-4 ${config.iconClass}`}
                          aria-hidden="true"
                        />
                      </span>
                    </div>
                    <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {step.title}
                          {step.status === "current" && (
                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              En cours
                            </span>
                          )}
                          {step.status === "rejected" && (
                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Refusé
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-gray-500">
                          {step.description}
                        </p>
                        {step.user && step.status !== "pending" && (
                          <div className="mt-1 flex items-center text-xs text-gray-400">
                            <User className="h-3 w-3 mr-1" />
                            {step.user} ({step.role})
                          </div>
                        )}
                      </div>
                      <div className="text-right text-xs text-gray-500">
                        {step.date && (
                          <div className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            <time dateTime={step.date}>
                              {formatDate(step.date)}
                            </time>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Affichage des informations supplémentaires si disponibles */}
      {request.budget_available !== null && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-2">
            Informations comptables
          </h4>
          <div className="text-sm text-gray-600">
            <p>
              Budget disponible :
              <span
                className={`ml-1 font-medium ${
                  request.budget_available ? "text-green-600" : "text-red-600"
                }`}
              >
                {request.budget_available ? "Oui" : "Non"}
              </span>
            </p>
            {request.final_cost && (
              <p className="mt-1">
                Coût final validé :
                <span className="ml-1 font-medium text-gray-900">
                  {new Intl.NumberFormat("fr-FR", {
                    style: "currency",
                    currency: "XOF",
                  }).format(request.final_cost)}
                </span>
              </p>
            )}
          </div>
        </div>
      )}

      {/* Affichage des commentaires des steps */}
      {request.steps && request.steps.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            Commentaires
          </h4>
          <div className="space-y-3">
            {request.steps
              .filter((step) => step.comment && step.comment.trim())
              .map((step, index) => (
                <div key={index} className="bg-gray-50 rounded-md p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-900">
                      {step.user_name} ({step.user_role})
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDate(step.created_at)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{step.comment}</p>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestTimeline;
