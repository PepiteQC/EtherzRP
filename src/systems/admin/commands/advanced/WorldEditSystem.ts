/**
 * WorldEditSystem.ts
 * ----------------------------------------------------------------------------
 * World-edit basique : sélection (pos1/pos2), set, fill, copy, paste, undo.
 *
 * Le système ne touche pas directement au monde : il calcule les blocs à
 * modifier et délègue l'application à un WorldAdapter fourni par le jeu
 * (setBlock / getBlock). On garde un historique pour l'undo.
 * ----------------------------------------------------------------------------
 */

import { Vec3 } from "./RegionSystem";

/** Le jeu fournit cet adaptateur pour appliquer les changements. */
export interface WorldAdapter {
  setBlock(pos: Vec3, blockId: string): void;
  getBlock(pos: Vec3): string;
}

interface BlockChange {
  pos: Vec3;
  previous: string;
  next: string;
}

interface Clipboard {
  origin: Vec3;
  blocks: { offset: Vec3; blockId: string }[];
}

/** Limite de blocs par opération (sécurité anti-lag). */
const MAX_BLOCKS = 100_000;

export class WorldEditSession {
  private pos1?: Vec3;
  private pos2?: Vec3;
  private clipboard?: Clipboard;
  private undoStack: BlockChange[][] = [];

  constructor(
    private world: WorldAdapter,
    private maxBlocks = MAX_BLOCKS
  ) {}

  setPos1(p: Vec3): void {
    this.pos1 = { ...p };
  }
  setPos2(p: Vec3): void {
    this.pos2 = { ...p };
  }

  getSelection(): { min: Vec3; max: Vec3; volume: number } | undefined {
    if (!this.pos1 || !this.pos2) return undefined;
    const min = {
      x: Math.min(this.pos1.x, this.pos2.x),
      y: Math.min(this.pos1.y, this.pos2.y),
      z: Math.min(this.pos1.z, this.pos2.z),
    };
    const max = {
      x: Math.max(this.pos1.x, this.pos2.x),
      y: Math.max(this.pos1.y, this.pos2.y),
      z: Math.max(this.pos1.z, this.pos2.z),
    };
    const volume =
      (max.x - min.x + 1) * (max.y - min.y + 1) * (max.z - min.z + 1);
    return { min, max, volume };
  }

  private *iterate(min: Vec3, max: Vec3): Generator<Vec3> {
    for (let x = min.x; x <= max.x; x++)
      for (let y = min.y; y <= max.y; y++)
        for (let z = min.z; z <= max.z; z++) yield { x, y, z };
  }

  /** Remplit toute la sélection avec un bloc. */
  set(blockId: string): number {
    const sel = this.requireSelection();
    if (sel.volume > this.maxBlocks)
      throw new Error(`Sélection trop grande (${sel.volume} > ${this.maxBlocks}).`);

    const changes: BlockChange[] = [];
    for (const pos of this.iterate(sel.min, sel.max)) {
      const previous = this.world.getBlock(pos);
      if (previous === blockId) continue;
      this.world.setBlock(pos, blockId);
      changes.push({ pos, previous, next: blockId });
    }
    if (changes.length) this.undoStack.push(changes);
    return changes.length;
  }

  /** Remplace uniquement les blocs `fromBlock` par `toBlock`. */
  fill(fromBlock: string, toBlock: string): number {
    const sel = this.requireSelection();
    if (sel.volume > this.maxBlocks)
      throw new Error(`Sélection trop grande (${sel.volume} > ${this.maxBlocks}).`);

    const changes: BlockChange[] = [];
    for (const pos of this.iterate(sel.min, sel.max)) {
      const previous = this.world.getBlock(pos);
      if (previous !== fromBlock) continue;
      this.world.setBlock(pos, toBlock);
      changes.push({ pos, previous, next: toBlock });
    }
    if (changes.length) this.undoStack.push(changes);
    return changes.length;
  }

  /** Copie la sélection dans le presse-papier (origine = pos1). */
  copy(): number {
    const sel = this.requireSelection();
    if (sel.volume > this.maxBlocks)
      throw new Error(`Sélection trop grande (${sel.volume} > ${this.maxBlocks}).`);

    const origin = this.pos1!;
    const blocks: Clipboard["blocks"] = [];
    for (const pos of this.iterate(sel.min, sel.max)) {
      blocks.push({
        offset: { x: pos.x - origin.x, y: pos.y - origin.y, z: pos.z - origin.z },
        blockId: this.world.getBlock(pos),
      });
    }
    this.clipboard = { origin, blocks };
    return blocks.length;
  }

  /** Colle le presse-papier à une position d'ancrage. */
  paste(at: Vec3): number {
    if (!this.clipboard) throw new Error("Presse-papier vide. Utilisez copy d'abord.");
    const changes: BlockChange[] = [];
    for (const b of this.clipboard.blocks) {
      const pos = {
        x: at.x + b.offset.x,
        y: at.y + b.offset.y,
        z: at.z + b.offset.z,
      };
      const previous = this.world.getBlock(pos);
      if (previous === b.blockId) continue;
      this.world.setBlock(pos, b.blockId);
      changes.push({ pos, previous, next: b.blockId });
    }
    if (changes.length) this.undoStack.push(changes);
    return changes.length;
  }

  /** Annule la dernière opération. Retourne le nombre de blocs restaurés. */
  undo(): number {
    const last = this.undoStack.pop();
    if (!last) return 0;
    for (const c of last) this.world.setBlock(c.pos, c.previous);
    return last.length;
  }

  private requireSelection() {
    const sel = this.getSelection();
    if (!sel) throw new Error("Sélection incomplète : définissez pos1 et pos2.");
    return sel;
  }
}

/** Gère une session par joueur. */
export class WorldEditManager {
  private sessions = new Map<string, WorldEditSession>();

  constructor(
    private world: WorldAdapter,
    private maxBlocks = MAX_BLOCKS
  ) {}

  session(userId: string): WorldEditSession {
    let s = this.sessions.get(userId);
    if (!s) {
      s = new WorldEditSession(this.world, this.maxBlocks);
      this.sessions.set(userId, s);
    }
    return s;
  }

  setWorld(world: WorldAdapter): void {
    this.world = world;
  }
}

export default WorldEditManager;
