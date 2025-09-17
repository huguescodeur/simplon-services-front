import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";

const Profile = () => {
  const { user, updateUser, changePassword } = useAuth();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // État pour la modification du profil
  const [profileData, setProfileData] = useState({
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
    username: user?.username || "",
    email: user?.email || "",
    phone: user?.phone || "",
  });

  // État pour le changement de mot de passe
  const [passwordData, setPasswordData] = useState({
    old_password: "",
    new_password: "",
    confirm_password: "",
  });

  // Fonction pour modifier le profil - UTILISE L'API CENTRALISÉE
  const handleProfileUpdate = async (e) => {
    e.preventDefault();

    // Validation des champs requis
    if (
      !profileData.first_name.trim() ||
      !profileData.last_name.trim() ||
      !profileData.username.trim() ||
      !profileData.email.trim()
    ) {
      toast.error("Tous les champs marqués comme requis doivent être remplis");
      return;
    }

    // Validation de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(profileData.email)) {
      toast.error("Veuillez entrer un email valide");
      return;
    }

    setLoading(true);

    try {
      // UTILISE LA FONCTION CENTRALISÉE DE L'AUTH CONTEXT
      const result = await updateUser(profileData);

      if (result.success) {
        setIsEditingProfile(false);
        toast.success("Profil mis à jour avec succès !");
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Erreur de connexion. Veuillez réessayer.");
      console.error("Erreur de mise à jour du profil:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour changer le mot de passe - UTILISE L'API CENTRALISÉE
  const handlePasswordChange = async (e) => {
    e.preventDefault();

    // Validations
    if (!passwordData.old_password.trim()) {
      toast.error("Veuillez saisir votre mot de passe actuel");
      return;
    }

    if (!passwordData.new_password.trim()) {
      toast.error("Veuillez saisir un nouveau mot de passe");
      return;
    }

    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }

    if (passwordData.new_password.length < 8) {
      toast.error(
        "Le nouveau mot de passe doit contenir au moins 8 caractères"
      );
      return;
    }

    if (passwordData.old_password === passwordData.new_password) {
      toast.error("Le nouveau mot de passe doit être différent de l'ancien");
      return;
    }

    setLoading(true);

    try {
      // UTILISE LA FONCTION CENTRALISÉE DE L'AUTH CONTEXT
      const result = await changePassword({
        old_password: passwordData.old_password,
        new_password: passwordData.new_password,
      });

      if (result.success) {
        setIsChangingPassword(false);
        setPasswordData({
          old_password: "",
          new_password: "",
          confirm_password: "",
        });
        toast.success(result.message || "Mot de passe modifié avec succès !");
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Erreur de connexion. Veuillez réessayer.");
      // console.error("Erreur de changement de mot de passe:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingProfile(false);
    // Restaurer les données d'origine
    setProfileData({
      first_name: user?.first_name || "",
      last_name: user?.last_name || "",
      username: user?.username || "",
      email: user?.email || "",
      phone: user?.phone || "",
    });
  };

  const handleCancelPassword = () => {
    setIsChangingPassword(false);
    setPasswordData({
      old_password: "",
      new_password: "",
      confirm_password: "",
    });
  };

  // Fonction pour obtenir le libellé du rôle
  const getRoleDisplay = (role) => {
    const roles = {
      employee: "Employé",
      mg: "Moyens Généraux",
      accounting: "Comptabilité",
      director: "Direction",
    };
    return roles[role] || role;
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement de votre profil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mon profil</h1>
        <p className="text-gray-600">
          Gérez vos informations personnelles et votre sécurité
        </p>
      </div>

      {/* Informations personnelles */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-medium text-gray-900">
            Informations personnelles
          </h2>
          {!isEditingProfile && (
            <button
              onClick={() => setIsEditingProfile(true)}
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 cursor-pointer"
            >
              Modifier mes informations
            </button>
          )}
        </div>

        {isEditingProfile ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prénom <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={profileData.first_name}
                  onChange={(e) =>
                    setProfileData({
                      ...profileData,
                      first_name: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                  required
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={profileData.last_name}
                  onChange={(e) =>
                    setProfileData({
                      ...profileData,
                      last_name: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom d'utilisateur <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={profileData.username}
                onChange={(e) =>
                  setProfileData({ ...profileData, username: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={profileData.email}
                onChange={(e) =>
                  setProfileData({ ...profileData, email: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Téléphone
              </label>
              <input
                type="tel"
                value={profileData.phone}
                onChange={(e) =>
                  setProfileData({ ...profileData, phone: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                disabled={loading}
              />
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                onClick={handleProfileUpdate}
                disabled={loading}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 cursor-pointer"
              >
                {loading ? "Enregistrement..." : "Enregistrer"}
              </button>
              <button
                onClick={handleCancelEdit}
                disabled={loading}
                className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 cursor-pointer"
              >
                Annuler
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Prénom
              </label>
              <p className="text-sm text-gray-900 mt-1">
                {user.first_name || "Non renseigné"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Nom
              </label>
              <p className="text-sm text-gray-900 mt-1">
                {user.last_name || "Non renseigné"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Nom d'utilisateur
              </label>
              <p className="text-sm text-gray-900 mt-1">{user.username}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <p className="text-sm text-gray-900 mt-1">{user.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Téléphone
              </label>
              <p className="text-sm text-gray-900 mt-1">
                {user.phone || "Non renseigné"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Rôle
              </label>
              <p className="text-sm text-gray-900 mt-1">
                {getRoleDisplay(user.role)}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Département
              </label>
              <p className="text-sm text-gray-900 mt-1">
                {user.department || "Non renseigné"}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Changement de mot de passe */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-medium text-gray-900">Sécurité</h2>
          {!isChangingPassword && (
            <button
              onClick={() => setIsChangingPassword(true)}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 cursor-pointer"
            >
              Modifier mon mot de passe
            </button>
          )}
        </div>

        {isChangingPassword ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mot de passe actuel <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={passwordData.old_password}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    old_password: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                required
                disabled={loading}
                autoComplete="current-password"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nouveau mot de passe <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={passwordData.new_password}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    new_password: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                required
                minLength="8"
                disabled={loading}
                autoComplete="new-password"
              />
              <p className="text-xs text-gray-500 mt-1">
                Le mot de passe doit contenir au moins 8 caractères
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirmer le nouveau mot de passe{" "}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={passwordData.confirm_password}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    confirm_password: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                required
                disabled={loading}
                autoComplete="new-password"
              />
              {passwordData.confirm_password &&
                passwordData.new_password !== passwordData.confirm_password && (
                  <p className="text-xs text-red-500 mt-1">
                    Les mots de passe ne correspondent pas
                  </p>
                )}
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                onClick={handlePasswordChange}
                disabled={
                  loading ||
                  passwordData.new_password !== passwordData.confirm_password
                }
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 cursor-pointer"
              >
                {loading ? "Modification..." : "Modifier le mot de passe"}
              </button>
              <button
                onClick={handleCancelPassword}
                disabled={loading}
                className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 cursor-pointer"
              >
                Annuler
              </button>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-sm text-gray-600">
              Pour des raisons de sécurité, changez régulièrement votre mot de
              passe. Cliquez sur le bouton ci-dessus pour le modifier.
            </p>
            <div className="mt-3 text-xs text-gray-500">
              <p>Conseils pour un mot de passe sécurisé :</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Au moins 8 caractères</li>
                <li>Combinaison de lettres, chiffres et symboles</li>
                <li>Évitez les informations personnelles</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
