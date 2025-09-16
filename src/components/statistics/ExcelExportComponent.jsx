import React, { useState } from "react";
import {
  Download,
  Calendar,
  Building,
  Filter,
  FileSpreadsheet,
} from "lucide-react";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

const ExcelExportComponent = ({ statsData, onClose }) => {
  const [exportConfig, setExportConfig] = useState({
    type: "global",
    months: [],
    departments: [],
    includeCharts: true,
    includeTrends: true,
    includeDetails: true,
  });

  const [selectedMonths, setSelectedMonths] = useState([]);
  const [selectedDepartments, setSelectedDepartments] = useState([]);

  // Mapping des départements
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

  // Générer les options de mois (depuis août 2024)
  const getMonthOptions = () => {
    const months = [];
    const startDate = new Date(2024, 7, 1); // Août 2024
    const currentDate = new Date();

    let tempDate = new Date(startDate);
    while (tempDate <= currentDate) {
      months.push({
        value: `${tempDate.getFullYear()}-${String(
          tempDate.getMonth() + 1
        ).padStart(2, "0")}`,
        label: tempDate.toLocaleDateString("fr-FR", {
          month: "long",
          year: "numeric",
        }),
        date: new Date(tempDate),
      });
      tempDate = new Date(tempDate.getFullYear(), tempDate.getMonth() + 1, 1);
    }
    return months;
  };

  // Générer les options de départements
  const getDepartmentOptions = () => {
    if (!statsData?.all_requests) return [];

    const departments = new Set();
    statsData.all_requests.forEach((req) => {
      let deptName = "Autres services";

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
      }

      departments.add(deptName);
    });

    return Array.from(departments).sort();
  };

  // Filtrer les demandes selon les critères
  const filterRequests = (requests, config) => {
    let filtered = [...requests];

    // Filtrage par mois
    if (config.months && config.months.length > 0) {
      filtered = filtered.filter((req) => {
        const reqDate = new Date(req.created_at);
        const reqMonth = `${reqDate.getFullYear()}-${String(
          reqDate.getMonth() + 1
        ).padStart(2, "0")}`;
        return config.months.includes(reqMonth);
      });
    }

    // Filtrage par département
    if (config.departments && config.departments.length > 0) {
      filtered = filtered.filter((req) => {
        let deptName = "Autres services";

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
        }

        return config.departments.includes(deptName);
      });
    }

    return filtered;
  };

  // Calculer les statistiques pour un ensemble de demandes
  const calculateStats = (requests) => {
    const total = requests.length;
    const approved = requests.filter(
      (req) => req.status === "director_approved"
    ).length;
    const rejected = requests.filter((req) => req.status === "rejected").length;
    const pending = requests.filter((req) => req.status === "pending").length;
    const inProgress = requests.filter(
      (req) =>
        req.status === "mg_approved" || req.status === "accounting_reviewed"
    ).length;

    const totalAmount = requests
      .filter((req) => req.status === "director_approved")
      .reduce((sum, req) => sum + (parseFloat(req.estimated_cost) || 0), 0);

    const validationRate = total > 0 ? Math.round((approved / total) * 100) : 0;

    return {
      total,
      approved,
      rejected,
      pending,
      inProgress,
      totalAmount,
      validationRate,
    };
  };

  const generateExcelData = async () => {
    const workbook = new ExcelJS.Workbook();
    const filteredRequests = filterRequests(
      statsData.all_requests || [],
      exportConfig
    );

    const summaryStats = calculateStats(filteredRequests);

    const commonHeaderStyle = {
      font: { bold: true },
      alignment: { vertical: "middle", horizontal: "center" },
      fill: {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFDCE6F1" },
      },
      border: {
        top: { style: "thin", color: { argb: "FFCCCCCC" } },
        left: { style: "thin", color: { argb: "FFCCCCCC" } },
        bottom: { style: "thin", color: { argb: "FFCCCCCC" } },
        right: { style: "thin", color: { argb: "FFCCCCCC" } },
      },
    };

    const applyAutoWidth = (sheet) => {
      sheet.columns.forEach((col) => {
        let maxLength = 0;
        col.eachCell({ includeEmpty: true }, (cell) => {
          const val = cell.value ? cell.value.toString() : "";
          maxLength = Math.max(maxLength, val.length);
        });
        col.width = maxLength + 4;
      });
    };

    // 1. Résumé
    const summarySheet = workbook.addWorksheet("Résumé");

    summarySheet.mergeCells("A1", "B1");
    summarySheet.getCell("A1").value =
      "RAPPORT STATISTIQUE - SYSTÈME DE DEMANDES";
    summarySheet.getCell("A1").font = { bold: true, size: 14 };
    summarySheet.getCell("A1").alignment = { horizontal: "center" };

    summarySheet.addRow([]);
    summarySheet.addRow([
      "Date de génération",
      new Date().toLocaleDateString("fr-FR"),
    ]);
    summarySheet.addRow(["Période d'analyse", getPeriodLabel()]);
    summarySheet.addRow([]);

    summarySheet.addRow(["RÉSUMÉ GLOBAL"]).font = { bold: true };
    const headerRow = summarySheet.addRow(["Indicateur", "Valeur"]);
    headerRow.eachCell((cell) => Object.assign(cell, commonHeaderStyle));

    const dataRows = [
      ["Total des demandes", summaryStats.total],
      ["Demandes approuvées", summaryStats.approved],
      ["Demandes rejetées", summaryStats.rejected],
      ["Demandes en attente", summaryStats.pending],
      ["Demandes en cours", summaryStats.inProgress],
      ["Budget total approuvé (FCFA)", summaryStats.totalAmount],
      ["Taux de validation (%)", summaryStats.validationRate],
    ];

    dataRows.forEach((row) => summarySheet.addRow(row));

    applyAutoWidth(summarySheet);

    // 2. Analyse mensuelle
    if (exportConfig.includeTrends && exportConfig.months.length > 0) {
      const monthlySheet = workbook.addWorksheet("Analyse mensuelle");
      monthlySheet.addRow(["ANALYSE MENSUELLE"]).font = { bold: true };
      monthlySheet.addRow([]);

      const header = monthlySheet.addRow([
        "Mois",
        "Total",
        "Approuvées",
        "Rejetées",
        "En cours",
        "Budget (FCFA)",
        "Taux (%)",
      ]);
      header.eachCell((cell) => Object.assign(cell, commonHeaderStyle));

      exportConfig.months.forEach((month) => {
        const monthRequests = filteredRequests.filter((req) => {
          const reqDate = new Date(req.created_at);
          const reqMonth = `${reqDate.getFullYear()}-${String(
            reqDate.getMonth() + 1
          ).padStart(2, "0")}`;
          return reqMonth === month;
        });

        const monthStats = calculateStats(monthRequests);
        const monthLabel =
          getMonthOptions().find((m) => m.value === month)?.label || month;

        monthlySheet.addRow([
          monthLabel,
          monthStats.total,
          monthStats.approved,
          monthStats.rejected,
          monthStats.inProgress,
          monthStats.totalAmount,
          monthStats.validationRate,
        ]);
      });

      applyAutoWidth(monthlySheet);
    }

    // 3. Analyse par département
    if (exportConfig.includeDetails && exportConfig.departments.length > 0) {
      const deptSheet = workbook.addWorksheet("Analyse départements");
      deptSheet.addRow(["ANALYSE PAR DÉPARTEMENT"]).font = { bold: true };
      deptSheet.addRow([]);

      const header = deptSheet.addRow([
        "Département",
        "Total",
        "Approuvées",
        "Rejetées",
        "En cours",
        "Budget (FCFA)",
        "Taux (%)",
      ]);
      header.eachCell((cell) => Object.assign(cell, commonHeaderStyle));

      exportConfig.departments.forEach((dept) => {
        const deptRequests = filteredRequests.filter((req) => {
          let deptName = "Autres services";

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
          }

          return deptName === dept;
        });

        const deptStats = calculateStats(deptRequests);

        deptSheet.addRow([
          dept,
          deptStats.total,
          deptStats.approved,
          deptStats.rejected,
          deptStats.inProgress,
          deptStats.totalAmount,
          deptStats.validationRate,
        ]);
      });

      applyAutoWidth(deptSheet);
    }

    // 4. Données détaillées
    if (exportConfig.includeDetails) {
      const detailsSheet = workbook.addWorksheet("Données détaillées");
      detailsSheet.addRow(["DONNÉES DÉTAILLÉES"]).font = { bold: true };
      detailsSheet.addRow([]);

      const header = detailsSheet.addRow([
        "ID",
        "Description produit",
        "Demandeur",
        "Département",
        "Statut",
        "Date création",
        "Quantité",
        "Coût estimé (FCFA)",
        "Date mise à jour",
      ]);
      header.eachCell((cell) => Object.assign(cell, commonHeaderStyle));

      const statusLabels = {
        pending: "En attente",
        mg_approved: "Validé MG",
        accounting_reviewed: "Étudié Comptabilité",
        director_approved: "Approuvé Direction",
        rejected: "Refusé",
      };

      filteredRequests.forEach((req) => {
        let deptName = "Autres services";

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
        }

        detailsSheet.addRow([
          req.id,
          req.item_description || "Sans titre",
          req.user_name || "Inconnu",
          deptName,
          statusLabels[req.status] || req.status,
          new Date(req.created_at).toLocaleDateString("fr-FR"),
          req.quantity,
          parseFloat(req.estimated_cost) || 0,
          req.updated_at
            ? new Date(req.updated_at).toLocaleDateString("fr-FR")
            : "",
        ]);
      });

      applyAutoWidth(detailsSheet);
    }

    return workbook;
  };

  const getPeriodLabel = () => {
    let label = "Toutes les données";

    if (exportConfig.months.length > 0) {
      const monthLabels = exportConfig.months.map(
        (month) =>
          getMonthOptions().find((m) => m.value === month)?.label || month
      );
      label = `Mois: ${monthLabels.join(", ")}`;
    }

    if (exportConfig.departments.length > 0) {
      label += ` - Départements: ${exportConfig.departments.join(", ")}`;
    }

    return label;
  };

  const handleExport = async () => {
    const workbook = await generateExcelData();

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const fileName = `statistiques_demandes_${
      new Date().toISOString().split("T")[0]
    }.xlsx`;
    saveAs(blob, fileName);
  };

  const handleMonthToggle = (month) => {
    const updatedMonths = selectedMonths.includes(month)
      ? selectedMonths.filter((m) => m !== month)
      : [...selectedMonths, month];

    setSelectedMonths(updatedMonths);
    setExportConfig((prev) => ({ ...prev, months: updatedMonths }));
  };

  const handleDepartmentToggle = (dept) => {
    const updatedDepts = selectedDepartments.includes(dept)
      ? selectedDepartments.filter((d) => d !== dept)
      : [...selectedDepartments, dept];

    setSelectedDepartments(updatedDepts);
    setExportConfig((prev) => ({ ...prev, departments: updatedDepts }));
  };

  const monthOptions = getMonthOptions();
  const departmentOptions = getDepartmentOptions();

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <FileSpreadsheet className="h-6 w-6 text-green-600 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Export Excel des Statistiques
                </h3>
                <p className="text-sm text-gray-600">
                  Configurez et exportez vos données statistiques
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-xl font-bold cursor-pointer"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Configuration des options d'export */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Options d'export</h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={exportConfig.includeTrends}
                  onChange={(e) =>
                    setExportConfig((prev) => ({
                      ...prev,
                      includeTrends: e.target.checked,
                    }))
                  }
                  className="mr-2"
                />
                <span className="text-sm">Inclure l'analyse mensuelle</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={exportConfig.includeDetails}
                  onChange={(e) =>
                    setExportConfig((prev) => ({
                      ...prev,
                      includeDetails: e.target.checked,
                    }))
                  }
                  className="mr-2"
                />
                <span className="text-sm">Inclure les données détaillées</span>
              </label>
            </div>
          </div>

          {/* Sélection des mois */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900 flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                Filtrer par mois
              </h4>
              <button
                onClick={() => {
                  const allMonths = monthOptions.map((m) => m.value);
                  const newSelection =
                    selectedMonths.length === allMonths.length ? [] : allMonths;
                  setSelectedMonths(newSelection);
                  setExportConfig((prev) => ({
                    ...prev,
                    months: newSelection,
                  }));
                }}
                className="text-xs text-blue-600 hover:text-blue-800 cursor-pointer"
              >
                {selectedMonths.length === monthOptions.length
                  ? "Tout désélectionner"
                  : "Tout sélectionner"}
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-48 overflow-y-auto border rounded-lg p-3">
              {monthOptions.map((month) => (
                <label
                  key={month.value}
                  className="flex items-center cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedMonths.includes(month.value)}
                    onChange={() => handleMonthToggle(month.value)}
                    className="mr-2"
                  />
                  <span className="text-sm">{month.label}</span>
                </label>
              ))}
            </div>

            {selectedMonths.length > 0 && (
              <p className="text-xs text-gray-500">
                {selectedMonths.length} mois sélectionné(s)
              </p>
            )}
          </div>

          {/* Sélection des départements */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900 flex items-center">
                <Building className="h-4 w-4 mr-2" />
                Filtrer par département
              </h4>
              <button
                onClick={() => {
                  const newSelection =
                    selectedDepartments.length === departmentOptions.length
                      ? []
                      : departmentOptions;
                  setSelectedDepartments(newSelection);
                  setExportConfig((prev) => ({
                    ...prev,
                    departments: newSelection,
                  }));
                }}
                className="text-xs text-blue-600 hover:text-blue-800 cursor-pointer"
              >
                {selectedDepartments.length === departmentOptions.length
                  ? "Tout désélectionner"
                  : "Tout sélectionner"}
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto border rounded-lg p-3">
              {departmentOptions.map((dept) => (
                <label key={dept} className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedDepartments.includes(dept)}
                    onChange={() => handleDepartmentToggle(dept)}
                    className="mr-2"
                  />
                  <span className="text-sm">{dept}</span>
                </label>
              ))}
            </div>

            {selectedDepartments.length > 0 && (
              <p className="text-xs text-gray-500">
                {selectedDepartments.length} département(s) sélectionné(s)
              </p>
            )}
          </div>

          {/* Aperçu de l'export */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">
              Aperçu de l'export
            </h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p>
                <strong>Période:</strong> {getPeriodLabel()}
              </p>
              <p>
                <strong>Données à exporter:</strong>
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Résumé global des statistiques</li>
                {exportConfig.includeTrends && selectedMonths.length > 0 && (
                  <li>Analyse mensuelle détaillée</li>
                )}
                {exportConfig.includeDetails &&
                  selectedDepartments.length > 0 && (
                    <li>Analyse par département</li>
                  )}
                {exportConfig.includeDetails && (
                  <li>Liste détaillée de toutes les demandes</li>
                )}
              </ul>
              <p className="mt-2">
                <strong>Nombre de demandes à exporter:</strong>{" "}
                {
                  filterRequests(statsData.all_requests || [], exportConfig)
                    .length
                }
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors cursor-pointer"
          >
            Annuler
          </button>
          <button
            onClick={handleExport}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center cursor-pointer"
          >
            <Download className="h-4 w-4 mr-2" />
            Exporter vers Excel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExcelExportComponent;
