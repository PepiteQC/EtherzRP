/**
 * pois.ts — Points d'intérêt (80+). Beaucoup sont dérivés des services des
 * villages, complétés de POI panoramiques/standalone (belvédères, cascades,
 * phares, plages, etc.) répartis sur tout le territoire.
 */
import { POI, POI_ICONS, POICategory } from "../schema/WorldTypes";
import { VILLAGES } from "./villages";

let _n = 0;
function mk(
  name: string,
  category: POICategory,
  x: number,
  z: number,
  region: string,
  biome: POI["biome"],
  description: string,
  village?: string,
  interactive = true
): POI {
  return {
    id: `poi_${++_n}`,
    name,
    category,
    pos: { x, z },
    region,
    biome,
    village,
    description,
    interactive,
    icon: POI_ICONS[category],
  };
}

// --- POI dérivés des services de chaque village (positionnés autour du centre) --- //
const serviceLabels: Partial<Record<POICategory, string>> = {
  hopital: "Hôpital", police: "Poste de police", pompier: "Caserne", banque: "Banque",
  magasin: "Magasin général", garage: "Garage", station_service: "Station-service",
  restaurant: "Resto", hotel: "Hôtel", mairie: "Mairie", depanneur: "Dépanneur",
  ferme: "Ferme", marina: "Marina", quai: "Quai", phare: "Phare", plage: "Plage",
  camping: "Camping", chalet: "Chalets", montagne: "Mont", belvedere: "Belvédère",
  eglise: "Église", ecole: "École", usine: "Usine", parc: "Parc",
};

const derived: POI[] = [];
for (const v of VILLAGES) {
  let i = 0;
  for (const cat of v.services) {
    const angle = (i / Math.max(1, v.services.length)) * Math.PI * 2;
    const r = v.radius * 0.55;
    const x = Math.round(v.pos.x + Math.cos(angle) * r);
    const z = Math.round(v.pos.z + Math.sin(angle) * r);
    const label = serviceLabels[cat] ?? cat;
    derived.push(
      mk(`${label} de ${v.name}`, cat, x, z, v.region, v.biome,
        `${label} du village de ${v.name}.`, v.id, true)
    );
    i++;
  }
}

// --- POI panoramiques / standalone répartis sur la map --- //
const scenic: POI[] = [
  mk("Belvédère de l'Aigle", "belvedere", -100, -3900, "laurentides", "montagne",
     "Point de vue à 700 m : vue à 360° sur les lacs et le fleuve au loin."),
  mk("Cascade des Trois-Saults", "cascade", -1500, -1300, "portneuf", "lac",
     "Triple chute d'eau accessible par un sentier depuis la Route des Lacs."),
  mk("Belvédère du Cap", "belvedere", 3150, -1050, "charlevoix", "montagne",
     "Belvédère sur la 138, parfait pour les couchers de soleil sur le fleuve."),
  mk("Phare de la Pointe", "phare", 4040, -2960, "cote-nord", "fleuve",
     "Phare historique de 1887, fin de la 138. Petit musée maritime."),
  mk("Plage Dorée", "plage", 4120, -2430, "cote-nord", "plage",
     "2 km de sable doré, baignade surveillée l'été."),
  mk("Quai des Baleines", "quai", 3720, -2150, "cote-nord", "fleuve",
     "Départ des croisières d'observation des baleines."),
  mk("Sommet du Mont-Charlevoix", "montagne", 3320, -1560, "charlevoix", "montagne",
     "Télésiège menant au sommet (480 m), pistes de ski et de VTT."),
  mk("Lac Miroir", "lac", -1050, -2600, "portneuf", "lac",
     "Lac parfaitement calme, location de kayaks et de pédalos."),
  mk("Marais aux Hérons", "parc", -500, 1300, "capitale", "marais",
     "Réserve ornithologique avec passerelles sur pilotis."),
  mk("Cidrerie du Sud", "magasin", 2650, 470, "rive-sud", "agricole",
     "Cidrerie artisanale et autocueillette de pommes."),
  mk("Marché public de Saint-Labouré", "magasin", 1430, 1360, "rive-sud", "agricole",
     "Le plus grand marché fermier de la map, ouvert tous les samedis."),
  mk("Observatoire Nordique", "attraction", 350, -3580, "laurentides", "montagne",
     "Observatoire astronomique en altitude, soirées étoiles."),
  mk("Vieux Quai de Cap-aux-Pins", "quai", 3030, -1140, "charlevoix", "fleuve",
     "Quai de pêche et fumoir à hareng traditionnel."),
  mk("Aire de repos du Fleuve", "parc", 700, 900, "capitale", "fleuve",
     "Halte routière sur la 138 avec vue sur le fleuve et tables à pique-nique."),
  mk("Station-service Express 138", "station_service", -2500, 2150, "capitale", "village",
     "Station ouverte 24h sur la 138, dépanneur et café."),
  mk("Pourvoirie de l'Orignal", "magasin", -1830, -2420, "portneuf", "foret",
     "Permis de chasse, location d'équipement et chalets."),
  mk("Refuge d'altitude", "chalet", 250, -3750, "laurentides", "montagne",
     "Refuge de randonnée accessible à pied, poêle à bois et dortoir."),
  mk("Camping du Large", "camping", 4210, -2710, "cote-nord", "camping",
     "Emplacements face au fleuve, services complets."),
  mk("Belvédère des Lacs", "belvedere", -1650, -2200, "portneuf", "lac",
     "Vue plongeante sur la chaîne de lacs de Saint-Alban."),
  mk("Halte de la Route des Lacs", "parc", -1100, -500, "portneuf", "foret",
     "Aire panoramique avec sentier d'interprétation de la forêt."),
];

export const POIS: POI[] = [...derived, ...scenic];

export default POIS;
