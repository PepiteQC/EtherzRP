import type { ComponentType } from "react";
import * as InventoryPanelModule from "../etherworld/inventory-panel";

const inventoryPanelExports = InventoryPanelModule as Record<string, unknown>;
const InventoryPanel = (inventoryPanelExports.default ?? inventoryPanelExports.InventoryPanel) as ComponentType<any>;

export default InventoryPanel;
export * from "../etherworld/inventory-panel";
