import * as THREE from 'three'

export class EnvironmentEffects {
  constructor(private readonly scene?: THREE.Scene) {}

  startDust(position: THREE.Vector3, intensity = 1): void {
    this.addPoint(position, 0xaaaaaa, intensity, 400)
  }

  startFire(position: THREE.Vector3, intensity = 1): void {
    this.addPoint(position, 0xff6600, intensity, 1200)
  }

  startSmoke(position: THREE.Vector3, intensity = 1): void {
    this.addPoint(position, 0x666666, intensity, 900)
  }

  clear(): void {}

  private addPoint(position: THREE.Vector3, color: THREE.ColorRepresentation, intensity: number, timeout: number): void {
    if (!this.scene) return
    const light = new THREE.PointLight(color, intensity, 6)
    light.position.copy(position)
    this.scene.add(light)
    setTimeout(() => {
      this.scene?.remove(light)
      light.dispose?.()
    }, timeout)
  }
}

export default EnvironmentEffects
