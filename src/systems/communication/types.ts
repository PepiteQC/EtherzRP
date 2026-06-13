// src/systems/communication/types.ts

export type ChatChannel =
  | "proximity"    // 15m autour du joueur
  | "shout"        // 50m — crier
  | "whisper"      // 3m — chuchoter
  | "faction"      // Membres de la faction
  | "job"          // Collègues de job
  | "radio"        // Fréquence radio
  | "phone"        // Appel privé
  | "megaphone"    // 100m — police/annonce
  | "global"       // OOC global (limité)
  | "admin";       // Messages admin

export interface ChatMessage {
  id: string;
  channel: ChatChannel;
  senderUid: string;
  senderName: string;
  senderJob?: string;
  content: string;
  timestamp: number;
  position?: { x: number; y: number; z: number };
  radioFrequency?: number;
  phoneTarget?: string;
  isRP: boolean;       // true = in-character, false = OOC
}

export interface RadioState {
  isOn: boolean;
  frequency: number;     // ex: 100.1
  volume: number;        // 0-1
  isSpeaking: boolean;
}

export interface PhoneState {
  isOpen: boolean;
  inCall: boolean;
  callingUid: string | null;
  callStartTime: number | null;
  contacts: PhoneContact[];
  messages: PhoneMessage[];
}

export interface PhoneContact {
  uid: string;
  name: string;
  number: string;         // ex: "514-123-4567"
  isFavorite: boolean;
}

export interface PhoneMessage {
  id: string;
  fromUid: string;
  fromName: string;
  toUid: string;
  content: string;
  timestamp: number;
  isRead: boolean;
}

export interface VoiceState {
  isEnabled: boolean;
  isTalking: boolean;
  volume: number;
  mode: "proximity" | "radio" | "phone";
  range: number;          // distance en mètres Three.js
}

export interface NotificationData {
  id: string;
  type: "info" | "warning" | "police" | "ambulance" | "faction" | "phone";
  title: string;
  message: string;
  icon: string;
  duration: number;       // ms avant auto-dismiss
  sound?: string;
  timestamp: number;
}