// src/systems/admin/commands/spawn.cmd.ts

import { IAdminCommand, CommandResult } from "../types";

const SPAWN_CATALOG: Record<string, { model: string; label: string }> = {
  voiture:   { model: "car_police",   label: "Voiture de Police" },
  moto:      { model: "moto_sport",   label: "Moto Sport"        },
  camion:    { model: "truck_01",     label: "Camion"            },
  helicop:   { model: "heli_01",      label: "Hélicoptère"       },
  coffre:    { model: "prop_coffre",  label: "Coffre au trésor"  },
  arme:      { model: "prop_arme",    label: "Arme"              },
};

export const spawnCommand: IAdminCommand = {
  verb: "spawn",
  aliases: ["s"],
  description: "Spawner un objet/véhicule en monde",
  usage: "spawn <objet> [joueur]",
  minRole: "admin",

  async execute(args, executor, context): Promise<CommandResult> {
    if (args.length < 1) {
      const list = Object.keys(SPAWN_CATALOG).join(", ");
      return {
        success: false,
        message: `❌ Usage: spawn <objet>\n📦 Disponibles: ${list}`,
        type: "error",
      };
    }

    const key = args[0].toLowerCase();
    const entry = SPAWN_CATALOG[key];

    if (!entry) {
      return {
        success: false,
        message: `❌ Objet "${key}" inconnu`,
        type: "error",
      };
    }

    const targetName = args[1] ?? executor.displayName;
    const target = findPlayer(targetName, context.players) ?? executor;

    // Spawn près du joueur
    const spawnPos = {
      x: target.position.x + 3,
      y: target.position.y,
      z: target.position.z,
    };

    // Envoie à tous les clients via broadcast
    context.socket.emit("world:spawn", {
      model: entry.model,
      position: spawnPos,
      spawnedBy: executor.displayName,
    });

    return {
      success: true,
      message: `✅ ${entry.label} spawné près de ${target.displayName}`,
      type: "success",
    };
  },
};