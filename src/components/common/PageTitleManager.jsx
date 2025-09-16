import { useEffect } from "react";
import { useLocation, matchPath } from "react-router-dom";

const titles = [
  { path: "/", title: "Simplon Service" },
  { path: "/login", title: "Simplon Service - Connexion" },
  { path: "/requests", title: "Simplon Service - Demandes" },
  { path: "/requests/create", title: "Simplon Service - Nouvelle demande" },
  { path: "/requests/:id", title: "Simplon Service - Détail de la demande" },
  { path: "/validations", title: "Simplon Service - Validations" },
  { path: "/statistics", title: "Simplon Service - Statistiques" },
  { path: "/users", title: "Simplon Service - Utilisateurs" },
  { path: "/profile", title: "Simplon Service - Profil" },
];

const PageTitleManager = () => {
  const location = useLocation();

  useEffect(() => {
    let matched = titles.find(({ path }) =>
      matchPath({ path, end: true }, location.pathname)
    );

    document.title = matched ? matched.title : "Simplon Service";
  }, [location]);

  return null;
};

export default PageTitleManager;
