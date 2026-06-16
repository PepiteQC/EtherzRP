import { useEffect, useMemo, useRef, useState } from "react";
import { BuilderExport, EngineStats, PlatformObject } from "../types";

type CVar = {
  name: string;
  description: string;
  value: number;
  minVal: number;
  maxVal: number;
};

type ConsoleLine = {
  text: string;
  kind: "normal" | "success" | "warning" | "error" | "info" | "command";
};

type Props = {
  connected: boolean;
  stats: EngineStats;
  platforms: PlatformObject[];
  selectedPlatform: PlatformObject | null;
  gridSnap: boolean;
  snapStep: number;
  showPhysics: boolean;
  exportPayload: BuilderExport;
  onSelectPlatform: (id: string | null) => void;
  onCreatePlatform: () => void;
  onDeleteSelected: () => void;
  onDuplicateSelected: () => void;
  onToggleGridSnap: () => void;
  onTogglePhysics: () => void;
  onSetSnapStep: (value: number) => void;
  onUpdateSelected: (patch: Partial<PlatformObject>) => void;
};

const DEFAULT_CVARS: Record<string, CVar> = {
  player_speed: {
    name: "player_speed",
    description: "Vitesse cible joueur côté debug.",
    value: 6.2,
    minVal: 1,
    maxVal: 30
  },
  player_health: {
    name: "player_health",
    description: "Santé debug joueur.",
    value: 100,
    minVal: 0,
    maxVal: 100
  },
  gravity: {
    name: "gravity",
    description: "Gravité debug affichée dans la console.",
    value: -24,
    minVal: -80,
    maxVal: 0
  },
  timescale: {
    name: "timescale",
    description: "Échelle de temps debug.",
    value: 1,
    minVal: 0,
    maxVal: 5
  },
  godmode: {
    name: "godmode",
    description: "Flag godmode local.",
    value: 0,
    minVal: 0,
    maxVal: 1
  },
  noclip: {
    name: "noclip",
    description: "Flag noclip local.",
    value: 0,
    minVal: 0,
    maxVal: 1
  },
  wireframe: {
    name: "wireframe",
    description: "Flag wireframe local.",
    value: 0,
    minVal: 0,
    maxVal: 1
  },
  show_fps: {
    name: "show_fps",
    description: "Affichage FPS debug.",
    value: 1,
    minVal: 0,
    maxVal: 1
  }
};

