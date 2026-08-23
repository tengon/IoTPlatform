'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  ScrollText,
  Play,
  Pause,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Wifi,
  WifiOff,
  Wrench,
  Clock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useIIoTStore } from '@/store/iiot'
import { formatDistanceToNow } from 'date-fns'

type ActivityType =
  | 'machine-started'
  | 'machine-stopped'
  | 'machine-error'
  | 'alarm-triggered'
  | 'alarm-acknowledged'
  | 'ws-connected'
  | 'ws-disconnected'
  | 'maintenance-scheduled'
  | 'maintenance-completed'

interface ActivityEvent {
  id: string
  type: ActivityType
  description: string
  timestamp: Date
  icon: typeof Play
  color: string
  bg: string
}

const MACHINE_NAMES = [
  'CNC Lathe #1',
  'CNC Mill #1',
  'Injection Molder #1',
  'Conveyor Belt #1',
  'Robot Arm #1',
  'Packaging Line #1',
]

const ALARM_MESSAGES = [
  'Temperature fluctuation detected',
  'Vibration level above normal',
  'Communication latency increased',
  'Power consumption spike',
  'Sensor calibration drift',
  'Hydraulic pressure drop detected',
  'Spindle temperature exceeds threshold',
  'Flow rate below minimum threshold',
]

