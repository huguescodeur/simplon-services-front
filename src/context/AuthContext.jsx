import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { authAPI } from "../services/apis";

const AuthContext = createContext();

const authReducer = (state, action) => {
  switch (action.type) {
    case "LOGIN_START":
      return { ...state, loading: true, error: null };
    case "LOGIN_SUCCESS":
      return {
        ...state,
        loading: false,
        isAuthenticated: true,
        user: action.payload,
        error: null,
      };
    case "LOGIN_ERROR":
      return {
        ...state,
        loading: false,
        isAuthenticated: false,
        user: null,
        error: action.payload,
      };
    case "LOGOUT":
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        loading: false,
        error: null,
      };
    case "SET_USER":
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        loading: false,
      };
    case "UPDATE_USER":
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      };
    case "INIT_START":
      return { ...state, loading: true };
    case "INIT_COMPLETE":
      return { ...state, loading: false };
    case "AUTH_ERROR":
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        loading: false,
        error: null,
      };
    default:
      return state;
  }
};

const initialState = {
  isAuthenticated: false,
  user: null,
  loading: true,
  error: null,
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const initRef = useRef(false);

  const getCurrentUser = useCallback(async () => {
    try {
      const response = await authAPI.getCurrentUser();
      dispatch({ type: "SET_USER", payload: response.data });
      return response.data;
    } catch (error) {
      // console.error("Erreur getCurrentUser:", error);
      dispatch({ type: "AUTH_ERROR" });
      throw error;
    }
  }, []);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    let mounted = true;

    const checkAuth = async () => {
      if (!mounted) return;

      dispatch({ type: "INIT_START" });

      try {
        await getCurrentUser();
      } catch (error) {
        // console.log("Utilisateur non connecté:", error.message);
        dispatch({ type: "AUTH_ERROR" });
      } finally {
        if (mounted) {
          dispatch({ type: "INIT_COMPLETE" });
        }
      }
    };

    checkAuth();

    return () => {
      mounted = false;
    };
  }, [getCurrentUser]);

  const login = async (credentials) => {
    dispatch({ type: "LOGIN_START" });
    try {
      const response = await authAPI.login(credentials);

      // console.log("=== APRÈS LOGIN ===");
      // console.log("Response:", response.data);
      // console.log("Cookies après login:", document.cookie);
      // console.log("===================");

      // Attendre un court délai pour que les cookies soient bien définis
      await new Promise((resolve) => setTimeout(resolve, 100));

      try {
        const userData = await authAPI.getCurrentUser();
        // console.log("✓ getCurrentUser réussie:", userData.data);

        // Dispatch du succès - cela déclenchera automatiquement la redirection
        dispatch({ type: "LOGIN_SUCCESS", payload: userData.data });

        return { success: true, message: response.data.message };
      } catch (authError) {
        // console.error("✗ getCurrentUser échouée:", authError);
        dispatch({
          type: "LOGIN_ERROR",
          payload: "Échec de l'authentification",
        });
        return { success: false, error: "Échec de l'authentification" };
      }
    } catch (error) {
      console.error("Erreur de login:", error);
      const errorMessage =
        error.response?.data?.detail ||
        error.response?.data?.error ||
        error.response?.data?.details ||
        "Erreur de connexion";
      dispatch({ type: "LOGIN_ERROR", payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  const logout = useCallback(async () => {
    // console.log("=== DÉBUT LOGOUT ===");

    try {
      await authAPI.logout();
      // console.log("✓ Logout API appelé avec succès");
    } catch (error) {
      // console.error("✗ Erreur lors de l'appel logout API:", error);
    } finally {
      dispatch({ type: "LOGOUT" });
      // console.log("✓ État local nettoyé");
      // console.log("=== FIN LOGOUT ===");
    }
  }, []);

  const updateUser = async (profileData) => {
    try {
      const response = await authAPI.updateProfile(state.user.id, profileData);
      dispatch({ type: "UPDATE_USER", payload: response.data });
      return { success: true, data: response.data };
    } catch (error) {
      // console.error("Erreur updateUser:", error);
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.email?.[0] ||
        error.response?.data?.username?.[0] ||
        "Erreur lors de la mise à jour du profil";
      return { success: false, error: errorMessage };
    }
  };

  const changePassword = async (passwordData) => {
    try {
      const response = await authAPI.changePassword(passwordData);
      return { success: true, message: response.data.message };
    } catch (error) {
      // console.error("Erreur changePassword:", error);
      const errorMessage =
        error.response?.data?.old_password?.[0] ||
        error.response?.data?.error ||
        error.response?.data?.detail ||
        "Erreur lors du changement de mot de passe";
      return { success: false, error: errorMessage };
    }
  };

  const isUserAuthenticated = () => {
    return state.isAuthenticated;
  };

  const value = {
    ...state,
    login,
    logout,
    getCurrentUser,
    updateUser,
    changePassword,
    isUserAuthenticated,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
