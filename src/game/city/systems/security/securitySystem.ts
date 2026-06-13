export type SecurityEventType =
  | "door_forced"
  | "alarm_triggered"
  | "camera_detected"
  | "storage_opened"
  | "admin_override";

export interface SecurityEvent {
  id: string;
  type: SecurityEventType;
  buildingId: string;
  message: string;
  createdAt: number;
}

export function createSecurityEvent(type: SecurityEventType, buildingId: string, message: string): SecurityEvent {
  return {
    id: `${type}-${buildingId}-${Date.now()}`,
    type,
    buildingId,
    message,
    createdAt: Date.now(),
  };
}
