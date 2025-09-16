import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const PrivateRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (
    allowedRoles.length > 0 &&
    user?.role &&
    !allowedRoles.includes(user.role)
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Accès refusé
          </h2>
          <p className="text-gray-600 mb-4">
            Vous n'avez pas les permissions pour accéder à cette page.
          </p>
          <p className="text-sm text-gray-500">
            Rôle requis: {allowedRoles.join(", ")} | Votre rôle: {user.role}
          </p>
        </div>
      </div>
    );
  }

  return children;
};

export default PrivateRoute;
