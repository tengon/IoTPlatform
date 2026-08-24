'use client'

import { useState, useMemo } from 'react'
import {
  Bell,
  AlertCircle,
  AlertTriangle,
  Info,
  Check,
  X,
  Clock,
  ArrowRight,
  Filter,
} from 'lucide-react'
import { useIIoTStore } from '@/store/iiot'
import { useNavigation } from '@/store/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { formatDistanceToNow } from 'date-fns'

const SEV_CONFIG: Record<string, { icon: typeof AlertCircle; color: string; bg: string; label: string }> = {
  critical: { icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/15', label: 'Critical' },
  warning: { icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/15', label: 'Warning' },
  info: { icon: Info, color: 'text-cyan-400', bg: 'bg-cyan-500/15', label: 'Info' },
}

type FilterType = 'all' | 'critical' | 'warning' | 'info'

export function NotificationPanel() {
  const alarms = useIIoTStore((s) => s.alarms)
  const acknowledgeAlarm = useIIoTStore((s) => s.acknowledgeAlarm)
  const { setCurrentPage } = useNavigation()
  const [filter, setFilter] = useState<FilterType>('all')
  const [open, setOpen] = useState(false)

  const activeAlarms = useMemo(
    () =>
      [...alarms]
        .filter((a) => a.status === 'active')
        .filter((a) => filter === 'all' || a.severity === filter)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 20),
    [alarms, filter]
  )

  const totalActive = alarms.filter((a) => a.status === 'active').length
  const criticalCount = alarms.filter((a) => a.status === 'active' && a.severity === 'critical').length

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-8 w-8 hover:bg-muted/50 transition-colors">
          <Bell className="size-4 text-muted-foreground" />
          {totalActive > 0 && (
            <Badge
              className={`absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 text-[10px] flex items-center justify-center font-semibold ${
                criticalCount > 0
                  ? 'notification-badge-critical'
                  : 'notification-badge-count'
              }`}
            >
              {totalActive > 99 ? '99+' : totalActive}
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
            <Bell className="size-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Notifications</h3>
            <Badge variant="secondary" className="text-[10px] h-5">
              {totalActive} active
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => {
              setCurrentPage('active-alarms')
              setOpen(false)
            }}
          >
            <ArrowRight className="size-3.5" />
          </Button>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 px-3 py-2 border-b border-border/30 bg-muted/20">
          <Filter className="size-3 text-muted-foreground mr-1" />
          {([['all', 'All'], ['critical', 'Critical'], ['warning', 'Warning'], ['info', 'Info']] as const).map(
            ([key, label]) => {
              const count =
                key === 'all'
                  ? totalActive
                  : alarms.filter((a) => a.status === 'active' && a.severity === key).length
              return (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`relative px-2.5 py-1 rounded-md text-[11px] font-medium transition-all duration-200 ${
                    filter === key
                      ? 'bg-primary/15 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  {label}
                  {count > 0 && (
                    <span className="ml-1 text-[10px] opacity-60">{count}</span>
                  )}
                </button>
              )
            }
          )}
        </div>

        {/* Alarm List */}
        <ScrollArea className="h-[340px]">
          {activeAlarms.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <Check className="size-8 text-emerald-400/50" />
              <p className="text-sm text-muted-foreground">No notifications</p>
              <p className="text-xs text-muted-foreground/60">All clear for now</p>
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {activeAlarms.map((alarm, i) => {
                const sev = SEV_CONFIG[alarm.severity] || SEV_CONFIG.info
                const SevIcon = sev.icon
                return (
                  <div
                    key={alarm.id}
                    className="group flex items-start gap-3 px-4 py-3 transition-colors duration-150 hover:bg-muted/30 animate-fade-in"
                    style={{ animationDelay: `${i * 30}ms` }}
                  >
                    <div
                      className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${sev.bg}`}
                    >
                      <SevIcon className={`size-3.5 ${sev.color}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-semibold text-foreground truncate">
                          {alarm.source}
                        </p>
                        <Badge
                          variant="outline"
                          className={`text-[9px] px-1 py-0 h-4 shrink-0 ${sev.bg} ${sev.color} border-current/20`}
                        >
                          {sev.label}
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {alarm.message}
                      </p>
                      <div className="mt-1.5 flex items-center gap-1 text-[10px] text-muted-foreground/60">
                        <Clock className="size-2.5" />
                        {formatDistanceToNow(new Date(alarm.createdAt), { addSuffix: true })}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        acknowledgeAlarm(alarm.id)
                      }}
                      title="Acknowledge"
                    >
                      <Check className="size-3 text-emerald-400" />
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-border/50 bg-muted/10">
          <span className="text-[10px] text-muted-foreground">
            Showing {activeAlarms.length} of {totalActive} notifications
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={() => {
              setCurrentPage('active-alarms')
              setOpen(false)
            }}
          >
            View All
            <ArrowRight className="size-3" />
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
