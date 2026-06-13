/**
 * src/systems/admin/index.ts
 * ----------------------------------------------------------------------------
 * Point d'entrée public du module Console Admin.
 * Réexporte l'ensemble des classes, hooks, composants, types et commandes.
 * ----------------------------------------------------------------------------
 */

// --- Permissions ---
export {
  PermissionSystem,
  PermissionLevel,
  AdminFlag,
} from "./permissions/PermissionSystem";
export type {
  Admin,
  ResolvedPermissions,
} from "./permissions/PermissionSystem";

// --- Parser ---
export {
  CommandParser,
  tokenize,
  CommandError,
  CommandNotFoundError,
  InsufficientPermissionsError,
  InvalidArgumentError,
  MissingArgumentError,
} from "./console/CommandParser";
export type {
  ArgType,
  ArgDefinition,
  Player,
  CommandContext,
  CommandResult,
  CommandHandler,
  CommandDefinition,
  ParsedCommand,
} from "./console/CommandParser";

// --- Logger ---
export { CommandLogger } from "./console/CommandLogger";
export type {
  CommandLog,
  LogFilter,
  LogStats,
  LogListener,
} from "./console/CommandLogger";

// --- Manager ---
export {
  AdminConsoleManager,
} from "./console/AdminConsoleManager";
export type {
  AdminConsoleConfig,
  ExecutionOutcome,
} from "./console/AdminConsoleManager";

// --- UI ---
export {
  AdminConsoleUI,
  useAdminConsole,
} from "./console/AdminConsoleUI";
export type {
  ConsoleLine,
  ConsoleLineType,
  CommandExecutor,
  UseAdminConsoleOptions,
  AdminConsoleUIProps,
} from "./console/AdminConsoleUI";

// --- Commandes ---
export {
  AllCommands,
} from "./commands/StandardCommands";

// --- Commandes avancées (régions, world-edit, économie+) ---
export {
  RegionSystem,
  EconomySystem,
  WorldEditManager,
  WorldEditSession,
  createAdvancedCommands,
} from "./commands/advanced/index";
export type {
  Region,
  RegionFlag,
  RegionState,
  Vec3,
  Account,
  Transaction,
  TxType,
  EconomyState,
  EconomyOptions,
  WorldAdapter,
  AdvancedSystems,
} from "./commands/advanced/index";

// --- Persistance (storage) ---
export {
  MemoryStorageAdapter,
} from "./storage/MemoryStorageAdapter";
export {
  FirestoreStorageAdapter,
} from "./storage/FirestoreStorageAdapter";
export {
  filterLogsInMemory,
  BACKUP_VERSION,
} from "./storage/StorageAdapter";
export type {
  StorageAdapter,
  StateSnapshot,
  FullBackup,
} from "./storage/StorageAdapter";
export type {
  FirestoreDb,
  FirestoreFns,
  FirestoreAdapterOptions,
} from "./storage/FirestoreStorageAdapter";

// --- Intégrations (Discord) ---
export {
  DiscordWebhook,
} from "./integrations/DiscordWebhook";
export type {
  DiscordWebhookOptions,
} from "./integrations/DiscordWebhook";

// --- Dashboard d'audit ---
export {
  AuditDashboard,
  useAuditData,
} from "./dashboard/AuditDashboard";
export type {
  AuditDashboardProps,
} from "./dashboard/AuditDashboard";

// --- Default export : le manager (entrée la plus courante) ---
import { AdminConsoleManager as _Manager } from "./console/AdminConsoleManager";
export default _Manager;
