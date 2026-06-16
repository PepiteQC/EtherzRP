import { useEffect } from "react";
import { PlatformObject } from "../types";

type Options = {
  enabled: boolean;
  selectedPlatform: PlatformObject | null;
  snapStep: number;
  onToggleGridSnap: () => void;
  onDuplicateSelected: () => void;
  onDeleteSelected: () => void;
  onUpdateSelected: (patch: Partial<PlatformObject>) => void;
};

function isTypingTarget(event: KeyboardEvent) {
  const target = event.target as HTMLElement | null;
  const tag = target?.tagName?.toLowerCase();

  return (
    tag === "input" ||
    tag === "textarea" ||
    tag === "select" ||
    target?.isContentEditable
  );
}

function stopBuilderEvent(event: KeyboardEvent) {
  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();
}

export function useBuilderHotkeys({
  enabled,
  selectedPlatform,
  snapStep,
  onToggleGridSnap,
  onDuplicateSelected,
  onDeleteSelected,
  onUpdateSelected
}: Options) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!enabled || isTypingTarget(event)) return;

      if (event.code === "KeyG") {
        stopBuilderEvent(event);
        onToggleGridSnap();
        return;
      }

      const platform = selectedPlatform;
      if (!platform) return;

      const step = event.shiftKey ? snapStep * 4 : event.altKey ? snapStep * 0.2 : snapStep;
      const rotateStep = event.shiftKey ? 0.45 : event.altKey ? 0.05 : 0.15;

      let patch: Partial<PlatformObject> | null = null;
      let action: null | (() => void) = null;

      if ((event.ctrlKey || event.metaKey) && event.code === "KeyD") {
        action = onDuplicateSelected;
      } else {
        switch (event.code) {
          case "Delete":
          case "Backspace":
            action = onDeleteSelected;
            break;

          case "ArrowUp":
            patch = {
              position: [
                platform.position[0],
                platform.position[1],
                platform.position[2] - step
              ]
            };
            break;

          case "ArrowDown":
            patch = {
              position: [
                platform.position[0],
                platform.position[1],
                platform.position[2] + step
              ]
            };
            break;

          case "ArrowLeft":
            patch = {
              position: [
                platform.position[0] - step,
                platform.position[1],
                platform.position[2]
              ]
            };
            break;

          case "ArrowRight":
            patch = {
              position: [
                platform.position[0] + step,
                platform.position[1],
                platform.position[2]
              ]
            };
            break;

          case "PageUp":
            patch = {
              position: [
                platform.position[0],
                platform.position[1] + step,
                platform.position[2]
              ]
            };
            break;

          case "PageDown":
            patch = {
              position: [
                platform.position[0],
                Math.max(0.05, platform.position[1] - step),
                platform.position[2]
              ]
            };
            break;

          case "KeyQ":
            patch = {
              rotation: [
                platform.rotation[0],
                platform.rotation[1] - rotateStep,
                platform.rotation[2]
              ]
            };
            break;

          case "KeyE":
            patch = {
              rotation: [
                platform.rotation[0],
                platform.rotation[1] + rotateStep,
                platform.rotation[2]
              ]
            };
            break;

          case "Equal":
          case "NumpadAdd":
            patch = {
              size: [
                platform.size[0] + step,
                platform.size[1],
                platform.size[2] + step
              ]
            };
            break;

          case "Minus":
          case "NumpadSubtract":
            patch = {
              size: [
                Math.max(0.25, platform.size[0] - step),
                platform.size[1],
                Math.max(0.25, platform.size[2] - step)
              ]
            };
            break;

          case "BracketRight":
            patch = {
              size: [
                platform.size[0],
                Math.max(0.1, platform.size[1] + step),
                platform.size[2]
              ]
            };
            break;

          case "BracketLeft":
            patch = {
              size: [
                platform.size[0],
                Math.max(0.1, platform.size[1] - step),
                platform.size[2]
              ]
            };
            break;
        }
      }

      if (!patch && !action) return;

      stopBuilderEvent(event);

      if (platform.locked) {
        console.warn("[BUILDER] Objet verrouillé:", platform.id);
        return;
      }

      if (action) {
        action();
        return;
      }

      onUpdateSelected(patch);
    };

    window.addEventListener("keydown", onKeyDown, true);

    return () => {
      window.removeEventListener("keydown", onKeyDown, true);
    };
  }, [
    enabled,
    selectedPlatform,
    snapStep,
    onToggleGridSnap,
    onDuplicateSelected,
    onDeleteSelected,
    onUpdateSelected
  ]);
}
