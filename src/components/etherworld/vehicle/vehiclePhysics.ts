import * as THREE from "three";
import { VEHICLE_TUNING } from "./vehicleConfig";

export interface DriveInputState {
  forward: boolean;
  back: boolean;
  left: boolean;
  right: boolean;
  brake: boolean;
  engineOn: boolean;
  fuel: number;
  damage: number;
}

export interface DrivePhysicsState {
  speed: number;
  steering: number;
}

export interface DrivePhysicsStepResult {
  speed: number;
  steering: number;
  accelerating: boolean;
  reversing: boolean;
  braking: boolean;
  speedAbs: number;
  speedRatio: number;
  movingSign: 1 | -1;
  throttleLocked: boolean;
}

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}

function damagePowerMultiplier(damage: number) {
  if (damage < 55) return 1;
  if (damage < 88) return THREE.MathUtils.lerp(1, 0.55, (damage - 55) / 33);
  return 0.28;
}

export function stepVehiclePhysics(
  previous: DrivePhysicsState,
  input: DriveInputState,
  dt: number
): DrivePhysicsStepResult {
  const tuning = VEHICLE_TUNING;
  const hasFuel = input.fuel > 0;
  const canThrottle = input.engineOn && hasFuel && input.damage < 98;
  const power = damagePowerMultiplier(input.damage);

  let speed = previous.speed;
  let steering = previous.steering;

  const accelerating = canThrottle && input.forward;
  const reversing = canThrottle && input.back;
  const braking = input.brake;
  const throttleLocked = (input.forward || input.back) && !canThrottle;

  if (accelerating) {
    speed += tuning.acceleration * power * dt;
  } else if (reversing) {
    // Si on avance, S agit d'abord comme frein; sinon marche arrière.
    if (speed > 1) speed -= tuning.brakeForce * 0.72 * dt;
    else speed -= tuning.reverseAcceleration * power * dt;
  } else {
    const sign = Math.sign(speed);
    const slowDown = (tuning.engineBrake + Math.abs(speed) * tuning.drag) * dt;
    if (Math.abs(speed) <= slowDown) speed = 0;
    else speed -= sign * slowDown;
  }

  if (braking) {
    const sign = Math.sign(speed);
    const slowDown = tuning.brakeForce * dt;
    if (Math.abs(speed) <= slowDown) speed = 0;
    else speed -= sign * slowDown;
  }

  const maxForward = tuning.maxForwardSpeed * power;
  const maxReverse = tuning.maxReverseSpeed * power;
  speed = THREE.MathUtils.clamp(speed, -maxReverse, maxForward);

  const targetSteer = input.left ? tuning.maxSteer : input.right ? -tuning.maxSteer : 0;
  steering = THREE.MathUtils.damp(steering, targetSteer, tuning.steerResponse, dt);

  const speedAbs = Math.abs(speed);
  const speedRatio = clamp01(speedAbs / tuning.maxForwardSpeed);

  return {
    speed,
    steering,
    accelerating,
    reversing,
    braking,
    speedAbs,
    speedRatio,
    movingSign: speed >= 0 ? 1 : -1,
    throttleLocked,
  };
}

export function computeFuelBurn(params: {
  dt: number;
  engineOn: boolean;
  accelerating: boolean;
  reversing: boolean;
  speedRatio: number;
  damage: number;
}) {
  const tuning = VEHICLE_TUNING;
  if (!params.engineOn) return 0;

  const damagePenalty = params.damage > 65 ? 1.25 : 1;
  const throttle = params.accelerating || params.reversing ? tuning.fuelBurnThrottle : 0;

  return (
    tuning.fuelBurnIdle +
    throttle +
    params.speedRatio * tuning.fuelBurnSpeed
  ) * damagePenalty * params.dt;
}

export function computeCollisionDamage(impactSpeed: number) {
  if (impactSpeed < 8) return 0;
  if (impactSpeed < 18) return THREE.MathUtils.mapLinear(impactSpeed, 8, 18, 2, 9);
  if (impactSpeed < 30) return THREE.MathUtils.mapLinear(impactSpeed, 18, 30, 9, 24);
  return THREE.MathUtils.clamp(24 + (impactSpeed - 30) * 1.25, 24, 55);
}
