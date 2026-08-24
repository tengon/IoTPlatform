'use client'

import { useState, useCallback, useMemo } from 'react'
import { Download, FileSpreadsheet, FileJson } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

// ─── Types ───────────────────────────────────────────────────────────────

type ExportFormat = 'csv' | 'json'

interface ExportColumn {
  key: string
  label: string
}

interface ExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  data: Record<string, unknown>[]
  columns: ExportColumn[]
  filename?: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────

function escapeCsvField(value: unknown): string {
  const str = value === null || value === undefined ? '' : String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function generateCsv(data: Record<string, unknown>[], columns: ExportColumn[]): string {
  const header = columns.map((c) => escapeCsvField(c.label)).join(',')
  const rows = data.map((row) =>
    columns.map((c) => escapeCsvField(row[c.key])).join(',')
  )
  return [header, ...rows].join('\n')
}

function generateJson(data: Record<string, unknown>[], columns: ExportColumn[]): string {
  const mapped = data.map((row) => {
    const obj: Record<string, unknown> = {}
    for (const col of columns) {
      obj[col.label] = row[col.key] ?? ''
    }
    return obj
  })
  return JSON.stringify(mapped, null, 2)
}

function downloadBlob(content: string, mimeType: string, filename: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ─── Component ───────────────────────────────────────────────────────────

export function ExportDialog({
  open,
  onOpenChange,
  title = 'Export Data',
  data,
  columns,
  filename = 'export',
}: ExportDialogProps) {
  const [format, setFormat] = useState<ExportFormat>('csv')
  const [customFilename, setCustomFilename] = useState(filename)
  const { toast } = useToast()

  const rowCount = useMemo(() => data.length, [data])

  const handleExport = useCallback(() => {
    const ext = format === 'csv' ? 'csv' : 'json'
    const mimeType = format === 'csv' ? 'text/csv;charset=utf-8;' : 'application/json'
    const safeName = customFilename.trim() || filename
    const fullName = `${safeName}.${ext}`

    const content = format === 'csv'
      ? generateCsv(data, columns)
      : generateJson(data, columns)

    downloadBlob(content, mimeType, fullName)

    toast({
      title: 'Export successful',
      description: `${rowCount} rows exported as ${fullName}`,
    })

    onOpenChange(false)
  }, [format, customFilename, filename, data, columns, rowCount, toast, onOpenChange])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] bg-card border-border/60">
        <DialogHeader>
          <DialogTitle className="text-base flex items-center gap-2">
            <Download className="size-4 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Choose a format and download your data.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {/* Format selector */}
          <div className="grid gap-2">
            <Label className="text-xs">Format</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                className={`export-option ${format === 'csv' ? 'selected' : ''}`}
                onClick={() => setFormat('csv')}
              >
                <FileSpreadsheet className="size-6 text-emerald-400" />
                <span className="text-sm font-medium">CSV</span>
                <span className="kpi-subtext text-[10px]">Comma-separated values</span>
              </button>
              <button
                type="button"
                className={`export-option ${format === 'json' ? 'selected' : ''}`}
                onClick={() => setFormat('json')}
              >
                <FileJson className="size-6 text-cyan-400" />
                <span className="text-sm font-medium">JSON</span>
                <span className="kpi-subtext text-[10px]">Pretty-printed data</span>
              </button>
            </div>
          </div>

          {/* Filename input */}
          <div className="grid gap-2">
            <Label className="text-xs" htmlFor="export-filename">Filename</Label>
            <Input
              id="export-filename"
              value={customFilename}
              onChange={(e) => setCustomFilename(e.target.value)}
              placeholder="export"
              className="h-9 text-sm"
            />
          </div>

          {/* Row count */}
          <div className="flex items-center justify-between px-1">
            <span className="kpi-subtext text-xs">Rows to export</span>
            <span className="text-sm font-medium tabular-nums">{rowCount.toLocaleString()}</span>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            className="gap-2"
            onClick={handleExport}
            disabled={rowCount === 0}
          >
            <Download className="size-3.5" />
            Export
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
