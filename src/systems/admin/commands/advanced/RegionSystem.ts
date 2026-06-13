/**
 * RegionSystem.ts
 * ----------------------------------------------------------------------------
 * Système de régions protégées (style WorldGuard léger).
 *
 *  - Définition de régions par bornes (cuboïdes)
 *  - Flags par région (build, pvp, enter, mob-spawn...)
 *  - Membres / propriétaires
 *  - Test d'appartenance d'un point + résolution de flag (priorité)
 *  - Sérialisable (pour persistance via StorageAdapter)
 * ----------------------------------------------------------------------------
 */

export type RegionFlag =
  | "build"
  | "pvp"
  | "enter"
  | "mob_spawn"
  | "fire_spread"
  | "explosions";

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface Region {
  id: string;
  name: string;
  min: Vec3;
  max: Vec3;
  /** Priorité : la plus haute gagne en cas de chevauchement. */
  priority: number;
  owners: string[];
  members: string[];
  /** Flags explicitement définis (true = autorisé). */
  flags: Partial<Record<RegionFlag, boolean>>;
  createdAt: number;
}

export interface RegionState {
  regions: Region[];
}

const DEFAULT_FLAGS: Record<RegionFlag, boolean> = {
  build: false, // par défaut une région protège : pas de build
  pvp: true,
  enter: true,
  mob_spawn: true,
  fire_spread: true,
  explosions: false,
};

function normalize(a: Vec3, b: Vec3): { min: Vec3; max: Vec3 } {
  return {
    min: { x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), z: Math.min(a.z, b.z) },
    max: { x: Math.max(a.x, b.x), y: Math.max(a.y, b.y), z: Math.max(a.z, b.z) },
  };
}

export class RegionSystem {
  private regions = new Map<string, Region>();

  /** Crée (ou écrase) une région. */
  define(
    id: string,
    name: string,
    a: Vec3,
    b: Vec3,
    options?: { priority?: number; owner?: string }
  ): Region {
    const { min, max } = normalize(a, b);
    const region: Region = {
      id,
      name,
      min,
      max,
      priority: options?.priority ?? 0,
      owners: options?.owner ? [options.owner] : [],
      members: [],
      flags: {},
      createdAt: Date.now(),
    };
    this.regions.set(id, region);
    return region;
  }

  remove(id: string): boolean {
    return this.regions.delete(id);
  }

  get(id: string): Region | undefined {
    return this.regions.get(id);
  }

  list(): Region[] {
    return Array.from(this.regions.values());
  }

  setFlag(id: string, flag: RegionFlag, value: boolean): boolean {
    const r = this.regions.get(id);
    if (!r) return false;
    r.flags[flag] = value;
    return true;
  }

  addMember(id: string, userId: string): boolean {
    const r = this.regions.get(id);
    if (!r) return false;
    if (!r.members.includes(userId)) r.members.push(userId);
    return true;
  }

  removeMember(id: string, userId: string): boolean {
    const r = this.regions.get(id);
    if (!r) return false;
    r.members = r.members.filter((m) => m !== userId);
    return true;
  }

  contains(region: Region, p: Vec3): boolean {
    return (
      p.x >= region.min.x && p.x <= region.max.x &&
      p.y >= region.min.y && p.y <= region.max.y &&
      p.z >= region.min.z && p.z <= region.max.z
    );
  }

  /** Régions contenant un point, triées par priorité décroissante. */
  regionsAt(p: Vec3): Region[] {
    return this.list()
      .filter((r) => this.contains(r, p))
      .sort((a, b) => b.priority - a.priority);
  }

  /**
   * Résout la valeur d'un flag à une position pour un utilisateur.
   * Les owners/membres outrepassent `build`.
   */
  resolveFlag(p: Vec3, flag: RegionFlag, userId?: string): boolean {
    const here = this.regionsAt(p);
    if (here.length === 0) return DEFAULT_FLAGS[flag]; // hors région : règles globales

    const top = here[0];
    if (
      flag === "build" &&
      userId &&
      (top.owners.includes(userId) || top.members.includes(userId))
    ) {
      return true; // membres peuvent build
    }
    if (top.flags[flag] !== undefined) return top.flags[flag]!;
    return DEFAULT_FLAGS[flag];
  }

  /** Vérifie si un utilisateur peut construire à une position. */
  canBuild(p: Vec3, userId: string): boolean {
    return this.resolveFlag(p, "build", userId);
  }

  // --- Sérialisation ------------------------------------------------------ //

  toState(): RegionState {
    return { regions: this.list().map((r) => ({ ...r, flags: { ...r.flags } })) };
  }

  loadState(state: RegionState): void {
    this.regions.clear();
    for (const r of state.regions ?? []) this.regions.set(r.id, r);
  }
}

export default RegionSystem;
