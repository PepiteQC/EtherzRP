// src/systems/admin/commands/teleport.cmd.ts

import { IAdminCommand, CommandResult } from "../types";
import * as THREE from "three";

export const teleportCommand: IAdminCommand = {
  verb: "tp",
  aliases: ["teleport"],
  description: "Téléporter un joueur vers des coordonnées ou vers un autre joueur",
  usage: "tp <joueur> <x> <y> <z>  OU  tp <joueur1> <joueur2>",
  minRole: "mod",

  async execute(args, executor, context): Promise<CommandResult> {
    if (args.length < 2) {
      return {
        success: false,
        message: "❌ Usage: tp <joueur> <x y z>  OU  tp <joueur1> <joueur2>",
        type: "error",
      };
    }

    const target = findPlayer(args[0], context.players);
    if (!target) {
      return {
        success: false,
        message: `❌ Joueur "${args[0]}" introuvable`,
        type: "error",
      };
    }

    let destination: { x: number; y: number; z: number };

    if (args.length === 4) {
      // tp joueur x y z
      destination = {
        x: parseFloat(args[1]),
        y: parseFloat(args[2]),
        z: parseFloat(args[3]),
      };
      if (isNaN(destination.x) || isNaN(destination.y) || isNaN(destination.z)) {
        return {
          success: false,
          message: "❌ Coordonnées invalides",
          type: "error",
        };
      }
    } else if (args.length === 2) {
      // tp joueur1 joueur2
      const dest = findPlayer(args[1], context.players);
      if (!dest) {
        return {
          success: false,
          message: `❌ Joueur destination "${args[1]}" introuvable`,
          type: "error",
        };
      }
      destination = dest.position;
    } else {
      return {
        success: false,
        message: "❌ Syntaxe incorrecte",
        type: "error",
      };
    }

    // Applique via Rapier + Socket
    context.socket.to(target.uid).emit("admin:teleport", {
      position: destination,
    });

    // Mise à jour locale Rapier (si côté serveur)
    if (target.rapierBody) {
      target.rapierBody.setTranslation(destination, true);
    }

    return {
      success: true,
      message: `✅ ${target.displayName} téléporté en (${destination.x.toFixed(1)}, ${destination.y.toFixed(1)}, ${destination.z.toFixed(1)})`,
      type: "success",
    };
  },
};