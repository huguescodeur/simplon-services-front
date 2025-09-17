// import React, { useState, useEffect } from 'react';
// import { toast } from 'react-toastify';
// import { attachmentsAPI } from '../../services/apis';
// import { useAuth } from '../../context/AuthContext';
// import {
//   Upload,
//   X,
//   Download,
//   Eye,
//   AlertCircle,
//   FileText,
//   Image,
//   File,
//   Clock
// } from 'lucide-react';

// const AttachmentsManager = ({
//   requestId,
//   initialAttachments = [],
//   canUpload = true,
//   canDelete = true,
//   // Nouveaux props pour gérer la validation différée
//   isInValidationMode = false,
//   pendingFiles = [],
//   onFilesChange = null,
//   // NOUVEAU: props pour contrôler les permissions selon le statut de la demande
//   requestStatus = 'pending',
//   requestUserId = null
// }) => {
//   const { user } = useAuth();
//   const [attachments, setAttachments] = useState(initialAttachments);
//   const [localPendingFiles, setLocalPendingFiles] = useState([]);
//   const [isUploading, setIsUploading] = useState(false);

//   useEffect(() => {
//     if (requestId && requestId !== null) {
//       fetchAttachments();
//     } else {
//       setAttachments(initialAttachments);
//     }
//   }, [requestId, initialAttachments]);

//   // Utiliser les fichiers en attente passés en props ou l'état local
//   const currentPendingFiles = pendingFiles.length > 0 ? pendingFiles : localPendingFiles;

//   const fetchAttachments = async () => {
//     try {
//       const response = await attachmentsAPI.getAttachments(requestId);
//       setAttachments(response.data);
//     } catch (error) {
//       console.error('Erreur chargement pièces jointes:', error);
//     }
//   };

//   // NOUVELLE FONCTION: Déterminer si l'utilisateur peut ajouter des fichiers
//   const canUserUpload = () => {
//     if (!canUpload) return false;

//     // Le créateur de la demande peut toujours ajouter (sauf si rejetée ou approuvée)
//     if (requestUserId === user?.id && !['rejected', 'director_approved'].includes(requestStatus)) {
//       return true;
//     }

//     // Seul le MG peut ajouter des fichiers lors de la validation
//     if (user?.role === 'mg' && requestStatus === 'pending') {
//       return true;
//     }

//     // Les autres rôles (comptabilité, direction) ne peuvent PAS ajouter de fichiers
//     // même s'ils ont les droits de validation
//     return false;
//   };

//   // NOUVELLE FONCTION: Déterminer si l'utilisateur peut supprimer un fichier
//   const canUserDeleteFile = (attachment) => {
//     if (!canDelete) return false;

//     // Le créateur de la demande peut supprimer ses propres fichiers (sauf si approuvée/rejetée)
//     if (requestUserId === user?.id && attachment.uploaded_by === user?.id &&
//         !['rejected', 'director_approved'].includes(requestStatus)) {
//       return true;
//     }

//     // Seul le MG peut supprimer des fichiers lors de la validation
//     if (user?.role === 'mg' && requestStatus === 'pending') {
//       return true;
//     }

//     // Les autres rôles (comptabilité, direction) ne peuvent PAS supprimer de fichiers
//     return false;
//   };

//   const handleFileUpload = async (e) => {
//     const files = Array.from(e.target.files);
//     if (files.length === 0) return;

//     // Vérifier si l'utilisateur peut ajouter des fichiers
//     if (!canUserUpload()) {
//       toast.error('Vous n\'avez pas les droits pour ajouter des fichiers à cette étape');
//       e.target.value = '';
//       return;
//     }

//     // Si on est en mode validation (ex: MG qui valide), on stocke les fichiers sans les envoyer
//     if (isInValidationMode) {
//       const validFiles = [];

