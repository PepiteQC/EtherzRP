// src/systems/admin/CommandRegistry.ts

import { IAdminCommand } from "./types";
import { kickCommand }     from "./commands/kick.cmd";
import { banCommand }      from "./commands/ban.cmd";
import { teleportCommand } from "./commands/teleport.cmd";
import { godCommand }      from "./commands/god.cmd";
import { spawnCommand }    from "./commands/spawn.cmd";
import { helpCommand }     from "./commands/help.cmd";

class Registry {
  private map: Map<string, IAdminCommand> = new Map();

  register(cmd: IAdminCommand): void {
    this.map.set(cmd.verb, cmd);
    cmd.aliases?.forEach((alias) => this.map.set(alias, cmd));
  }

  get(verb: string): IAdminCommand | undefined {
    return this.map.get(verb.toLowerCase());
  }

  getAll(): IAdminCommand[] {
    // Déduplique (alias partagent la même ref)
    return [...new Set(this.map.values())];
  }
}

export const CommandRegistry = new Registry();

// ─── Auto-registration ────────────────────────────────────────────────────────
[
  helpCommand,
  kickCommand,
  banCommand,
  teleportCommand,
  godCommand,
  spawnCommand,
].forEach((cmd) => CommandRegistry.register(cmd));