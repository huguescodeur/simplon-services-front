import React from "react";

const Footer = () => {
  return (
    <div className="text-center text-xs text-gray-500 mt-8 mb-4">
      <p>
        © {new Date().getFullYear()}{" "}
        <span className="text-red-600">Simplon</span> Côte d'Ivoire – Gestion
        Services
      </p>
    </div>
  );
};

export default Footer;
