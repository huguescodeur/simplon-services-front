import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { dashboardAPI } from "../../services/apis";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Target,
  Activity,
  Filter,
  Download,
  Minus,
  ShieldX,
} from "lucide-react";
import { toast } from "react-toastify";
import ExcelExportComponent from "./ExcelExportComponent";

const Statistics = () => {
  const { user } = useAuth();

  const [statsData, setStatsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("current_month");
  const [showStatusChart, setShowStatusChart] = useState(true);
  const [selectedTrendChart, setSelectedTrendChart] = useState("requests");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  // État pour le modal d'export Excel
  const [showExcelExport, setShowExcelExport] = useState(false);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const response = await dashboardAPI.getDashboard();
      setStatsData(response.data);
    } catch (error) {
      toast.error("Erreur lors du chargement des statistiques");
      // console.error("Statistics error:", error);
    } finally {
      setLoading(false);
    }
  };

  // RESTRICTION D'ACCÈS : Seuls MG et Direction ont accès aux statistiques globales
  if (!user || (user.role !== "mg" && user.role !== "director")) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <ShieldX className="mx-auto h-16 w-16 text-red-400 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Accès non autorisé
          </h2>
          <p className="text-gray-600 mb-4">
            Les statistiques globales ne sont accessibles qu'aux Moyens Généraux
            et à la Direction.
          </p>
        </div>
      </div>
    );
  }

  const calculateTrend = (current, previous) => {
    if (previous === 0 && current === 0) {
      return { value: 0, direction: "neutral" };
    }
    if (previous === 0) {
      return {
        value: current > 0 ? 100 : 0,
        direction: current > 0 ? "up" : "neutral",
      };
    }

    const percentChange = ((current - previous) / previous) * 100;
    const roundedChange = Math.round(percentChange);

    if (roundedChange === 0 && current !== previous) {
      return {
        value: 1,
        direction: percentChange > 0 ? "up" : "down",
      };
    }

    return {
      value: Math.abs(roundedChange),
      direction:
        roundedChange > 0 ? "up" : roundedChange < 0 ? "down" : "neutral",
    };
  };

  // console.log("Stats Data", statsData);

  const getPeriodRequests = (period, offset = 0) => {
    if (!statsData?.all_requests) return [];

    const now = new Date();
    let startDate, endDate;

    switch (period) {
      case "current_month": {
        if (offset === 0) {
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = now;
        } else {
          startDate = new Date(now.getFullYear(), now.getMonth() - offset, 1);
          endDate = new Date(now.getFullYear(), now.getMonth() - offset + 1, 0);
        }
        break;
      }
      case "last_month": {
        startDate = new Date(now.getFullYear(), now.getMonth() - 1 - offset, 1);
        endDate = new Date(now.getFullYear(), now.getMonth() - offset, 0);
        break;
      }
      case "quarter": {
        const quarterStart = Math.floor((now.getMonth() - offset * 3) / 3) * 3;
        startDate = new Date(now.getFullYear(), quarterStart, 1);
        endDate =
          offset === 0 ? now : new Date(now.getFullYear(), quarterStart + 3, 0);
        break;
      }
      case "year": {
        startDate = new Date(now.getFullYear() - offset, 0, 1);
        endDate =
          offset === 0 ? now : new Date(now.getFullYear() - offset, 11, 31);
        break;
      }
      case "custom": {
        startDate = new Date(selectedYear, selectedMonth - 1 - offset, 1);
        endDate = new Date(selectedYear, selectedMonth - offset, 0);
        break;
      }
      default: {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = now;
      }
    }

    // console.log("Stats Data", statsData);

    return statsData.all_requests.filter((req) => {
      // console.log("Stats Data req", req);
      const reqDate = new Date(req.created_at);
      return reqDate >= startDate && reqDate <= endDate;
    });
  };

  const calculatePeriodStats = (period, offset = 0) => {
    const allPeriodRequests = getPeriodRequests(period, offset);

    const approvedRequests = allPeriodRequests.filter(
      (req) => req.status === "director_approved"
    );

    const rejectedRequests = allPeriodRequests.filter(
      (req) => req.status === "rejected"
    );

    const totalAmount = approvedRequests.reduce((sum, req) => {
      return sum + parseFloat(req.final_cost || req.estimated_cost || 0);
    }, 0);

    return {
      totalAmount,
      totalRequests: allPeriodRequests.length,
      approvedRequests: approvedRequests.length,
      rejectedRequests: rejectedRequests.length,
      pendingRequests: allPeriodRequests.filter(
        (req) => req.status === "pending"
      ).length,
      inProgressRequests: allPeriodRequests.filter(
        (req) =>
          req.status === "mg_approved" || req.status === "accounting_reviewed"
      ).length,
    };
  };

  const calculateValidationRate = (period, offset = 0) => {
    const periodRequests = getPeriodRequests(period, offset);

    if (periodRequests.length === 0) return 0;

    const approvedRequests = periodRequests.filter(
      (req) => req.status === "director_approved"
    ).length;

    return Math.round((approvedRequests / periodRequests.length) * 100);
  };

  const formatAmount = (amount) => {
    if (!amount || amount === 0) return "0 FCFA";

    const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;

    if (numAmount >= 1000000) {
      return `${(numAmount / 1000000).toFixed(1)}M FCFA`;
    } else if (numAmount >= 1000) {
      return `${(numAmount / 1000).toFixed(0)}K FCFA`;
    }
    return `${numAmount.toLocaleString()} FCFA`;
  };

  const calculateTotalsByPeriod = () => calculatePeriodStats(selectedPeriod, 0);

  const getRoleSpecificTitle = () => {
    const titles = {
      mg: "Statistiques Globales - Moyens Généraux",
      director: "Statistiques Globales - Direction",
    };
    return titles[user?.role] || "Statistiques Globales";
  };

  const getRoleSpecificKPIs = () => {
    if (!statsData) return [];

    const currentPeriod = calculatePeriodStats(selectedPeriod, 0);
    const previousPeriod = calculatePeriodStats(selectedPeriod, 1);

    const currentValidationRate = calculateValidationRate(selectedPeriod, 0);
    const previousValidationRate = calculateValidationRate(selectedPeriod, 1);

    const requestsTrend = calculateTrend(
      currentPeriod.totalRequests,
      previousPeriod.totalRequests
    );
    const amountTrend = calculateTrend(
      currentPeriod.totalAmount,
      previousPeriod.totalAmount
    );
    const inProgressTrend = calculateTrend(
      currentPeriod.inProgressRequests,
      previousPeriod.inProgressRequests
    );
    const validationTrend = calculateTrend(
      currentValidationRate,
      previousValidationRate
    );

    return [
      {
        title: "Total des demandes",
        value: currentPeriod.totalRequests,
        icon: FileText,
        color: "blue",
        trend: requestsTrend,
      },
      {
        title: "Budget total approuvé",
        value: formatAmount(currentPeriod.totalAmount),
        icon: DollarSign,
        color: "emerald",
        trend: amountTrend,
        isAmount: true,
      },
      {
        title: "En cours de traitement",
        value: currentPeriod.inProgressRequests,
        icon: Activity,
        color: "indigo",
        trend: inProgressTrend,
      },
      {
        title: "Taux de validation",
        value: `${currentValidationRate}%`,
        icon: Target,
        color: "teal",
        trend: validationTrend,
      },
    ];
  };

  const getStatusDistribution = () => {
    if (!statsData?.all_requests) return [];

    const periodRequests = getPeriodRequests(selectedPeriod, 0);

    const statusConfig = {
      pending: {
        label: "En attente",
        color: "bg-yellow-500",
        textColor: "text-yellow-600",
      },
      mg_approved: {
        label: "Validé MG",
        color: "bg-blue-500",
        textColor: "text-blue-600",
      },
      accounting_reviewed: {
        label: "Étudié Comptabilité",
        color: "bg-indigo-500",
        textColor: "text-indigo-600",
      },
      director_approved: {
        label: "Approuvé Direction",
        color: "bg-green-500",
        textColor: "text-green-600",
      },
      rejected: {
        label: "Refusé",
        color: "bg-red-500",
        textColor: "text-red-600",
      },
    };

    const statusCounts = {
      pending: periodRequests.filter((req) => req.status === "pending").length,
      mg_approved: periodRequests.filter((req) => req.status === "mg_approved")
        .length,
      accounting_reviewed: periodRequests.filter(
        (req) => req.status === "accounting_reviewed"
      ).length,
      director_approved: periodRequests.filter(
        (req) => req.status === "director_approved"
      ).length,
      rejected: periodRequests.filter((req) => req.status === "rejected")
        .length,
    };

    const total = Object.values(statusCounts).reduce(
      (sum, count) => sum + count,
      0
    );

    return Object.entries(statusCounts)
      .filter(([, count]) => count > 0)
      .map(([status, count]) => {
        const config = statusConfig[status] || {
          label: status,
          color: "bg-gray-500",
          textColor: "text-gray-600",
        };
        return {
          ...config,
          count,
          percentage: total > 0 ? Math.round((count / total) * 100) : 0,
        };
      });
  };

  const getDepartmentStats = () => {
    if (!statsData?.all_requests) return [];

    const departmentMapping = {
      accounting: "Comptabilité",
      mg: "Moyens Généraux",
      director: "Direction",
      hr: "Ressources Humaines",
      it: "Informatique",
      finance: "Finance",
      operations: "Opérations",
      marketing: "Marketing",
      sales: "Ventes",
    };

    const departmentGroups = statsData.all_requests.reduce((acc, req) => {
      let deptName = "Autres services";

      // console.log("Request Department:", JSON.stringify(req, null, 2));

      if (req.user?.department) {
        deptName =
          departmentMapping[req.user.department] || req.user.department;
      } else if (req.user?.role) {
        deptName =
          departmentMapping[req.user.role] ||
          (req.user.role === "employee"
            ? "Employés"
            : req.user.role === "mg"
            ? "Moyens Généraux"
            : req.user.role === "accounting"
            ? "Comptabilité"
            : req.user.role === "director"
            ? "Direction"
            : "Autres services");
      } else if (req.department) {
        deptName = departmentMapping[req.department] || req.department;
      } else if (req.user_name) {
        deptName = `Service de ${req.user_name}`;
      }

      acc[deptName] = (acc[deptName] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(departmentGroups)
      .map(([name, requests]) => ({
        name,
        requests,
      }))
      .sort((a, b) => b.requests - a.requests)
      .slice(0, 5);
  };

  const getMonthlyTrend = () => {
    if (!statsData?.all_requests) return [];

    const projectStartDate = new Date(2024, 7, 1);
    const currentDate = new Date();
    const months = [];

    let tempDate = new Date(projectStartDate);

    while (tempDate <= currentDate) {
      const monthRequests = statsData.all_requests.filter((req) => {
        const reqDate = new Date(req.created_at);
        return (
          reqDate.getMonth() === tempDate.getMonth() &&
          reqDate.getFullYear() === tempDate.getFullYear()
        );
      });

      const monthlyAmount = monthRequests
        .filter((req) => req.status === "director_approved")
        .reduce(
          (sum, req) =>
            sum + parseFloat(req.final_cost || req.estimated_cost || 0),
          0
        );

      months.push({
        month: tempDate.toLocaleDateString("fr-FR", {
          month: "short",
          year: "numeric",
        }),
        requests: monthRequests.length,
        amount: monthlyAmount,
        displayAmount: formatAmount(monthlyAmount),
      });

      tempDate = new Date(tempDate.getFullYear(), tempDate.getMonth() + 1, 1);
    }

    return months.slice(-6);
  };

  const getColorClasses = (color) => {
    const colors = {
      blue: "bg-blue-500 text-blue-600",
      green: "bg-green-500 text-green-600",
      orange: "bg-orange-500 text-orange-600",
      red: "bg-red-500 text-red-600",
      purple: "bg-purple-500 text-purple-600",
      indigo: "bg-indigo-500 text-indigo-600",
      teal: "bg-teal-500 text-teal-600",
      emerald: "bg-emerald-500 text-emerald-600",
    };
    return colors[color] || "bg-gray-500 text-gray-600";
  };

  const getYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = 2024; year <= currentYear; year++) {
      years.push(year);
    }
    return years;
  };

  const renderTrendIcon = (trend) => {
    if (trend.direction === "up") {
      return <TrendingUp className="h-3 w-3 mr-1" />;
    } else if (trend.direction === "down") {
      return <TrendingDown className="h-3 w-3 mr-1" />;
    } else {
      return <Minus className="h-3 w-3 mr-1" />;
    }
  };

  const renderTrendText = (trend) => {
    if (trend.direction === "neutral") {
      return "Stable vs période précédente";
    } else {
      const sign = trend.direction === "up" ? "+" : "-";
      return `${sign}${trend.value}% vs période précédente`;
    }
  };

  const getTrendColor = (trend) => {
    if (trend.direction === "up") return "text-green-600";
    if (trend.direction === "down") return "text-red-600";
    return "text-gray-600";
  };

  // Fonction pour ouvrir le modal d'export Excel
  const handleOpenExcelExport = () => {
    setShowExcelExport(true);
  };

  // Fonction pour fermer le modal d'export Excel
  const handleCloseExcelExport = () => {
    setShowExcelExport(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!statsData) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">
          Aucune donnée disponible
        </h3>
      </div>
    );
  }

  const kpis = getRoleSpecificKPIs();
  const statusDistribution = getStatusDistribution();
  const monthlyTrend = getMonthlyTrend();
  const totals = calculateTotalsByPeriod();
  const departmentStats = getDepartmentStats();

  // console.log("Totals", totals);

  return (
    <div className="space-y-6">
      {/* Header avec filtres */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Partie gauche : Titre + sous-titre + accès */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {getRoleSpecificTitle()}
            </h1>
            <p className="text-gray-600 mt-1">
              Vue d'ensemble des performances et indicateurs clés du service
            </p>
            <div className="mt-2 flex items-center">
              <div className="flex items-center px-3 py-1 rounded-full text-xs bg-green-100 text-green-700">
                <CheckCircle className="h-3 w-3 mr-1" />
                Accès autorisé -{" "}
                {user?.role === "mg" ? "Moyens Généraux" : "Direction"}
              </div>
            </div>
          </div>

          {/* Partie droite : Filtres + Boutons */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="current_month">Ce mois</option>
                <option value="last_month">Mois dernier</option>
                <option value="quarter">Ce trimestre</option>
                <option value="year">Cette année</option>
                <option value="custom">Personnalisé</option>
              </select>
            </div>

            {selectedPeriod === "custom" && (
              <div className="flex items-center space-x-2">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {[...Array(12)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {new Date(0, i).toLocaleDateString("fr-FR", {
                        month: "long",
                      })}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {getYearOptions().map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={handleOpenExcelExport}
              className="bg-green-600 text-white px-4 py-2 rounded-md text-sm hover:bg-green-700 transition-colors cursor-pointer flex items-center"
            >
              <Download className="h-4 w-4 mr-2" />
              Exporter Excel
            </button>

            <button
              onClick={fetchStatistics}
              className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 transition-colors cursor-pointer"
            >
              Actualiser
            </button>
          </div>
        </div>

        {/* Résumé pour la période sélectionnée */}
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="font-semibold text-gray-900">
                Demandes totales
              </div>
              <div className="text-xl font-bold text-blue-600">
                {totals.totalRequests}
              </div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-gray-900">
                Demandes approuvées
              </div>
              <div className="text-xl font-bold text-green-600">
                {totals.approvedRequests}
              </div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-gray-900">
                Demandes refusées
              </div>
              <div className="text-xl font-bold text-red-600">
                {totals.rejectedRequests}
              </div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-gray-900">
                Budget total approuvé
              </div>
              <div className="text-xl font-bold text-emerald-600">
                {formatAmount(totals.totalAmount)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPIs Cards avec tendances */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, index) => {
          const Icon = kpi.icon;
          const colorClasses = getColorClasses(kpi.color);
          const [bgColor, textColor] = colorClasses.split(" ");

          return (
            <div
              key={index}
              className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${bgColor} text-white`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-600 truncate">
                    {kpi.title}
                  </p>
                  <p
                    className={`text-2xl font-bold text-gray-900 ${
                      kpi.isAmount ? "text-lg" : ""
                    }`}
                  >
                    {kpi.value}
                  </p>
                  <p
                    className={`text-xs flex items-center mt-1 ${getTrendColor(
                      kpi.trend
                    )}`}
                  >
                    {renderTrendIcon(kpi.trend)}
                    {renderTrendText(kpi.trend)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Distribution */}
        <div className="lg:col-span-1 bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Répartition par statut ({selectedPeriod})
            </h3>
            <button
              onClick={() => setShowStatusChart(!showStatusChart)}
              className={`text-sm px-3 py-1 rounded transition-colors cursor-pointer ${
                showStatusChart
                  ? "bg-blue-100 text-blue-700"
                  : "bg-gray-100 text-gray-500 hover:text-gray-700"
              }`}
            >
              {showStatusChart ? "Masquer" : "Afficher"}
            </button>
          </div>

          {showStatusChart && (
            <div className="space-y-4">
              {statusDistribution.length > 0 ? (
                <>
                  {statusDistribution.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center flex-1">
                        <div
                          className={`w-3 h-3 ${item.color} rounded-full mr-3`}
                        ></div>
                        <span className="text-sm text-gray-600 flex-1">
                          {item.label}
                        </span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-medium">
                          {item.count}
                        </span>
                        <span className={`text-xs ${item.textColor}`}>
                          ({item.percentage}%)
                        </span>
                      </div>
                    </div>
                  ))}

                  {/* Donut Chart */}
                  <div className="mt-6 flex justify-center">
                    <div className="relative w-32 h-32">
                      <svg className="w-32 h-32 transform -rotate-90">
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          fill="none"
                          stroke="#e5e7eb"
                          strokeWidth="8"
                        />
                        {statusDistribution.map((item, index) => {
                          const circumference = 2 * Math.PI * 56;
                          const strokeDasharray = `${
                            (item.percentage / 100) * circumference
                          } ${circumference}`;
                          const rotation =
                            statusDistribution
                              .slice(0, index)
                              .reduce((acc, curr) => acc + curr.percentage, 0) *
                            3.6;

                          return (
                            <circle
                              key={index}
                              cx="64"
                              cy="64"
                              r="56"
                              fill="none"
                              stroke={
                                item.color.includes("yellow")
                                  ? "#eab308"
                                  : item.color.includes("blue")
                                  ? "#3b82f6"
                                  : item.color.includes("indigo")
                                  ? "#6366f1"
                                  : item.color.includes("green")
                                  ? "#22c55e"
                                  : item.color.includes("red")
                                  ? "#ef4444"
                                  : "#6b7280"
                              }
                              strokeWidth="8"
                              strokeDasharray={strokeDasharray}
                              style={{
                                transform: `rotate(${rotation}deg)`,
                                transformOrigin: "64px 64px",
                              }}
                            />
                          );
                        })}
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-lg font-bold text-gray-900">
                            {statusDistribution.reduce(
                              (sum, item) => sum + item.count,
                              0
                            )}
                          </div>
                          <div className="text-xs text-gray-500">Total</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Aucune demande pour cette période
                </div>
              )}
            </div>
          )}
        </div>

        {/* Monthly Trend */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Évolution mensuelle (depuis août 2024)
            </h3>
            <div className="flex space-x-2">
              <button
                onClick={() => setSelectedTrendChart("requests")}
                className={`text-xs px-3 py-1 rounded transition-colors cursor-pointer ${
                  selectedTrendChart === "requests"
                    ? "bg-blue-100 text-blue-700 border border-blue-300"
                    : "bg-gray-100 text-gray-500 hover:text-gray-700 hover:bg-gray-200"
                }`}
              >
                Demandes
              </button>
              <button
                onClick={() => setSelectedTrendChart("amounts")}
                className={`text-xs px-3 py-1 rounded transition-colors cursor-pointer ${
                  selectedTrendChart === "amounts"
                    ? "bg-green-100 text-green-700 border border-green-300"
                    : "bg-gray-100 text-gray-500 hover:text-gray-700 hover:bg-gray-200"
                }`}
              >
                Montants
              </button>
            </div>
          </div>

          <div className="h-64 flex items-end justify-between space-x-2">
            {monthlyTrend.map((month, index) => {
              const maxValue =
                selectedTrendChart === "amounts"
                  ? Math.max(...monthlyTrend.map((m) => m.amount))
                  : Math.max(...monthlyTrend.map((m) => m.requests));

              const value =
                selectedTrendChart === "amounts"
                  ? month.amount
                  : month.requests;
              const height = maxValue > 0 ? (value / maxValue) * 200 : 0;

              return (
                <div key={index} className="flex flex-col items-center flex-1">
                  <div
                    className={`w-full rounded-t-md transition-all duration-500 hover:opacity-80 cursor-pointer ${
                      selectedTrendChart === "amounts"
                        ? "bg-green-500"
                        : "bg-blue-500"
                    }`}
                    style={{ height: `${Math.max(height, 2)}px` }}
                    title={`${month.month}: ${
                      selectedTrendChart === "amounts"
                        ? month.displayAmount
                        : `${value} demandes`
                    }`}
                  ></div>
                  <div className="text-xs text-gray-600 mt-2 text-center">
                    {month.month}
                  </div>
                  <div className="text-xs font-medium text-gray-900">
                    {selectedTrendChart === "amounts"
                      ? month.displayAmount.replace(" FCFA", "")
                      : value}
                  </div>
                </div>
              );
            })}
          </div>

          {selectedTrendChart === "amounts" && (
            <div className="mt-2 text-xs text-gray-500 text-center">
              * Montants en FCFA basés sur les demandes approuvées uniquement
            </div>
          )}
        </div>
      </div>

      {/* Performance par département */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Performance par département
          </h3>
          <div className="space-y-3">
            {departmentStats.length > 0 ? (
              departmentStats.map((dept, index) => {
                const maxRequests = Math.max(
                  ...departmentStats.map((d) => d.requests)
                );
                return (
                  <div
                    key={dept.name}
                    className="flex items-center justify-between"
                  >
                    <span
                      className="text-sm text-gray-600 w-24 truncate"
                      title={dept.name}
                    >
                      {dept.name}
                    </span>
                    <div className="flex items-center space-x-3 flex-1">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{
                            width: `${
                              maxRequests > 0
                                ? (dept.requests / maxRequests) * 100
                                : 0
                            }%`,
                          }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium w-8 text-right">
                        {dept.requests}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-4 text-gray-500">
                Aucune donnée de département disponible
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Délais de traitement
          </h3>
          <div className="space-y-4">
            {(() => {
              const calculateProcessingDelays = () => {
                if (!statsData?.all_requests)
                  return {
                    average: 0,
                    mgValidation: 0,
                    accountingReview: 0,
                    directorApproval: 0,
                  };

                const processedRequests = statsData.all_requests.filter(
                  (req) => req.status === "director_approved"
                );

                if (processedRequests.length === 0)
                  return {
                    average: 0,
                    mgValidation: 0,
                    accountingReview: 0,
                    directorApproval: 0,
                  };

                const delays = processedRequests.map((req) => {
                  const createdAt = new Date(req.created_at);
                  const updatedAt = req.updated_at
                    ? new Date(req.updated_at)
                    : new Date();
                  const daysDiff = Math.floor(
                    (updatedAt - createdAt) / (1000 * 60 * 60 * 24)
                  );
                  return Math.max(1, daysDiff);
                });

                const averageDelay =
                  delays.reduce((sum, delay) => sum + delay, 0) / delays.length;

                return {
                  average: Math.round(averageDelay * 10) / 10,
                  mgValidation: Math.round(averageDelay * 0.3 * 10) / 10,
                  accountingReview: Math.round(averageDelay * 0.4 * 10) / 10,
                  directorApproval: Math.round(averageDelay * 0.3 * 10) / 10,
                };
              };

              const processingDelays = calculateProcessingDelays();

              return (
                <>
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                      <span className="text-sm text-green-800">
                        Délai moyen global
                      </span>
                    </div>
                    <span className="text-sm font-bold text-green-800">
                      {processingDelays.average} jours
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center">
                      <Clock className="h-5 w-5 text-blue-600 mr-2" />
                      <span className="text-sm text-blue-800">
                        Validation MG
                      </span>
                    </div>
                    <span className="text-sm font-bold text-blue-800">
                      {processingDelays.mgValidation} jour
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                    <div className="flex items-center">
                      <Activity className="h-5 w-5 text-orange-600 mr-2" />
                      <span className="text-sm text-orange-800">
                        Étude Comptabilité
                      </span>
                    </div>
                    <span className="text-sm font-bold text-orange-800">
                      {processingDelays.accountingReview} jour
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center">
                      <Target className="h-5 w-5 text-purple-600 mr-2" />
                      <span className="text-sm text-purple-800">
                        Approbation Direction
                      </span>
                    </div>
                    <span className="text-sm font-bold text-purple-800">
                      {processingDelays.directorApproval} jour
                    </span>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      </div>
      {/* Section d'analyse des tendances pour la période sélectionnée */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Analyse des tendances -{" "}
          {selectedPeriod === "current_month"
            ? "Ce mois"
            : selectedPeriod === "last_month"
            ? "Mois dernier"
            : selectedPeriod === "quarter"
            ? "Ce trimestre"
            : selectedPeriod === "year"
            ? "Cette année"
            : "Période personnalisée"}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">
              Performance de la période
            </h4>
            <p className="text-sm text-gray-600">
              {(() => {
                const currentPeriod = calculatePeriodStats(selectedPeriod, 0);
                const previousPeriod = calculatePeriodStats(selectedPeriod, 1);
                const growth = calculateTrend(
                  currentPeriod.totalRequests,
                  previousPeriod.totalRequests
                );

                if (currentPeriod.totalRequests === 0) {
                  return "Aucune demande pour cette période";
                }

                return `${
                  growth.direction === "up"
                    ? "Augmentation"
                    : growth.direction === "down"
                    ? "Diminution"
                    : "Stabilité"
                } ${
                  growth.direction !== "neutral" ? `de ${growth.value}%` : ""
                } par rapport à la période précédente (${
                  previousPeriod.totalRequests
                } → ${currentPeriod.totalRequests} demandes)`;
              })()}
            </p>
          </div>

          <div className="p-4 border rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">
              Efficacité de validation
            </h4>
            <p className="text-sm text-gray-600">
              {(() => {
                const currentValidationRate = calculateValidationRate(
                  selectedPeriod,
                  0
                );
                const currentPeriod = calculatePeriodStats(selectedPeriod, 0);

                if (currentPeriod.totalRequests === 0) {
                  return "Aucune donnée pour cette période";
                }

                return `${currentValidationRate}% des demandes approuvées (${currentPeriod.approvedRequests}/${currentPeriod.totalRequests})`;
              })()}
            </p>
          </div>

          <div className="p-4 border rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">État du pipeline</h4>
            <p className="text-sm text-gray-600">
              {(() => {
                const currentPeriod = calculatePeriodStats(selectedPeriod, 0);

                if (currentPeriod.totalRequests === 0) {
                  return "Aucune demande en cours";
                }

                const pendingCount =
                  currentPeriod.pendingRequests +
                  currentPeriod.inProgressRequests;
                return `${pendingCount} demandes en cours de traitement sur ${currentPeriod.totalRequests} total`;
              })()}
            </p>
          </div>
        </div>

        {/* Comparaison détaillée avec la période précédente */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-3">
            Comparaison détaillée
          </h4>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-2">
                Période courante
              </h5>
              <div className="space-y-1 text-sm">
                {(() => {
                  const currentPeriod = calculatePeriodStats(selectedPeriod, 0);
                  const currentValidation = calculateValidationRate(
                    selectedPeriod,
                    0
                  );

                  return (
                    <>
                      <div className="flex justify-between">
                        <span>Demandes totales:</span>
                        <span className="font-medium">
                          {currentPeriod.totalRequests}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Approuvées:</span>
                        <span className="font-medium text-green-600">
                          {currentPeriod.approvedRequests}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>En cours:</span>
                        <span className="font-medium text-blue-600">
                          {currentPeriod.inProgressRequests}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>En attente:</span>
                        <span className="font-medium text-orange-600">
                          {currentPeriod.pendingRequests}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Rejetées:</span>
                        <span className="font-medium text-red-600">
                          {currentPeriod.rejectedRequests}
                        </span>
                      </div>
                      <div className="flex justify-between border-t pt-1">
                        <span>Taux de validation:</span>
                        <span className="font-medium">
                          {currentValidation}%
                        </span>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-2">
                Période précédente
              </h5>
              <div className="space-y-1 text-sm">
                {(() => {
                  const previousPeriod = calculatePeriodStats(
                    selectedPeriod,
                    1
                  );
                  const previousValidation = calculateValidationRate(
                    selectedPeriod,
                    1
                  );

                  return (
                    <>
                      <div className="flex justify-between">
                        <span>Demandes totales:</span>
                        <span className="font-medium">
                          {previousPeriod.totalRequests}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Approuvées:</span>
                        <span className="font-medium text-green-600">
                          {previousPeriod.approvedRequests}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>En cours:</span>
                        <span className="font-medium text-blue-600">
                          {previousPeriod.inProgressRequests}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>En attente:</span>
                        <span className="font-medium text-orange-600">
                          {previousPeriod.pendingRequests}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Rejetées:</span>
                        <span className="font-medium text-red-600">
                          {previousPeriod.rejectedRequests}
                        </span>
                      </div>
                      <div className="flex justify-between border-t pt-1">
                        <span>Taux de validation:</span>
                        <span className="font-medium">
                          {previousValidation}%
                        </span>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal d'export Excel */}
      {showExcelExport && (
        <ExcelExportComponent
          statsData={statsData}
          onClose={handleCloseExcelExport}
        />
      )}
    </div>
  );
};

export default Statistics;
