// src/systems/communication/voice/ProximityVoice.ts

import * as THREE from "three";

export class ProximityVoice {
  private static audioContext: AudioContext | null = null;
  private static listener: THREE.AudioListener | null = null;
  private static playerAudios: Map<string, THREE.PositionalAudio> = new Map();
  private static localStream: MediaStream | null = null;

  // Distances d'écoute
  private static readonly NORMAL_RANGE = 15;
  private static readonly SHOUT_RANGE = 50;
  private static readonly WHISPER_RANGE = 3;

  // ─── Initialisation ───────────────────────────────────────
  static async init(camera: THREE.Camera): Promise<void> {
    this.listener = new THREE.AudioListener();
    camera.add(this.listener);

    // Demander le micro
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      this.audioContext = this.listener.context;
      console.log("[VOICE] 🎙️ Microphone activé");
    } catch (err) {
      console.warn("[VOICE] ❌ Micro refusé:", err);
    }
  }

  // ─── Ajouter un joueur distant ────────────────────────────
  static addRemotePlayer(
    uid: string,
    playerObject: THREE.Object3D,
    stream: MediaStream
  ): void {
    if (!this.listener) return;

    const audio = new THREE.PositionalAudio(this.listener);
    const source = this.audioContext!.createMediaStreamSource(stream);

    // @ts-ignore — Three.js interne
    audio.setNodeSource(source);
    audio.setRefDistance(this.NORMAL_RANGE * 0.5);
    audio.setMaxDistance(this.NORMAL_RANGE);
    audio.setRolloffFactor(2);
    audio.setDistanceModel("exponential");

    playerObject.add(audio);
    this.playerAudios.set(uid, audio);
  }

  // ─── Mise à jour de la portée (normal/crier/chuchoter) ───
  static setMode(uid: string, mode: "normal" | "shout" | "whisper"): void {
    const audio = this.playerAudios.get(uid);
    if (!audio) return;

    const ranges = {
      normal: this.NORMAL_RANGE,
      shout: this.SHOUT_RANGE,
      whisper: this.WHISPER_RANGE,
    };

    const range = ranges[mode];
    audio.setRefDistance(range * 0.5);
    audio.setMaxDistance(range);
  }

  // ─── Retirer un joueur ────────────────────────────────────
  static removePlayer(uid: string): void {
    const audio = this.playerAudios.get(uid);
    if (audio) {
      audio.disconnect();
      this.playerAudios.delete(uid);
    }
  }

  // ─── Muter/Unmuter ────────────────────────────────────────
  static setMuted(muted: boolean): void {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = !muted;
      });
    }
  }

  static getLocalStream(): MediaStream | null {
    return this.localStream;
  }
}