//       for (const file of files) {
//         // Validation taille
//         if (file.size > 10 * 1024 * 1024) {
//           toast.error(`${file.name} trop volumineux (max 10MB)`);
//           continue;
//         }

//         // Validation format
//         const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
//         if (!allowedTypes.includes(file.type)) {
//           toast.error(`Format non supporté: ${file.name}`);
//           continue;
//         }

//         // Validation supplémentaire: vérifier que le fichier n'est pas vide
//         if (file.size === 0) {
//           toast.error(`${file.name} est vide`);
//           continue;
//         }

//         // CORRECTION : Créer une copie stable du fichier avec toutes ses données
//         const fileData = {
//           id: Date.now() + Math.random(), // ID temporaire unique
//           file: file, // Référence directe au File object
//           name: file.name, // Stocker le nom séparément
//           description: file.name,
//           size: file.size,
//           type: file.type,
//           lastModified: file.lastModified,
//           isPending: true
//         };

//         // Vérification supplémentaire que le fichier est valide
//         console.log('Adding pending file:', {
//           name: fileData.name,
//           size: fileData.size,
//           type: fileData.type,
//           actualFileSize: file.size,
//           fileInstance: file instanceof File
//         });

//         validFiles.push(fileData);
//       }

//       if (validFiles.length > 0) {
//         const updatedFiles = [...currentPendingFiles, ...validFiles];
//         setLocalPendingFiles(updatedFiles);

//         // Notifier le parent si une fonction de callback est fournie
//         if (onFilesChange) {
//           onFilesChange(updatedFiles);
//         }

//         toast.success(`${validFiles.length} fichier(s) ajouté(s) (seront envoyés à la validation)`);
//       }

//       // IMPORTANT: Ne pas vider l'input immédiatement pour éviter de perdre les références
//       // Attendre un peu pour que les références soient bien établies
//       setTimeout(() => {
//         e.target.value = '';
//       }, 100);

//       return;
//     }

//     // Mode normal : upload immédiat
//     if (!requestId) {
//       toast.error('Impossible d\'ajouter des fichiers sans ID de demande');
//       return;
//     }

//     setIsUploading(true);

//     try {
//       for (const file of files) {
//         // Validation taille
//         if (file.size > 10 * 1024 * 1024) {
//           toast.error(`${file.name} trop volumineux (max 10MB)`);
//           continue;
//         }

//         // Validation format
//         const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
//         if (!allowedTypes.includes(file.type)) {
//           toast.error(`Format non supporté: ${file.name}`);
//           continue;
//         }

//         // Validation supplémentaire: vérifier que le fichier n'est pas vide
//         if (file.size === 0) {
//           toast.error(`${file.name} est vide`);
//           continue;
//         }

//         const uploadData = {
//           request: requestId,
//           file: file,
//           file_type: 'other',
//           description: file.name
//         };

//         console.log('Uploading file:', {
//           name: file.name,
//           size: file.size,
//           type: file.type,
//           lastModified: file.lastModified
//         });

//         const response = await attachmentsAPI.uploadAttachment(uploadData);
//         setAttachments(prev => [...prev, response.data]);
//       }

//       toast.success('Fichier(s) ajouté(s)');
//     } catch (error) {
//       console.error('Erreur upload:', error);
//       toast.error(`Erreur lors de l'upload: ${error.response?.data?.error || error.message}`);
//     } finally {
//       setIsUploading(false);
//       e.target.value = '';
//     }
//   };

//   const removePendingFile = (fileId) => {
//     // Vérifier si l'utilisateur peut supprimer des fichiers
//     if (!canUserUpload()) {
//       toast.error('Vous n\'avez pas les droits pour supprimer des fichiers à cette étape');
//       return;
//     }

//     const updatedFiles = currentPendingFiles.filter(f => f.id !== fileId);
//     setLocalPendingFiles(updatedFiles);

//     if (onFilesChange) {
//       onFilesChange(updatedFiles);
//     }
//   };

