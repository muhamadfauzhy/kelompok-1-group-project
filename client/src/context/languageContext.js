import { createContext } from "react";

export const LanguageContext = createContext({
  language: "en",
  setLanguage: () => {},
  toggleLanguage: () => {},
  copy: {
    common: {
      hidden: "Hidden",
      directions: {
        in: "server -> client",
        out: "client -> server",
      },
    },
  },
  getPhaseLabel: (phase) => phase,
  getStatusLabel: (status) => status,
  getRoleLabel: (role) => role,
  getDirectionLabel: (direction) => direction,
});
