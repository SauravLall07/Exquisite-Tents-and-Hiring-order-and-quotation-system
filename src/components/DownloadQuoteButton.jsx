import React, { useState } from 'react'
import { pdf } from '@react-pdf/renderer'
import { QuotePDF } from '../lib/QuotePDF'

export function DownloadQuoteButton({ order, variant = 'primary', label = 'Download Quote PDF' }) {
  const [generating, setGenerating] = useState(false)

  async function handleDownload() {
    setGenerating(true)
    try {
      const blob = await pdf(<QuotePDF order={order} />).toBlob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      const slug = (order.name ?? 'order').split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '')
      a.href     = url
      a.download = `quote-${slug}-${(order.id ?? '').slice(0, 8)}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('PDF generation failed', err)
      alert('Could not generate the PDF. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  const cls =
    variant === 'primary'
      ? 'rounded-full bg-red-700 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-red-700/20 transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-50'
      : 'rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-40'

  return (
    <button onClick={handleDownload} disabled={generating || !order?.quote?.total} className={cls}>
      {generating ? 'Generating PDF…' : label}
    </button>
  )
}