const TYPE_CONFIG: Record<ActivityType, { icon: typeof Play; color: string; bg: string }> = {
  'machine-started': { icon: Play, color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
  'machine-stopped': { icon: Pause, color: 'text-amber-400', bg: 'bg-amber-500/15' },
  'machine-error': { icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/15' },
  'alarm-triggered': { icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/15' },
  'alarm-acknowledged': { icon: CheckCircle2, color: 'text-cyan-400', bg: 'bg-cyan-500/15' },
  'ws-connected': { icon: Wifi, color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
  'ws-disconnected': { icon: WifiOff, color: 'text-red-400', bg: 'bg-red-500/15' },
  'maintenance-scheduled': { icon: Clock, color: 'text-cyan-400', bg: 'bg-cyan-500/15' },
  'maintenance-completed': { icon: Wrench, color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
}

function generateEvent(): ActivityEvent {
  const types: ActivityType[] = [
    'machine-started',
    'machine-stopped',
    'machine-error',
    'alarm-triggered',
    'alarm-acknowledged',
    'maintenance-scheduled',
    'maintenance-completed',
  ]
  const type = types[Math.floor(Math.random() * types.length)]
  const machine = MACHINE_NAMES[Math.floor(Math.random() * MACHINE_NAMES.length)]
  const config = TYPE_CONFIG[type]

  let description = ''
  switch (type) {
    case 'machine-started':
      description = `${machine} started production run`
      break
    case 'machine-stopped':
      description = `${machine} stopped — idle state`
      break
    case 'machine-error':
      description = `${machine} entered error state`
      break
    case 'alarm-triggered':
      description = `${ALARM_MESSAGES[Math.floor(Math.random() * ALARM_MESSAGES.length)]} on ${machine}`
      break
    case 'alarm-acknowledged':
      description = `Alarm acknowledged for ${machine}`
      break
    case 'maintenance-scheduled':
      description = `Maintenance scheduled for ${machine}`
      break
    case 'maintenance-completed':
      description = `Maintenance completed on ${machine}`
      break
  }

  return {
    id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type,
    description,
    timestamp: new Date(),
    icon: config.icon,
    color: config.color,
    bg: config.bg,
  }
}

function generateInitialEvents(): ActivityEvent[] {
  const events: ActivityEvent[] = []
  const initialTypes: { type: ActivityType; desc: string }[] = [
    { type: 'ws-connected', desc: 'WebSocket connected to IIoT Gateway' },
    { type: 'machine-started', desc: 'CNC Lathe #1 started production run' },
    { type: 'machine-started', desc: 'Conveyor Belt #1 started production run' },
    { type: 'alarm-triggered', desc: 'Spindle temperature exceeds threshold on CNC Lathe #1' },
    { type: 'alarm-acknowledged', desc: 'Alarm acknowledged for Flow Meter D1' },
    { type: 'maintenance-scheduled', desc: 'Maintenance scheduled for Injection Molder #1' },
    { type: 'machine-error', desc: 'pH Sensor G1 entered error state' },
    { type: 'maintenance-completed', desc: 'Maintenance completed on Robot Arm #1' },
    { type: 'machine-stopped', desc: 'Packaging Line #1 stopped — idle state' },
    { type: 'alarm-triggered', desc: 'Flow rate below minimum threshold on Flow Meter D1' },
    { type: 'machine-started', desc: 'CNC Mill #1 started production run' },
    { type: 'alarm-triggered', desc: 'Hydraulic pressure drop detected on Injection Molder #1' },
  ]

  initialTypes.forEach((item, i) => {
    const config = TYPE_CONFIG[item.type]
    events.push({
      id: `evt-init-${i}`,
      type: item.type,
      description: item.desc,
      timestamp: new Date(Date.now() - (initialTypes.length - i) * 45000),
      icon: config.icon,
      color: config.color,
      bg: config.bg,
    })
  })

  return events
}

export function ActivityFeed() {
  const [events, setEvents] = useState<ActivityEvent[]>(generateInitialEvents)
  const [unreadCount, setUnreadCount] = useState(12)
  const [open, setOpen] = useState(false)
  const prevConnectedRef = useRef(useIIoTStore.getState().isConnected)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Track WebSocket connection changes
  useEffect(() => {
    const unsub = useIIoTStore.subscribe((state) => {
      const wasConnected = prevConnectedRef.current
      prevConnectedRef.current = state.isConnected

      if (wasConnected && !state.isConnected) {
        const config = TYPE_CONFIG['ws-disconnected']
        const evt: ActivityEvent = {
          id: `evt-${Date.now()}-ws`,
          type: 'ws-disconnected',
          description: 'WebSocket disconnected — reconnecting...',
          timestamp: new Date(),
          icon: config.icon,
          color: config.color,
          bg: config.bg,
        }
        setEvents((prev) => [evt, ...prev].slice(0, 50))
        setUnreadCount((c) => c + 1)
      } else if (!wasConnected && state.isConnected) {
        const config = TYPE_CONFIG['ws-connected']
        const evt: ActivityEvent = {
          id: `evt-${Date.now()}-ws`,
          type: 'ws-connected',
          description: 'WebSocket reconnected to IIoT Gateway',
          timestamp: new Date(),
          icon: config.icon,
          color: config.color,
          bg: config.bg,
        }
        setEvents((prev) => [evt, ...prev].slice(0, 50))
        setUnreadCount((c) => c + 1)
      }
    })
    return unsub
  }, [])

  // Generate new events periodically (5-10 seconds)
  useEffect(() => {
    const scheduleNext = () => {
      const delay = 5000 + Math.random() * 5000
      intervalRef.current = setTimeout(() => {
        const evt = generateEvent()
        setEvents((prev) => [evt, ...prev].slice(0, 50))
        setUnreadCount((c) => c + 1)
        scheduleNext()
      }, delay)
    }
    scheduleNext()
    return () => {
      if (intervalRef.current) clearTimeout(intervalRef.current)
    }
  }, [])

  // Clear unread count when popover opens
  const handleOpenChange = useCallback((v: boolean) => {
    setOpen(v)
    if (v) setUnreadCount(0)
  }, [])

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-8 w-8 hover:bg-muted/50 transition-colors">
          <ScrollText className="size-4 text-muted-foreground" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 text-[10px] flex items-center justify-center font-semibold notification-badge-count"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[380px] p-0 gap-0 overflow-hidden bg-card/95 backdrop-blur-xl border-border/60 shadow-2xl animate-scale-in"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
          <div className="flex items-center gap-2">
            <ScrollText className="size-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Activity Feed</h3>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-[10px] h-5">
                {unreadCount} new
              </Badge>
            )}
          </div>
        </div>

        {/* Event List */}
        <div className="max-h-96 overflow-y-auto">
          <div className="divide-y divide-border/30">
            {events.map((event) => {
              const Icon = event.icon
              const isNew = Date.now() - event.timestamp.getTime() < 30000
              return (
                <div
                  key={event.id}
                  className={`flex items-start gap-3 px-4 py-3 transition-colors duration-150 hover:bg-muted/30 ${isNew ? 'feed-item-enter' : ''}`}
                >
                  <div
                    className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${event.bg}`}
                  >
                    <Icon className={`size-3.5 ${event.color}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-foreground leading-relaxed line-clamp-2">
                      {event.description}
                    </p>
                    <div className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground/60">
                      <Clock className="size-2.5" />
                      {formatDistanceToNow(event.timestamp, { addSuffix: true })}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-border/50 bg-muted/10">
          <span className="text-[10px] text-muted-foreground">
            {events.length} events total
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={() => {
              setEvents([])
              setUnreadCount(0)
            }}
          >
            Clear All
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
