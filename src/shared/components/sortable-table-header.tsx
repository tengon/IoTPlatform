'use client'

import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { TableHead } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type SortDirection = 'asc' | 'desc' | null

export function SortableTableHeader({ 
  label, 
  sortDirection, 
  onSort, 
  className,
  align = 'left'
}: { 
  label: string
  sortDirection: SortDirection
  onSort: () => void
  className?: string
  align?: 'left' | 'right' | 'center'
}) {
  return (
    <TableHead className={cn('text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 py-3', align === 'right' && 'text-right', align === 'center' && 'text-center', className)}>
      <Button
        variant="ghost"
        size="sm"
        className="h-auto p-0 font-semibold text-[11px] uppercase tracking-wider text-muted-foreground/60 hover:text-foreground/80 gap-1"
        onClick={onSort}
      >
        {label}
        {sortDirection === 'asc' && <ArrowUp className="size-3" />}
        {sortDirection === 'desc' && <ArrowDown className="size-3" />}
        {!sortDirection && <ArrowUpDown className="size-3 opacity-40" />}
      </Button>
    </TableHead>
  )
}

import { useState, useCallback } from 'react'

export function useSort<T>(data: T[], defaultKey?: keyof T, defaultDir?: SortDirection) {
  const [sortKey, setSortKey] = useState<keyof T | null>(defaultKey || null)
  const [sortDir, setSortDir] = useState<SortDirection>(defaultDir || null)

  const toggleSort = useCallback((key: keyof T) => {
    setSortKey((prev) => {
      if (prev === key) {
        setSortDir((d) => (d === 'asc' ? 'desc' : d === 'desc' ? null : 'asc'))
        return key
      }
      setSortDir('asc')
      return key
    })
  }, [])

  const sorted = data.slice().sort((a, b) => {
    if (!sortKey || !sortDir) return 0
    const av = a[sortKey]
    const bv = b[sortKey]
    if (typeof av === 'string' && typeof bv === 'string') {
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
    }
    if (typeof av === 'number' && typeof bv === 'number') {
      return sortDir === 'asc' ? av - bv : bv - av
    }
    return 0
  })

  return { sorted, sortKey, sortDir, toggleSort }
}