//   const deleteAttachment = async (attachmentId) => {
//     const attachment = attachments.find(att => att.id === attachmentId);
//     if (!attachment) return;

//     // Vérifier si l'utilisateur peut supprimer ce fichier
//     if (!canUserDeleteFile(attachment)) {
//       toast.error('Vous n\'avez pas les droits pour supprimer ce fichier');
//       return;
//     }

//     if (!window.confirm('Supprimer cette pièce jointe ?')) return;

//     try {
//       await attachmentsAPI.deleteAttachment(attachmentId);
//       setAttachments(prev => prev.filter(att => att.id !== attachmentId));
//       toast.success('Pièce jointe supprimée');
//     } catch (error) {
//       console.error('Erreur suppression:', error);
//       toast.error('Erreur lors de la suppression');
//     }
//   };

//   const getFileIcon = (fileName) => {
//     if (!fileName) return <File className="w-5 h-5 text-gray-500" />;

//     const ext = fileName.split('.').pop()?.toLowerCase();
//     if (['jpg', 'jpeg', 'png'].includes(ext)) {
//       return <Image className="w-5 h-5 text-green-500" />;
//     }
//     if (ext === 'pdf') {
//       return <FileText className="w-5 h-5 text-red-500" />;
//     }
//     return <File className="w-5 h-5 text-gray-500" />;
//   };

//   const formatFileSize = (sizeInMB) => {
//     if (!sizeInMB) return '';
//     if (sizeInMB < 1) {
//       return `${Math.round(sizeInMB * 1024)} KB`;
//     }
//     return `${sizeInMB.toFixed(1)} MB`;
//   };

//   const formatFileSizeBytes = (sizeInBytes) => {
//     if (!sizeInBytes) return '';
//     const sizeInMB = sizeInBytes / (1024 * 1024);
//     return formatFileSize(sizeInMB);
//   };

//   const totalFiles = attachments.length + currentPendingFiles.length;

//   // Déterminer le message d'information à afficher
//   const getInfoMessage = () => {
//     if (isInValidationMode && user?.role === 'mg') {
//       return {
//         type: 'orange',
//         icon: Clock,
//         message: 'Les fichiers ajoutés seront envoyés au moment de la validation de la demande.'
//       };
//     }

//     if (user?.role === 'mg' && canUserUpload() && !isInValidationMode) {
//       return {
//         type: 'blue',
//         icon: AlertCircle,
//         message: 'Vous pouvez ajouter des devis et factures pour valider cette demande.'
//       };
//     }

//     if (['accounting', 'director'].includes(user?.role) && ['mg_approved', 'accounting_reviewed'].includes(requestStatus)) {
//       return {
//         type: 'gray',
//         icon: AlertCircle,
//         message: 'Vous pouvez consulter et télécharger les pièces jointes, mais pas en ajouter ou supprimer.'
//       };
//     }

//     return null;
//   };

//   const infoMessage = getInfoMessage();

//   return (
//     <div className="bg-white rounded-lg shadow p-6">
//       <div className="flex items-center justify-between mb-4">
//         <h3 className="text-lg font-medium text-gray-900">
//           Pièces jointes ({totalFiles})
//           {currentPendingFiles.length > 0 && (
//             <span className="ml-2 text-sm text-orange-600">
//               ({currentPendingFiles.length} en attente)
//             </span>
//           )}
//         </h3>
//         {canUserUpload() && (
//           <label className="cursor-pointer inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
//             <Upload className="w-4 h-4 mr-2" />
//             Ajouter un fichier
//             <input
//               type="file"
//               multiple
//               accept=".pdf,.jpg,.jpeg,.png"
//               onChange={handleFileUpload}
//               className="hidden"
//               disabled={isUploading}
//             />
//           </label>
//         )}
//       </div>

