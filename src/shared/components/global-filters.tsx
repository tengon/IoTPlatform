'use client'

import { useState, useEffect, useRef } from 'react'
import { Factory, Clock, ChevronDown, X } from 'lucide-react'
import { useUIStore } from '@/store/ui-store'
import { useSitesQuery } from '@/hooks/queries'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import type { TimeRangePreset } from '@/types'

const TIME_PRESETS: { value: TimeRangePreset; label: string; desc: string }[] = [
  { value: '1h', label: '1H', desc: 'Last Hour' },
  { value: '6h', label: '6H', desc: 'Last 6 Hours' },
  { value: '12h', label: '12H', desc: 'Last 12 Hours' },
  { value: '24h', label: '24H', desc: 'Last 24 Hours' },
  { value: '7d', label: '7D', desc: 'Last 7 Days' },
  { value: '30d', label: '30D', desc: 'Last 30 Days' },
]

// ─── Global Filters Bar ──────────────────────────────────────────────
// Shows factory selector + time range in the topbar area.
// Uses UI State store (Zustand + localStorage persistence).

export function GlobalFilters() {
  const factory = useUIStore((s) => s.factory)
  const setFactory = useUIStore((s) => s.setFactory)
  const timeRange = useUIStore((s) => s.timeRange)
  const setTimeRangePreset = useUIStore((s) => s.setTimeRangePreset)
  const { data: sites } = useSitesQuery()

  return (
    <div className="flex items-center gap-2">
      {/* Factory Selector */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-[11px] gap-1.5 border-border/50 hover:border-border/80 bg-transparent"
          >
            <Factory className="size-3" />
            <span className="max-w-[100px] truncate">
              {factory.siteName || 'All Sites'}
            </span>
            <ChevronDown className="size-3 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-2" align="start">
          <div className="space-y-0.5">
            <FactoryOption
              siteId={null}
              siteName="All Sites"
              machineCount={sites?.reduce((acc, s) => acc + s.machineCount, 0) || 0}
              selected={!factory.siteId}
              onSelect={() => setFactory({ siteId: null, siteName: null })}
            />
            {sites?.map((site) => (
              <FactoryOption
                key={site.id}
                siteId={site.id}
                siteName={site.name.replace(/^Main Factory - /, '').replace(/^Assembly Plant - /, '').replace(/^Warehouse - /, '').replace(/^R&D Center - /, '')}
                machineCount={site.machineCount}
                selected={factory.siteId === site.id}
                onSelect={() => setFactory({ siteId: site.id, siteName: site.name })}
              />
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {/* Time Range Selector */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-[11px] gap-1.5 border-border/50 hover:border-border/80 bg-transparent"
          >
            <Clock className="size-3" />
            <span>{timeRange.preset === 'custom' ? 'Custom' : timeRange.label.replace('Last ', '')}</span>
            <ChevronDown className="size-3 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-2" align="start">
          <div className="grid grid-cols-3 gap-1">
            {TIME_PRESETS.map((p) => (
              <button
                key={p.value}
                onClick={() => setTimeRangePreset(p.value)}
                className={`flex flex-col items-center gap-0.5 rounded-md px-2 py-1.5 text-center transition-colors hover:bg-muted/30 ${
                  timeRange.preset === p.value
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : 'text-muted-foreground'
                }`}
              >
                <span className="text-xs font-bold">{p.label}</span>
                <span className="text-[9px] opacity-60">{p.desc.replace('Last ', '')}</span>
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {/* Clear Filters */}
      {(factory.siteId || timeRange.preset !== '24h') && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-[10px] text-muted-foreground/60 hover:text-foreground/80 gap-1"
          onClick={() => {
            setFactory({ siteId: null, siteName: null })
            setTimeRangePreset('24h')
          }}
        >
          <X className="size-2.5" />
          Reset
        </Button>
      )}
    </div>
  )
}

function FactoryOption({
  siteId,
  siteName,
  machineCount,
  selected,
  onSelect,
}: {
  siteId: string | null
  siteName: string
  machineCount: number
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      onClick={onSelect}
      className={`w-full flex items-center gap-2 rounded-md px-2.5 py-1.5 text-left transition-colors hover:bg-muted/30 ${
        selected ? 'bg-emerald-500/15 text-emerald-400' : 'text-foreground/80'
      }`}
    >
      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${selected ? 'bg-emerald-400' : 'bg-muted-foreground/30'}`} />
      <span className="flex-1 text-xs truncate">{siteName}</span>
      <span className="text-[9px] text-muted-foreground/50">{machineCount} machines</span>
    </button>
  )
}