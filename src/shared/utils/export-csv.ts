/**
 * Export data as CSV file
 */
export function exportCSV<T extends Record<string, unknown>>({
  data,
  filename,
  columns,
}: {
  data: T[]
  filename: string
  columns?: { key: keyof T; label: string }[]
}) {
  if (!data.length) return

  const cols = columns || (Object.keys(data[0]) as (keyof T)[]).map((key) => ({ key, label: String(key) }))
  const header = cols.map((c) => c.label).join(',')
  const rows = data.map((row) =>
    cols
      .map((c) => {
        const val = row[c.key]
        const str = val === null || val === undefined ? '' : String(val)
        // Escape commas and quotes in CSV
        return str.includes(',') || str.includes('"') || str.includes('\n')
          ? `"${str.replace(/"/g, '""')}"`
          : str
      })
      .join(',')
  )

  const csv = [header, ...rows].join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}.csv`
  link.click()
  URL.revokeObjectURL(url)
}