//       {/* Message info selon le mode et le rôle */}
//       {infoMessage && (
//         <div className={`border rounded-md p-3 mb-4 ${
//           infoMessage.type === 'orange' ? 'bg-orange-50 border-orange-200' :
//           infoMessage.type === 'blue' ? 'bg-blue-50 border-blue-200' :
//           'bg-gray-50 border-gray-200'
//         }`}>
//           <div className="flex">
//             <infoMessage.icon className={`h-4 w-4 flex-shrink-0 mt-0.5 ${
//               infoMessage.type === 'orange' ? 'text-orange-400' :
//               infoMessage.type === 'blue' ? 'text-blue-400' :
//               'text-gray-400'
//             }`} />
//             <div className={`ml-2 text-sm ${
//               infoMessage.type === 'orange' ? 'text-orange-700' :
//               infoMessage.type === 'blue' ? 'text-blue-700' :
//               'text-gray-700'
//             }`}>
//               {infoMessage.message}
//             </div>
//           </div>
//         </div>
//       )}

//       {/* État de chargement */}
//       {isUploading && (
//         <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
//           <div className="flex items-center">
//             <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
//             <span className="text-sm text-blue-700">Upload en cours...</span>
//           </div>
//         </div>
//       )}

//       {/* Liste des pièces jointes */}
//       <div className="space-y-3">
//         {totalFiles === 0 ? (
//           <div className="text-center py-8 text-gray-500">
//             <File className="w-12 h-12 mx-auto mb-2 text-gray-300" />
//             <p className="text-sm">Aucune pièce jointe</p>
//           </div>
//         ) : (
//           <>
//             {/* Pièces jointes existantes */}
//             {attachments.map((attachment) => (
//               <div
//                 key={attachment.id}
//                 className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
//               >
//                 <div className="flex items-center space-x-3 flex-1">
//                   {getFileIcon(attachment.description)}

//                   <div className="flex-1 min-w-0">
//                     <p className="text-sm font-medium text-gray-900 truncate">
//                       {attachment.description || 'Fichier'}
//                     </p>

//                     <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
//                       {attachment.file_size_mb && (
//                         <span>{formatFileSize(attachment.file_size_mb)}</span>
//                       )}
//                       {attachment.uploaded_by_name && (
//                         <span>Par {attachment.uploaded_by_name}</span>
//                       )}
//                       {attachment.created_at && (
//                         <span>{new Date(attachment.created_at).toLocaleDateString('fr-FR')}</span>
//                       )}
//                     </div>
//                   </div>
//                 </div>

//                 <div className="flex items-center space-x-2">
//                   {attachment.file && (
//                     <>
//                       <a
//                         href={attachment.file}
//                         target="_blank"
//                         rel="noopener noreferrer"
//                         className="p-1 text-gray-400 hover:text-blue-600"
//                         title="Voir"
//                       >
//                         <Eye className="w-4 h-4" />
//                       </a>

//                       <a
//                         href={attachment.file}
//                         download
//                         className="p-1 text-gray-400 hover:text-green-600"
//                         title="Télécharger"
//                       >
//                         <Download className="w-4 h-4" />
//                       </a>
//                     </>
//                   )}

//                   {canUserDeleteFile(attachment) && (
//                     <button
//                       onClick={() => deleteAttachment(attachment.id)}
//                       className="p-1 text-gray-400 hover:text-red-600"
//                       title="Supprimer"
//                     >
//                       <X className="w-4 h-4" />
//                     </button>
//                   )}
//                 </div>
//               </div>
//             ))}

//             {/* Fichiers en attente */}
//             {currentPendingFiles.map((pendingFile) => (
//               <div
//                 key={pendingFile.id}
//                 className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200"
//               >
//                 <div className="flex items-center space-x-3 flex-1">
//                   {getFileIcon(pendingFile.description)}

//                   <div className="flex-1 min-w-0">
//                     <p className="text-sm font-medium text-gray-900 truncate">
//                       {pendingFile.description}
//                     </p>

