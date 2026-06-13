import type { CityJob } from "../../../game/city/types/city.types";

export const CITY_JOBS: CityJob[] = [
  {
    id: "none",
    label: "Citoyen",
    description: "Aucun job actif.",
    salary: 0,
    enabled: true,
  },
  {
    id: "depanneur_clerk",
    label: "Employé dépanneur",
    description: "Gère la caisse, le stockage, les portes et les ventes.",
    salary: 125,
    enabled: true,
  },
  {
    id: "security",
    label: "Sécurité",
    description: "Surveille les bâtiments, alarmes et portes verrouillées.",
    salary: 160,
    enabled: true,
  },
  {
    id: "admin",
    label: "Admin",
    description: "Accès complet aux systèmes de ville.",
    salary: 0,
    enabled: true,
  },
];
