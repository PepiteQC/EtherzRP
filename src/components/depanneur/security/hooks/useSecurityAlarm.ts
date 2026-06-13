/**
 * useSecurityAlarm.ts
 * Hook React — état alarme temps réel avec sons et visuels
 */

import { useEffect, useRef, useCallback } from 'react'
import { useSecurityStore } from '../securityStore'
import { isAlarmTriggered, getAlarmDisplayText, clearAllTimers } from '../alarmSystem'
import type { AlarmState } from '../types'

interface AlarmHookResult {
  alarmState:   AlarmState
  isTriggered:  boolean
  isArmed:      boolean
  displayText:  { en: string; fr: string; color: string }
  arm:          (mode: 'away' | 'stay', code: string) => boolean
  disarm:       (code: string) => boolean
  panic:        () => void
  flashActive:  boolean
}

export function useSecurityAlarm(): AlarmHookResult {
  const alarmState = useSecurityStore(s => s.state.alarm)
  const armAlarm   = useSecurityStore(s => s.armAlarm)
  const disarmAlarm = useSecurityStore(s => s.disarmAlarm)
  const triggerPanic = useSecurityStore(s => s.triggerPanic)

  const flashRef = useRef(false)
  const flashTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Flash effect quand alarme triggered
  useEffect(() => {
    if (alarmState === 'triggered' || alarmState === 'panic') {
      flashTimerRef.current = setInterval(() => {
        flashRef.current = !flashRef.current
      }, 500)
    } else {
      if (flashTimerRef.current) {
        clearInterval(flashTimerRef.current)
        flashTimerRef.current = null
      }
      flashRef.current = false
    }

    return () => {
      if (flashTimerRef.current) clearInterval(flashTimerRef.current)
    }
  }, [alarmState])

  // Cleanup on unmount
  useEffect(() => () => clearAllTimers(), [])

  const arm = useCallback((mode: 'away' | 'stay', code: string) => {
    return armAlarm(mode, code)
  }, [armAlarm])

  const disarm = useCallback((code: string) => {
    return disarmAlarm(code)
  }, [disarmAlarm])

  const panic = useCallback(() => {
    triggerPanic()
  }, [triggerPanic])

  return {
    alarmState,
    isTriggered:  isAlarmTriggered(),
    isArmed:      alarmState !== 'disarmed',
    displayText:  getAlarmDisplayText(alarmState),
    arm,
    disarm,
    panic,
    flashActive:  flashRef.current,
  }
}