function clamp(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

function parseArgs(commandLine: string) {
  const matches = commandLine.match(/"([^"]*)"|'([^']*)'|[^\s]+/g) ?? [];
  return matches.map((item) => item.replace(/^["']|["']$/g, ""));
}

function isHexColor(value: string) {
  return /^#[0-9a-fA-F]{6}$/.test(value);
}

function toOnOff(value: string | undefined) {
  if (!value) return null;
  const clean = value.toLowerCase();

  if (["1", "on", "true", "yes"].includes(clean)) return true;
  if (["0", "off", "false", "no"].includes(clean)) return false;

  return null;
}

export function DeveloperConsole({
  connected,
  stats,
  platforms,
  selectedPlatform,
  gridSnap,
  snapStep,
  showPhysics,
  exportPayload,
  onSelectPlatform,
  onCreatePlatform,
  onDeleteSelected,
  onDuplicateSelected,
  onToggleGridSnap,
  onTogglePhysics,
  onSetSnapStep,
  onUpdateSelected
}: Props) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyPos, setHistoryPos] = useState(-1);
  const [filterCategory, setFilterCategory] = useState("all");
  const [cvars, setCVars] = useState<Record<string, CVar>>(DEFAULT_CVARS);
  const [lines, setLines] = useState<ConsoleLine[]>([
    {
      text: "EtherWorld Developer Console prête. Tape help pour voir les commandes.",
      kind: "success"
    }
  ]);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const commands = useMemo(
    () => [
      { name: "help", category: "system", description: "Affiche les commandes." },
      { name: "clear", category: "system", description: "Vide les logs console." },
      { name: "status", category: "debug", description: "Affiche état moteur." },
      { name: "cvars", category: "debug", description: "Liste les CVars." },
      { name: "get", category: "debug", description: "get <cvar>" },
      { name: "set", category: "debug", description: "set <cvar> <value>" },
      { name: "physics", category: "debug", description: "physics on/off/toggle" },
      { name: "grid", category: "build", description: "grid on/off/toggle" },
      { name: "snap", category: "build", description: "snap <0.25|0.5|1|2>" },
      { name: "create", category: "build", description: "Crée une plateforme." },
      { name: "delete", category: "build", description: "Supprime sélection." },
      { name: "dup", category: "build", description: "Duplique sélection." },
      { name: "select", category: "build", description: "select <platformId>" },
      { name: "move", category: "build", description: "move <dx> <dy> <dz>" },
      { name: "pos", category: "build", description: "pos <x> <y> <z>" },
      { name: "scale", category: "build", description: "scale <x> <y> <z>" },
      { name: "height", category: "build", description: "height <value>" },
      { name: "rot", category: "build", description: "rot <deltaY>" },
      { name: "color", category: "build", description: "color <#hex>" },
      { name: "export", category: "system", description: "Copie le JSON export." },
      { name: "god", category: "gameplay", description: "god on/off" },
      { name: "noclip", category: "gameplay", description: "noclip on/off" }
    ],
    []
  );

  const visibleCommands = useMemo(() => {
    if (filterCategory === "all") return commands;
    return commands.filter((cmd) => cmd.category === filterCategory);
  }, [commands, filterCategory]);

  function log(text: string, kind: ConsoleLine["kind"] = "normal") {
    setLines((current) => {
      const next = [...current, { text, kind }];
      return next.slice(-250);
    });
  }

  function setCVar(name: string, value: number) {
    setCVars((current) => {
      const cvar = current[name];

      if (!cvar) {
        log(`CVar introuvable: ${name}`, "error");
        return current;
      }

      const nextValue = clamp(value, cvar.minVal, cvar.maxVal);

      log(`${name} = ${nextValue}`, "success");

      return {
        ...current,
        [name]: {
          ...cvar,
          value: nextValue
        }
      };
    });
  }

  function requireSelection() {
    if (!selectedPlatform) {
      log("Aucune plateforme sélectionnée.", "warning");
      return null;
    }

    if (selectedPlatform.locked) {
      log(`Objet verrouillé: ${selectedPlatform.id}`, "warning");
      return null;
    }

    return selectedPlatform;
  }

  async function copyExport() {
    const json = JSON.stringify(exportPayload, null, 2);

    try {
      await navigator.clipboard.writeText(json);
      log("Export JSON copié dans le presse-papiers.", "success");
    } catch {
      log("Clipboard bloqué. Utilise le textarea export du BuilderPanel.", "warning");
    }
  }

  function execute(commandLine: string) {
    const raw = commandLine.trim();
    if (!raw) return;

    const args = parseArgs(raw);
    const command = args[0]?.toLowerCase();
    const rest = args.slice(1);

    log(`> ${raw}`, "command");

    setHistory((current) => [...current, raw].slice(-80));
    setHistoryPos(-1);

    switch (command) {
      case "help": {
        log("Commandes disponibles:", "info");
        for (const cmd of visibleCommands) {
          log(`${cmd.name.padEnd(10)} [${cmd.category}] ${cmd.description}`, "normal");
        }
        return;
      }

      case "clear": {
        setLines([]);
        return;
      }

      case "status": {
        log(`Server: ${connected ? "LIVE" : "OFF"}`, connected ? "success" : "error");
        log(`FPS=${stats.fps} objects=${stats.objects} triangles=${stats.triangles} calls=${stats.calls}`, "info");
        log(`Platforms=${platforms.length} selected=${selectedPlatform?.id ?? "none"}`, "info");
        log(`gridSnap=${gridSnap} snapStep=${snapStep} physicsDebug=${showPhysics}`, "info");
        return;
      }

      case "cvars": {
        for (const cvar of Object.values(cvars)) {
          log(`${cvar.name}=${cvar.value} min=${cvar.minVal} max=${cvar.maxVal} — ${cvar.description}`, "normal");
        }
        return;
      }

      case "get": {
        const name = rest[0];
        const cvar = cvars[name];

        if (!name || !cvar) {
          log("Usage: get <cvar>", "warning");
          return;
        }

        log(`${cvar.name} = ${cvar.value}`, "info");
        return;
      }

      case "set": {
        const name = rest[0];
        const value = Number(rest[1]);

        if (!name || !Number.isFinite(value)) {
          log("Usage: set <cvar> <value>", "warning");
          return;
        }

        setCVar(name, value);
        return;
      }

      case "physics": {
        const mode = rest[0]?.toLowerCase();

        if (mode === "toggle" || !mode) {
          onTogglePhysics();
          log("Debug physique toggled.", "success");
          return;
        }

        const desired = toOnOff(mode);

        if (desired === null) {
          log("Usage: physics on/off/toggle", "warning");
          return;
        }

        if (desired !== showPhysics) onTogglePhysics();
        log(`Debug physique: ${desired ? "ON" : "OFF"}`, "success");
        return;
      }

      case "grid": {
        const mode = rest[0]?.toLowerCase();

        if (mode === "toggle" || !mode) {
          onToggleGridSnap();
          log("Grid snap toggled.", "success");
          return;
        }

        const desired = toOnOff(mode);

        if (desired === null) {
          log("Usage: grid on/off/toggle", "warning");
          return;
        }

        if (desired !== gridSnap) onToggleGridSnap();
        log(`Grid snap: ${desired ? "ON" : "OFF"}`, "success");
        return;
      }

      case "snap": {
        const value = Number(rest[0]);

        if (!Number.isFinite(value) || value <= 0) {
          log("Usage: snap <value>", "warning");
          return;
        }

        onSetSnapStep(value);
        log(`Snap step = ${value}`, "success");
        return;
      }

      case "create":
      case "spawn": {
        onCreatePlatform();
        log("Création plateforme demandée au serveur.", "success");
        return;
      }

      case "delete":
      case "remove": {
        if (!requireSelection()) return;
        onDeleteSelected();
        log("Suppression demandée au serveur.", "warning");
        return;
      }

      case "dup":
      case "duplicate": {
        if (!requireSelection()) return;
        onDuplicateSelected();
        log("Duplication demandée au serveur.", "success");
        return;
      }

      case "select": {
        const id = rest[0];

        if (!id) {
          log("Usage: select <platformId>", "warning");
          return;
        }

        const found = platforms.find((p) => p.id === id);

        if (!found) {
          log(`Plateforme introuvable: ${id}`, "error");
          return;
        }

        onSelectPlatform(found.id);
        log(`Sélection: ${found.id}`, "success");
        return;
      }

      case "move": {
        const platform = requireSelection();
        if (!platform) return;

        const dx = Number(rest[0]);
        const dy = Number(rest[1]);
        const dz = Number(rest[2]);

        if (![dx, dy, dz].every(Number.isFinite)) {
          log("Usage: move <dx> <dy> <dz>", "warning");
          return;
        }

        onUpdateSelected({
          position: [
            platform.position[0] + dx,
            platform.position[1] + dy,
            platform.position[2] + dz
          ]
        });

        log(`Move demandé: ${dx}, ${dy}, ${dz}`, "success");
        return;
      }

      case "pos": {
        const platform = requireSelection();
        if (!platform) return;

        const x = Number(rest[0]);
        const y = Number(rest[1]);
        const z = Number(rest[2]);

        if (![x, y, z].every(Number.isFinite)) {
          log("Usage: pos <x> <y> <z>", "warning");
          return;
        }

        onUpdateSelected({ position: [x, y, z] });
        log(`Position demandée: ${x}, ${y}, ${z}`, "success");
        return;
      }

      case "scale": {
        const platform = requireSelection();
        if (!platform) return;

        const x = Number(rest[0]);
        const y = Number(rest[1]);
        const z = Number(rest[2]);

        if (![x, y, z].every(Number.isFinite)) {
          log("Usage: scale <x> <y> <z>", "warning");
          return;
        }

        onUpdateSelected({
          size: [
            Math.max(0.25, x),
            Math.max(0.1, y),
            Math.max(0.25, z)
          ]
        });

        log(`Scale demandé: ${x}, ${y}, ${z}`, "success");
        return;
      }

      case "height": {
        const platform = requireSelection();
        if (!platform) return;

        const y = Number(rest[0]);

        if (!Number.isFinite(y)) {
          log("Usage: height <value>", "warning");
          return;
        }

        onUpdateSelected({
          size: [
            platform.size[0],
            Math.max(0.1, y),
            platform.size[2]
          ]
        });

        log(`Hauteur demandée: ${y}`, "success");
        return;
      }

      case "rot":
      case "rotate": {
        const platform = requireSelection();
        if (!platform) return;

        const dy = Number(rest[0]);

        if (!Number.isFinite(dy)) {
          log("Usage: rot <deltaY>", "warning");
          return;
        }

        onUpdateSelected({
          rotation: [
            platform.rotation[0],
            platform.rotation[1] + dy,
            platform.rotation[2]
          ]
        });

        log(`Rotation demandée: ${dy}`, "success");
        return;
      }

      case "color": {
        const platform = requireSelection();
        if (!platform) return;

        const color = rest[0];

        if (!isHexColor(color)) {
          log("Usage: color <#RRGGBB>", "warning");
          return;
        }

        onUpdateSelected({ color });
        log(`Couleur demandée: ${color}`, "success");
        return;
      }

      case "export": {
        void copyExport();
        return;
      }

      case "god": {
        const desired = toOnOff(rest[0]);

        if (desired === null) {
          log("Usage: god on/off", "warning");
          return;
        }

        setCVar("godmode", desired ? 1 : 0);
        return;
      }

      case "noclip": {
        const desired = toOnOff(rest[0]);

        if (desired === null) {
          log("Usage: noclip on/off", "warning");
          return;
        }

        setCVar("noclip", desired ? 1 : 0);
        return;
      }

      default:
        log(`Commande inconnue: ${command}. Tape help.`, "error");
    }
  }

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const isToggle = event.code === "F1" || event.code === "Backquote";

      if (!isToggle) return;

      event.preventDefault();
      event.stopPropagation();

      setOpen((value) => !value);
    };

    window.addEventListener("keydown", onKeyDown, true);

    return () => {
      window.removeEventListener("keydown", onKeyDown, true);
    };
  }, []);

  useEffect(() => {
    if (open) {
      window.setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight
    });
  }, [lines, open]);

  function submit() {
    execute(input);
    setInput("");
  }

  function completeInput() {
    const partial = input.trim().toLowerCase();
    if (!partial) return;

    const found = commands.find((cmd) => cmd.name.startsWith(partial));
    if (found) setInput(found.name + " ");
  }

  if (!open) {
    return <div className="console-pill">F1 / ` Console</div>;
  }

  return (
    <div className="dev-console">
      <div className="dev-console-header">
        <div>
          <strong>ETHERWORLD DEV CONSOLE</strong>
          <span>{connected ? " LIVE" : " OFF"}</span>
        </div>

        <select
          value={filterCategory}
          onChange={(event) => setFilterCategory(event.target.value)}
        >
          <option value="all">all</option>
          <option value="system">system</option>
          <option value="build">build</option>
          <option value="gameplay">gameplay</option>
          <option value="debug">debug</option>
        </select>

        <button onClick={() => setOpen(false)}>Fermer</button>
      </div>

      <div className="dev-console-body">
        <div className="console-lines" ref={scrollRef}>
          {lines.map((line, index) => (
            <div key={`${line.text}-${index}`} className={`console-line ${line.kind}`}>
              {line.text}
            </div>
          ))}
        </div>

        <div className="console-sidebar">
          <div className="console-sidebar-title">Commandes</div>
          {visibleCommands.map((cmd) => (
            <button
              key={cmd.name}
              onClick={() => {
                setInput(cmd.name + " ");
                inputRef.current?.focus();
              }}
            >
              <strong>{cmd.name}</strong>
              <small>{cmd.description}</small>
            </button>
          ))}
        </div>
      </div>

      <form
        className="console-input-row"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <span>&gt;</span>

        <input
          ref={inputRef}
          value={input}
          spellCheck={false}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Tab") {
              event.preventDefault();
              completeInput();
              return;
            }

            if (event.key === "ArrowUp") {
              event.preventDefault();

              setHistoryPos((current) => {
                const next = current < 0 ? history.length - 1 : Math.max(0, current - 1);
                setInput(history[next] ?? "");
                return next;
              });
            }

            if (event.key === "ArrowDown") {
              event.preventDefault();

              setHistoryPos((current) => {
                const next = current + 1;

                if (next >= history.length) {
                  setInput("");
                  return -1;
                }

                setInput(history[next] ?? "");
                return next;
              });
            }
          }}
          placeholder="Tape help, status, create, select <id>, move 1 0 0..."
        />
      </form>
    </div>
  );
}
