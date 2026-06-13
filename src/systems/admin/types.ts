// src/systems/admin/types.ts

export interface EtherworldPlayer {
  uid: string;
  displayName: string;
  steamId?: string;
  position: { x: number; y: number; z: number };
  role: "admin" | "mod" | "staff" | "player";
  isBanned: boolean;
  isGagged: boolean;
  isGod: boolean;
  rapierBody?: any; // Référence au corps Rapier
}

export interface ParsedCommand {
  verb: string;
  args: string[];
  raw: string;
}

export interface CommandResult {
  success: boolean;
  message: string;
  type: "success" | "error" | "warning" | "info" | "system";
}

export interface IAdminCommand {
  verb: string;
  aliases?: string[];
  description: string;
  usage: string;
  minRole: "mod" | "admin" | "owner";
  execute: (
    args: string[],
    executor: EtherworldPlayer,
    context: CommandContext
  ) => Promise<CommandResult>;
}

export interface CommandContext {
  players: Map<string, EtherworldPlayer>;
  broadcast: (msg: string, type?: string) => void;
  socket: any; // WebSocket / Socket.io
  scene: any;  // Three.js Scene
  world: any;  // Rapier World
}

export type ConsoleLog = {
  id: string;
  timestamp: Date;
  message: string;
  type: "success" | "error" | "warning" | "info" | "system" | "input";
};