//                     <div className="flex items-center space-x-4 mt-1 text-xs text-orange-600">
//                       <span>{formatFileSizeBytes(pendingFile.size)}</span>
//                       <span className="flex items-center">
//                         <Clock className="w-3 h-3 mr-1" />
//                         En attente d'envoi
//                       </span>
//                     </div>
//                   </div>
//                 </div>

//                 <div className="flex items-center space-x-2">
//                   {canUserUpload() && (
//                     <button
//                       onClick={() => removePendingFile(pendingFile.id)}
//                       className="p-1 text-orange-400 hover:text-red-600"
//                       title="Retirer"
//                     >
//                       <X className="w-4 h-4" />
//                     </button>
//                   )}
//                 </div>
//               </div>
//             ))}
//           </>
//         )}
//       </div>

//       {/* Info formats acceptés */}
//       {canUserUpload() && (
//         <p className="mt-3 text-xs text-gray-500">
//           Formats acceptés : PDF, JPG, PNG - Taille max : 10MB par fichier
//         </p>
//       )}
//     </div>
//   );
// };

// export default AttachmentsManager;

import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { attachmentsAPI } from "../../services/apis";
import { useAuth } from "../../context/AuthContext";
import {
  Upload,
  X,
  Download,
  Eye,
  AlertCircle,
  FileText,
  Image,
  File,
  Clock,
} from "lucide-react";

