'use client'

import { useEffect, useRef } from 'react'
import { useIIoTStore } from '@/store/iiot'
import { useToast } from '@/hooks/use-toast'

export function AlarmToast() {
  const alarms = useIIoTStore((s) => s.alarms)
  const { toast } = useToast()
  const prevCountRef = useRef(alarms.length)

  useEffect(() => {
    const prevCount = prevCountRef.current
    if (alarms.length > prevCount) {
      // New alarms were added — check the latest ones for critical severity
      const newAlarms = alarms.slice(prevCount)
      for (const alarm of newAlarms) {
        if (alarm.severity === 'critical') {
          toast({
            title: '⚠️ Critical Alarm',
            description: `${alarm.message} \u2014 ${alarm.source}`,
            variant: 'destructive',
            duration: 6000,
          })
        }
      }
    }
    prevCountRef.current = alarms.length
  }, [alarms, toast])

  return null
}
