/**
 * ManifestWriter — helper côté client pour générer / mettre à jour des
 * AssetManifest conformes avant de les pousser au backend TROXT.
 *
 * Le backend (engine-lab/server/) applique ensuite ses propres règles de
 * validation et persiste sur disque.
 */

import type {
  AssetManifest,
  AssetStatus,
} from '@contracts/AssetManifest';
import { createEmptyManifest } from '@contracts/AssetManifest';
import type { ReconstructionMode } from '@contracts/ReconstructionMode';
import type { SubjectType } from '@contracts/SubjectType';
import { troxt } from './client';

export class ManifestWriter {
  /**
   * Crée un nouveau manifest vide.
   */
  static create(
    id: string,
    filename: string,
    mode: ReconstructionMode,
    subject: SubjectType,
  ): AssetManifest {
    return createEmptyManifest(id, filename, mode, subject);
  }

  /**
   * Met à jour le statut et ajoute une entrée d'historique.
   */
  static transition(
    manifest: AssetManifest,
    to: AssetStatus,
    actor: string,
    note?: string,
  ): AssetManifest {
    return {
      ...manifest,
      status: to,
      updatedAt: Date.now(),
      version: manifest.version + 1,
      history: [
        ...manifest.history,
        { at: Date.now(), from: manifest.status, to, actor, note },
      ],
    };
  }

  /**
   * Renseigne la géométrie après génération.
   */
  static setGeometry(
    manifest: AssetManifest,
    geom: Partial<AssetManifest['geometry']>,
  ): AssetManifest {
    return {
      ...manifest,
      geometry: { ...manifest.geometry, ...geom },
      updatedAt: Date.now(),
    };
  }

  /**
   * Renseigne les textures après génération.
   */
  static setTextures(
    manifest: AssetManifest,
    tex: Partial<AssetManifest['textures']>,
  ): AssetManifest {
    return {
      ...manifest,
      textures: { ...manifest.textures, ...tex },
      updatedAt: Date.now(),
    };
  }

  /**
   * Renseigne les métadonnées de jeu.
   */
  static setGame(
    manifest: AssetManifest,
    game: Partial<AssetManifest['game']>,
  ): AssetManifest {
    return {
      ...manifest,
      game: { ...manifest.game, ...game },
      updatedAt: Date.now(),
    };
  }

  /**
   * Pousse le manifest sur le backend TROXT.
   */
  static async push(manifest: AssetManifest): Promise<void> {
    await troxt.put(`/troxt/manifests/${encodeURIComponent(manifest.id)}`, manifest);
  }
}