const AttachmentsManager = ({
  requestId,
  initialAttachments = [],
  canUpload = true,
  canDelete = true,
  // Nouveaux props pour gérer la validation différée
  isInValidationMode = false,
  pendingFiles = [],
  onFilesChange = null,
  // NOUVEAU: props pour contrôler les permissions selon le statut de la demande
  requestStatus = "pending",
  requestUserId = null,
}) => {
  const { user } = useAuth();
  const [attachments, setAttachments] = useState(initialAttachments);
  const [localPendingFiles, setLocalPendingFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (requestId && requestId !== null) {
      fetchAttachments();
    } else {
      setAttachments(initialAttachments);
    }
  }, [requestId, initialAttachments]);

  // Utiliser les fichiers en attente passés en props ou l'état local
  const currentPendingFiles =
    pendingFiles.length > 0 ? pendingFiles : localPendingFiles;

  const fetchAttachments = async () => {
    try {
      const response = await attachmentsAPI.getAttachments(requestId);
      setAttachments(response.data);
    } catch (error) {
      // console.error("Erreur chargement pièces jointes:", error);
    }
  };

  // NOUVELLE FONCTION: Déterminer si l'utilisateur peut ajouter des fichiers
  const canUserUpload = () => {
    if (!canUpload) return false;

    // En mode création, le MG peut toujours ajouter
    if (requestStatus === "creating" && user?.role === "mg") {
      return true;
    }

    // Le créateur de la demande peut toujours ajouter (sauf si rejetée ou approuvée)
    if (
      requestUserId === user?.id &&
      !["rejected", "director_approved"].includes(requestStatus)
    ) {
      return true;
    }

    // Seul le MG peut ajouter des fichiers lors de la validation
    if (user?.role === "mg" && requestStatus === "pending") {
      return true;
    }

    // Les autres rôles (comptabilité, direction) ne peuvent PAS ajouter de fichiers
    // même s'ils ont les droits de validation
    return false;
  };

  // NOUVELLE FONCTION: Déterminer si l'utilisateur peut supprimer un fichier
  const canUserDeleteFile = (attachment) => {
    if (!canDelete) return false;

    // En mode création, le MG peut toujours supprimer
    if (requestStatus === "creating" && user?.role === "mg") {
      return true;
    }

    // Le créateur de la demande peut supprimer ses propres fichiers (sauf si approuvée/rejetée)
    if (
      requestUserId === user?.id &&
      attachment.uploaded_by === user?.id &&
      !["rejected", "director_approved"].includes(requestStatus)
    ) {
      return true;
    }

    // Seul le MG peut supprimer des fichiers lors de la validation
    if (user?.role === "mg" && requestStatus === "pending") {
      return true;
    }

    // Les autres rôles (comptabilité, direction) ne peuvent PAS supprimer de fichiers
    return false;
  };

  // Fonction utilitaire pour vérifier si un objet est un File
  const isFileObject = (obj) => {
    return (
      obj &&
      typeof obj === "object" &&
      obj.constructor &&
      obj.constructor.name === "File" &&
      typeof obj.size === "number" &&
      typeof obj.name === "string"
    );
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Vérifier si l'utilisateur peut ajouter des fichiers
    if (!canUserUpload()) {
      toast.error(
        "Vous n'avez pas les droits pour ajouter des fichiers à cette étape"
      );
      e.target.value = "";
      return;
    }

    // Si on est en mode validation (ex: MG qui valide) ou création, on stocke les fichiers sans les envoyer
    if (isInValidationMode || requestStatus === "creating") {
      const validFiles = [];

      for (const file of files) {
        // Validation taille
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`${file.name} trop volumineux (max 10MB)`);
          continue;
        }

        // Validation format
        const allowedTypes = [
          "application/pdf",
          "image/jpeg",
          "image/png",
          "image/jpg",
        ];
        if (!allowedTypes.includes(file.type)) {
          toast.error(`Format non supporté: ${file.name}`);
          continue;
        }

        // Validation supplémentaire: vérifier que le fichier n'est pas vide
        if (file.size === 0) {
          toast.error(`${file.name} est vide`);
          continue;
        }

        // CORRECTION : Créer une copie stable du fichier avec toutes ses données
        const fileData = {
          id: Date.now() + Math.random(), // ID temporaire unique
          file: file, // Référence directe au File object
          name: file.name, // Stocker le nom séparément
          description: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified,
          isPending: true,
        };

        // Vérification supplémentaire que le fichier est valide
        console.log("Adding pending file:", {
          name: fileData.name,
          size: fileData.size,
          type: fileData.type,
          actualFileSize: file.size,
          isFile: isFileObject(file),
        });

        validFiles.push(fileData);
      }

      if (validFiles.length > 0) {
        const updatedFiles = [...currentPendingFiles, ...validFiles];
        setLocalPendingFiles(updatedFiles);

        // Notifier le parent si une fonction de callback est fournie
        if (onFilesChange) {
          onFilesChange(updatedFiles);
        }

        toast.success(
          `${validFiles.length} fichier(s) ajouté(s) (seront envoyés à la validation)`
        );
      }

      // IMPORTANT: Ne pas vider l'input immédiatement pour éviter de perdre les références
      // Attendre un peu pour que les références soient bien établies
      setTimeout(() => {
        e.target.value = "";
      }, 100);

      return;
    }

    // Mode normal : upload immédiat
    if (!requestId) {
      toast.error("Impossible d'ajouter des fichiers sans ID de demande");
      return;
    }

    setIsUploading(true);

    try {
      for (const file of files) {
        // Validation taille
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`${file.name} trop volumineux (max 10MB)`);
          continue;
        }

        // Validation format
        const allowedTypes = [
          "application/pdf",
          "image/jpeg",
          "image/png",
          "image/jpg",
        ];
        if (!allowedTypes.includes(file.type)) {
          toast.error(`Format non supporté: ${file.name}`);
          continue;
        }

        // Validation supplémentaire: vérifier que le fichier n'est pas vide
        if (file.size === 0) {
          toast.error(`${file.name} est vide`);
          continue;
        }

        const uploadData = {
          request: requestId,
          file: file,
          file_type: "other",
          description: file.name,
        };

        console.log("Uploading file:", {
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified,
        });

        const response = await attachmentsAPI.uploadAttachment(uploadData);
        setAttachments((prev) => [...prev, response.data]);
      }

      toast.success("Fichier(s) ajouté(s)");
    } catch (error) {
      // console.error("Erreur upload:", error);
      toast.error(
        `Erreur lors de l'upload: ${
          error.response?.data?.error || error.message
        }`
      );
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const removePendingFile = (fileId) => {
    // Vérifier si l'utilisateur peut supprimer des fichiers
    if (!canUserUpload()) {
      toast.error(
        "Vous n'avez pas les droits pour supprimer des fichiers à cette étape"
      );
      return;
    }

    const updatedFiles = currentPendingFiles.filter((f) => f.id !== fileId);
    setLocalPendingFiles(updatedFiles);

    if (onFilesChange) {
      onFilesChange(updatedFiles);
    }
  };

  const deleteAttachment = async (attachmentId) => {
    const attachment = attachments.find((att) => att.id === attachmentId);
    if (!attachment) return;

    // Vérifier si l'utilisateur peut supprimer ce fichier
    if (!canUserDeleteFile(attachment)) {
      toast.error("Vous n'avez pas les droits pour supprimer ce fichier");
      return;
    }

    if (!window.confirm("Supprimer cette pièce jointe ?")) return;

    try {
      await attachmentsAPI.deleteAttachment(attachmentId);
      setAttachments((prev) => prev.filter((att) => att.id !== attachmentId));
      toast.success("Pièce jointe supprimée");
    } catch (error) {
      // console.error("Erreur suppression:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const getFileIcon = (fileName) => {
    if (!fileName) return <File className="w-5 h-5 text-gray-500" />;

    const ext = fileName.split(".").pop()?.toLowerCase();
    if (["jpg", "jpeg", "png"].includes(ext)) {
      return <Image className="w-5 h-5 text-green-500" />;
    }
    if (ext === "pdf") {
      return <FileText className="w-5 h-5 text-red-500" />;
    }
    return <File className="w-5 h-5 text-gray-500" />;
  };

  const formatFileSize = (sizeInMB) => {
    if (!sizeInMB) return "";
    if (sizeInMB < 1) {
      return `${Math.round(sizeInMB * 1024)} KB`;
    }
    return `${sizeInMB.toFixed(1)} MB`;
  };

  const formatFileSizeBytes = (sizeInBytes) => {
    if (!sizeInBytes) return "";
    const sizeInMB = sizeInBytes / (1024 * 1024);
    return formatFileSize(sizeInMB);
  };

  const totalFiles = attachments.length + currentPendingFiles.length;

  // Déterminer le message d'information à afficher
  const getInfoMessage = () => {
    if (requestStatus === "creating" && user?.role === "mg") {
      return {
        type: "blue",
        icon: AlertCircle,
        message:
          "Ajoutez des devis et factures qui seront inclus avec votre demande.",
      };
    }

    if (isInValidationMode && user?.role === "mg") {
      return {
        type: "orange",
        icon: Clock,
        message:
          "Les fichiers ajoutés seront envoyés au moment de la validation de la demande.",
      };
    }

    if (user?.role === "mg" && canUserUpload() && !isInValidationMode) {
      return {
        type: "blue",
        icon: AlertCircle,
        message:
          "Vous pouvez ajouter des devis et factures pour valider cette demande.",
      };
    }

    if (
      ["accounting", "director"].includes(user?.role) &&
      ["mg_approved", "accounting_reviewed"].includes(requestStatus)
    ) {
      return {
        type: "gray",
        icon: AlertCircle,
        message:
          "Vous pouvez consulter et télécharger les pièces jointes, mais pas en ajouter ou supprimer.",
      };
    }

    return null;
  };

  const infoMessage = getInfoMessage();

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">
          Pièces jointes ({totalFiles})
          {currentPendingFiles.length > 0 && (
            <span className="ml-2 text-sm text-orange-600">
              ({currentPendingFiles.length} en attente)
            </span>
          )}
        </h3>
        {canUserUpload() && (
          <label className="cursor-pointer inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            <Upload className="w-4 h-4 mr-2" />
            Ajouter un fichier
            <input
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileUpload}
              className="hidden"
              disabled={isUploading}
            />
          </label>
        )}
      </div>

      {/* Message info selon le mode et le rôle */}
      {infoMessage && (
        <div
          className={`border rounded-md p-3 mb-4 ${
            infoMessage.type === "orange"
              ? "bg-orange-50 border-orange-200"
              : infoMessage.type === "blue"
              ? "bg-blue-50 border-blue-200"
              : "bg-gray-50 border-gray-200"
          }`}
        >
          <div className="flex">
            <infoMessage.icon
              className={`h-4 w-4 flex-shrink-0 mt-0.5 ${
                infoMessage.type === "orange"
                  ? "text-orange-400"
                  : infoMessage.type === "blue"
                  ? "text-blue-400"
                  : "text-gray-400"
              }`}
            />
            <div
              className={`ml-2 text-sm ${
                infoMessage.type === "orange"
                  ? "text-orange-700"
                  : infoMessage.type === "blue"
                  ? "text-blue-700"
                  : "text-gray-700"
              }`}
            >
              {infoMessage.message}
            </div>
          </div>
        </div>
      )}

      {/* État de chargement */}
      {isUploading && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            <span className="text-sm text-blue-700">Upload en cours...</span>
          </div>
        </div>
      )}

      {/* Liste des pièces jointes */}
      <div className="space-y-3">
        {totalFiles === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <File className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">Aucune pièce jointe</p>
          </div>
        ) : (
          <>
            {/* Pièces jointes existantes */}
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
              >
                <div className="flex items-center space-x-3 flex-1">
                  {getFileIcon(attachment.description)}

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {attachment.description || "Fichier"}
                    </p>

                    <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                      {attachment.file_size_mb && (
                        <span>{formatFileSize(attachment.file_size_mb)}</span>
                      )}
                      {attachment.uploaded_by_name && (
                        <span>Par {attachment.uploaded_by_name}</span>
                      )}
                      {attachment.created_at && (
                        <span>
                          {new Date(attachment.created_at).toLocaleDateString(
                            "fr-FR"
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {attachment.file_url && (
                    <>
                      <a
                        href={attachment.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer"
                        title="Voir"
                      >
                        <Eye className="w-4 h-4" />
                      </a>

                      <a
                        href={attachment.file_url}
                        download
                        className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer"
                        title="Télécharger"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    </>
                  )}

                  {canUserDeleteFile(attachment) && (
                    <button
                      onClick={() => deleteAttachment(attachment.id)}
                      className="p-1 text-gray-400 hover:text-red-600"
                      title="Supprimer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* Fichiers en attente */}
            {currentPendingFiles.map((pendingFile) => (
              <div
                key={pendingFile.id}
                className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200"
              >
                <div className="flex items-center space-x-3 flex-1">
                  {getFileIcon(pendingFile.description)}

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {pendingFile.description}
                    </p>

                    <div className="flex items-center space-x-4 mt-1 text-xs text-orange-600">
                      <span>{formatFileSizeBytes(pendingFile.size)}</span>
                      <span className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {requestStatus === "creating"
                          ? "Sera ajouté à la création"
                          : "En attente d'envoi"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {canUserUpload() && (
                    <button
                      onClick={() => removePendingFile(pendingFile.id)}
                      className="p-1 text-orange-400 hover:text-red-600"
                      title="Retirer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Info formats acceptés */}
      {canUserUpload() && (
        <p className="mt-3 text-xs text-gray-500">
          Formats acceptés : PDF, JPG, PNG - Taille max : 10MB par fichier
        </p>
      )}
    </div>
  );
};

export default AttachmentsManager;
