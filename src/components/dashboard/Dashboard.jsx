import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { dashboardAPI } from "../../services/apis";
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Calendar,
  RefreshCw,
  User,
  Eye,
} from "lucide-react";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await dashboardAPI.getDashboard();
      console.log("Dashboard response:", response.data);
      setDashboardData(response.data);
    } catch (error) {
      toast.error("Erreur lors du chargement du dashboard");
      // console.error("Dashboard error:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleTitle = (role) => {
    const titles = {
      employee: "Tableau de bord - Employé",
      mg: "Tableau de bord - Moyens Généraux",
      accounting: "Tableau de bord - Comptabilité",
      director: "Tableau de bord - Direction",
    };
    return titles[role] || "Tableau de bord";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Statistiques spécifiques à l'employé (5 KPIs)
  const getEmployeeStats = () => {
    if (!dashboardData) return [];

    return [
      {
        name: "Mes demandes",
        value: dashboardData?.total_requests || 0,
        icon: FileText,
        color: "blue",
        description: "Total de mes demandes",
      },
      {
        name: "En attente",
        value: dashboardData?.pending_requests || 0,
        icon: Clock,
        color: "yellow",
        description: "En attente de validation MG",
      },
      {
        name: "En cours",
        value: dashboardData?.in_progress_requests || 0,
        icon: RefreshCw,
        color: "orange",
        description: "En cours de traitement",
      },
      {
        name: "Approuvées",
        value: dashboardData?.approved_requests || 0,
        icon: CheckCircle,
        color: "green",
        description: "Demandes validées",
      },
      {
        name: "Refusées",
        value: dashboardData?.rejected_requests || 0,
        icon: XCircle,
        color: "red",
        description: "Demandes rejetées",
      },
    ];
  };

  // Stats pour MG (4 KPIs spécifiques - comme comptabilité et direction)
  const getMGStats = () => {
    return [
      {
        name: "Mes demandes",
        value: dashboardData?.mes_demandes || 0,
        icon: FileText,
        color: "blue",
        description: "Demandes arrivées à mon niveau",
      },
      {
        name: "En cours",
        value: dashboardData?.en_cours || 0,
        icon: RefreshCw,
        color: "orange",
        description: "À traiter par moi",
      },
      {
        name: "Acceptées",
        value: dashboardData?.acceptees || 0,
        icon: CheckCircle,
        color: "green",
        description: "Que j'ai validées",
      },
      {
        name: "Refusées",
        value: dashboardData?.refusees || 0,
        icon: XCircle,
        color: "red",
        description: "Que j'ai refusées",
      },
    ];
  };

  // Stats pour Comptabilité (4 KPIs - niveau de responsabilité)
  const getAccountingStats = () => {
    return [
      {
        name: "Mes demandes",
        value: dashboardData?.mes_demandes || 0,
        icon: FileText,
        color: "blue",
        description: "Demandes arrivées à mon niveau",
      },
      {
        name: "En cours",
        value: dashboardData?.en_cours || 0,
        icon: RefreshCw,
        color: "orange",
        description: "À valider par moi",
      },
      {
        name: "Acceptées",
        value: dashboardData?.acceptees || 0,
        icon: CheckCircle,
        color: "green",
        description: "Que j'ai acceptées",
      },
      {
        name: "Refusées",
        value: dashboardData?.refusees || 0,
        icon: XCircle,
        color: "red",
        description: "Que j'ai refusées",
      },
    ];
  };

  // Stats pour Direction (4 KPIs - niveau de responsabilité)
  const getDirectorStats = () => {
    return [
      {
        name: "Mes demandes",
        value: dashboardData?.mes_demandes || 0,
        icon: FileText,
        color: "blue",
        description: "Demandes arrivées à mon niveau",
      },
      {
        name: "En cours",
        value: dashboardData?.en_cours || 0,
        icon: RefreshCw,
        color: "orange",
        description: "À approuver par moi",
      },
      {
        name: "Acceptées",
        value: dashboardData?.acceptees || 0,
        icon: CheckCircle,
        color: "green",
        description: "Que j'ai approuvées",
      },
      {
        name: "Refusées",
        value: dashboardData?.refusees || 0,
        icon: XCircle,
        color: "red",
        description: "Que j'ai refusées",
      },
    ];
  };

  const stats =
    user?.role === "employee"
      ? getEmployeeStats()
      : user?.role === "mg"
      ? getMGStats()
      : user?.role === "accounting"
      ? getAccountingStats()
      : user?.role === "director"
      ? getDirectorStats()
      : [];

  const getColorClasses = (color) => {
    const colors = {
      blue: "bg-blue-500 text-white",
      yellow: "bg-yellow-500 text-white",
      orange: "bg-orange-500 text-white",
      green: "bg-green-500 text-white",
      red: "bg-red-500 text-white",
    };
    return colors[color] || "bg-gray-500 text-white";
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { class: "bg-yellow-100 text-yellow-800", text: "En attente" },
      mg_approved: { class: "bg-blue-100 text-blue-800", text: "Validée MG" },
      mg_validated: { class: "bg-blue-100 text-blue-800", text: "Validée MG" },
      accounting_reviewed: {
        class: "bg-purple-100 text-purple-800",
        text: "Validée Compta",
      },
      director_approved: {
        class: "bg-green-100 text-green-800",
        text: "Approuvée",
      },
      rejected: { class: "bg-red-100 text-red-800", text: "Refusée" },
    };
    return (
      statusConfig[status] || {
        class: "bg-gray-100 text-gray-800",
        text: status,
      }
    );
  };

  // Actions rapides pour MG
  const getMGActions = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Link
        to="/requests/create"
        className="p-6 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
      >
        <div className="flex items-center">
          <div className="p-3 rounded-lg bg-blue-100 group-hover:bg-blue-200 transition-colors">
            <FileText className="h-8 w-8 text-blue-600" />
          </div>
          <div className="ml-4">
            <p className="font-medium text-gray-900">Nouvelle demande</p>
            <p className="text-sm text-gray-500">Créer une demande</p>
          </div>
        </div>
      </Link>

      <Link
        to="/validations"
        className="p-6 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
      >
        <div className="flex items-center">
          <div className="p-3 rounded-lg bg-orange-100 group-hover:bg-orange-200 transition-colors">
            <CheckCircle className="h-8 w-8 text-orange-600" />
          </div>
          <div className="ml-4">
            <p className="font-medium text-gray-900">Validations</p>
            <p className="text-sm text-gray-500">Demandes à valider</p>
          </div>
        </div>
      </Link>

      <Link
        to="/requests"
        className="p-6 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
      >
        <div className="flex items-center">
          <div className="p-3 rounded-lg bg-green-100 group-hover:bg-green-200 transition-colors">
            <Clock className="h-8 w-8 text-green-600" />
          </div>
          <div className="ml-4">
            <p className="font-medium text-gray-900">Toutes les demandes</p>
            <p className="text-sm text-gray-500">Gérer les demandes</p>
          </div>
        </div>
      </Link>
    </div>
  );

  // Actions rapides pour Comptabilité
  const getAccountingActions = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Link
        to="/validations"
        className="p-6 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
      >
        <div className="flex items-center">
          <div className="p-3 rounded-lg bg-orange-100 group-hover:bg-orange-200 transition-colors">
            <CheckCircle className="h-8 w-8 text-orange-600" />
          </div>
          <div className="ml-4">
            <p className="font-medium text-gray-900">Validations</p>
            <p className="text-sm text-gray-500">Demandes à valider</p>
          </div>
        </div>
      </Link>

      <Link
        to="/requests"
        className="p-6 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
      >
        <div className="flex items-center">
          <div className="p-3 rounded-lg bg-blue-100 group-hover:bg-blue-200 transition-colors">
            <FileText className="h-8 w-8 text-blue-600" />
          </div>
          <div className="ml-4">
            <p className="font-medium text-gray-900">Mes demandes</p>
            <p className="text-sm text-gray-500">Demandes de mon niveau</p>
          </div>
        </div>
      </Link>
    </div>
  );

  // Actions rapides pour Direction
  const getDirectorActions = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Link
        to="/validations"
        className="p-6 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
      >
        <div className="flex items-center">
          <div className="p-3 rounded-lg bg-red-100 group-hover:bg-red-200 transition-colors">
            <CheckCircle className="h-8 w-8 text-red-600" />
          </div>
          <div className="ml-4">
            <p className="font-medium text-gray-900">Approbations</p>
            <p className="text-sm text-gray-500">Demandes à approuver</p>
          </div>
        </div>
      </Link>

      <Link
        to="/requests"
        className="p-6 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
      >
        <div className="flex items-center">
          <div className="p-3 rounded-lg bg-blue-100 group-hover:bg-blue-200 transition-colors">
            <FileText className="h-8 w-8 text-blue-600" />
          </div>
          <div className="ml-4">
            <p className="font-medium text-gray-900">Mes demandes</p>
            <p className="text-sm text-gray-500">Demandes de mon niveau</p>
          </div>
        </div>
      </Link>
    </div>
  );

  // Actions rapides pour Employé
  const getEmployeeActions = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Link
        to="/requests/create"
        className="p-6 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
      >
        <div className="flex items-center">
          <div className="p-3 rounded-lg bg-blue-100 group-hover:bg-blue-200 transition-colors">
            <FileText className="h-8 w-8 text-blue-600" />
          </div>
          <div className="ml-4">
            <p className="font-medium text-gray-900">Nouvelle demande</p>
            <p className="text-sm text-gray-500">Créer une demande</p>
          </div>
        </div>
      </Link>

      <Link
        to="/requests"
        className="p-6 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
      >
        <div className="flex items-center">
          <div className="p-3 rounded-lg bg-green-100 group-hover:bg-green-200 transition-colors">
            <Clock className="h-8 w-8 text-green-600" />
          </div>
          <div className="ml-4">
            <p className="font-medium text-gray-900">Mes demandes</p>
            <p className="text-sm text-gray-500">Voir mes demandes</p>
          </div>
        </div>
      </Link>
    </div>
  );

  // Conseils pour Employé
  const getEmployeeTips = () => (
    <div className="bg-blue-50 rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
        <AlertTriangle className="h-5 w-5 mr-2" />
        Conseils pour vos demandes
      </h3>
      <div className="space-y-3 text-sm text-blue-800">
        <div className="flex items-start">
          <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-blue-600" />
          <span>Décrivez précisément l'objet de votre demande</span>
        </div>
        <div className="flex items-start">
          <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-blue-600" />
          <span>Joignez tous les documents justificatifs</span>
        </div>
        <div className="flex items-start">
          <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-blue-600" />
          <span>Vérifiez les montants avant soumission</span>
        </div>
        <div className="flex items-start">
          <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-blue-600" />
          <span>Suivez l'état de vos demandes régulièrement</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {getRoleTitle(user?.role)}
            </h1>
            <p className="text-gray-600 mt-1">
              Bienvenue, {user?.first_name || user?.username}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Dernière mise à jour</p>
            <p className="text-sm font-medium text-gray-900">
              {new Date().toLocaleDateString("fr-FR", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div
        className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${
          user?.role === "employee" ? "5" : "4"
        } gap-6`}
      >
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.name}
              className="bg-white rounded-lg shadow overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center">
                  <div
                    className={`p-3 rounded-lg ${getColorClasses(stat.color)}`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="ml-4 flex-1">
                    <p className="text-sm font-medium text-gray-600">
                      {stat.name}
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stat.value}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {stat.description}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Actions rapides selon le rôle */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Actions rapides
        </h3>

        {user?.role === "employee" ? (
          getEmployeeActions()
        ) : user?.role === "mg" ? (
          getMGActions()
        ) : user?.role === "accounting" ? (
          getAccountingActions()
        ) : user?.role === "director" ? (
          getDirectorActions()
        ) : (
          <div className="text-center text-gray-500">
            Aucune action disponible
          </div>
        )}
      </div>

      {/* Section spéciale pour employé */}
      {user?.role === "employee" && (
        <>
          {/* Conseils */}
          {getEmployeeTips()}

          {/* Tableau de mes demandes récentes pour employé */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                État de mes demandes récentes
              </h3>
            </div>

            {dashboardData?.recent_requests &&
            dashboardData.recent_requests.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Montant
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Statut
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {dashboardData.recent_requests
                      .slice(0, 5)
                      .map((request) => {
                        const statusBadge = getStatusBadge(request.status);
                        const isUrgent = request.estimated_cost > 500000;

                        return (
                          <tr key={request.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex flex-col">
                                <div className="flex items-center">
                                  <p className="text-sm font-medium text-gray-900 truncate max-w-xs">
                                    {request.item_description}
                                  </p>
                                  {isUrgent && (
                                    <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                      <AlertTriangle className="h-3 w-3 mr-1" />
                                      Urgent
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Intl.NumberFormat("fr-FR", {
                                style: "currency",
                                currency: "XOF",
                              }).format(request.estimated_cost || 0)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-1" />
                                {new Date(
                                  request.created_at
                                ).toLocaleDateString("fr-FR")}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusBadge.class}`}
                              >
                                {statusBadge.text}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <Link
                                to={`/requests/${request.id}`}
                                className="text-blue-600 hover:text-blue-900 flex items-center"
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Détails
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  Aucune demande
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Vous n'avez pas encore créé de demande.
                </p>
                <div className="mt-6">
                  <Link
                    to="/requests/create"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Créer ma première demande
                  </Link>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Tableau des demandes récentes - Pour tous les autres rôles */}
      {user?.role !== "employee" &&
        dashboardData?.recent_requests &&
        dashboardData.recent_requests.length > 0 && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Demandes récentes {user?.role === "mg" && "de mon niveau"}
                {user?.role === "accounting" && "de mon niveau"}
                {user?.role === "director" && "de mon niveau"}
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Demandeur
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Montant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {dashboardData.recent_requests.slice(0, 5).map((request) => {
                    const statusBadge = getStatusBadge(request.status);

                    return (
                      <tr key={request.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                            {request.item_description}
                          </div>
                          {request.item_description.length > 50 && (
                            <div className="text-xs text-gray-500 mt-1">
                              {request.item_description.substring(50, 100)}...
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-2 text-gray-400" />
                            <div className="text-sm text-gray-900">
                              {request.user_name}
                            </div>
                          </div>
                        </td>
                        {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Intl.NumberFormat("fr-FR", {
                            style: "currency",
                            currency: "XOF",
                          }).format(request.estimated_cost || 0)}
                        </td> */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Intl.NumberFormat("fr-FR", {
                            style: "currency",
                            currency: "XOF",
                          }).format(
                            request.final_cost != null
                              ? request.final_cost
                              : request.estimated_cost || 0
                          )}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {new Date(request.created_at).toLocaleDateString(
                              "fr-FR"
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusBadge.class}`}
                          >
                            {statusBadge.text}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Link
                            to={`/requests/${request.id}`}
                            className="text-blue-600 hover:text-blue-900 flex items-center"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Détails
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
    </div>
  );
};

export default Dashboard;

{
  /* Debug info - Remove in production */
}
{
  /* {process.env.NODE_ENV === "development" && dashboardData && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-medium text-yellow-800 mb-2">Debug Info:</h4>
          <pre className="text-xs text-yellow-700 overflow-x-auto">
            {JSON.stringify(
              {
                role: user?.role,
                userId: user?.id,
                stats: {
                  total: dashboardData.total_requests,
                  pending: dashboardData.pending_requests,
                  inProgress: dashboardData.in_progress_requests,
                  approved: dashboardData.approved_requests,
                  rejected: dashboardData.rejected_requests,
                  accountingTotal: dashboardData.accounting_total,
                  accountingPending: dashboardData.accounting_pending,
                  recentRequestsCount:
                    dashboardData.recent_requests?.length || 0,
                },
              },
              null,
              2
            )}
          </pre>
        </div>
      )} */
}
