import { useEffect, useState } from 'react'
import type { CameraId, CameraStatus } from '../types'

export interface CameraFeedState {
  cameraId: CameraId
  status: CameraStatus
  isRecording: boolean
  lastFrameAt: number
}

export function useCameraFeed(cameraId: CameraId = 'cam_entrance_left') {
  const [feed, setFeed] = useState<CameraFeedState>({
    cameraId,
    status: 'online' as CameraStatus,
    isRecording: true,
    lastFrameAt: Date.now(),
  })

  useEffect(() => {
    const timer = setInterval(() => setFeed((f) => ({ ...f, lastFrameAt: Date.now() })), 1000)
    return () => clearInterval(timer)
  }, [])

  return feed
}

export default useCameraFeed
