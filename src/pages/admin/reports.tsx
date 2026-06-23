import { useState } from 'react'
import { getReportsSummary, getAdminTransactions } from '@/lib/admin-api'
import { AlertCircle, BarChart3, Download, RefreshCw } from 'lucide-react'

type ReportData = {
  total_transactions: number
  completed_amount: number
  failed_count: number
  bill_payments_total: number
  bill_amount_total: number
  new_users: number
  by_provider: Array<{ provider_name: string; cnt: number; total: number }>
  by_type: Array<{ type: string; cnt: number; total: number }>
}

function serializeToCSV(rows: Record<string, unknown>[]): string {
  if (!rows.length) return ''
  const headers = Object.keys(rows[0])
  const lines = [headers.join(',')]
  for (const row of rows) {
    lines.push(headers.map(h => {
      const v = row[h]
      const str = v === null || v === undefined ? '' : String(v)
      return str.includes(',') || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str
    }).join(','))
  }
  return lines.join('\n')
}

function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

const TYPE_LABELS: Record<string, string> = {
  send: 'Envoi', receive: 'Réception', convert: 'Conversion',
  deposit: 'Dépôt', withdraw: 'Retrait', bill_payment: 'Facture',
}

export function AdminReportsPage() {
  const today = new Date().toISOString().split('T')[0]
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const [fromDate, setFromDate] = useState(thirtyDaysAgo)
  const [toDate, setToDate] = useState(today)
  const [report, setReport] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)

  async function generate() {
    setLoading(true)
    setError(null)
    try {
      const data = await getReportsSummary(
        new Date(fromDate).toISOString(),
        new Date(toDate + 'T23:59:59').toISOString()
      )
      setReport(data as ReportData)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  async function exportCSV() {
    setExporting(true)
    try {
      // Fetch all transactions in the date range (no pagination limit)
      const result = await getAdminTransactions(1, 1000)
      const rows = result.data.map(tx => ({
        id: tx.id,
        utilisateur: tx.user_name,
        email: tx.user_email,
        type: tx.type,
        statut: tx.status,
        montant: tx.amount,
        devise: tx.currency,
        frais: tx.fee,
        bénéficiaire: tx.recipient_name ?? '',
        référence: tx.reference ?? '',
        note: tx.note ?? '',
        créé_le: tx.created_at,
        complété_le: tx.completed_at ?? '',
      }))
      downloadCSV(serializeToCSV(rows as Record<string, unknown>[]), `transactions_${fromDate}_${toDate}.csv`)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Rapports</h2>
        <p className="text-sm text-gray-500 mt-0.5">Analyses et exports financiers</p>
      </div>

      {/* Date range picker */}
      <div className="flex flex-col sm:flex-row gap-3 items-end mb-6 p-5 rounded-2xl" style={{ background: 'white', border: '1px solid #E5E7EB' }}>
        <div className="flex-1">
          <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Du</label>
          <input
            type="date"
            value={fromDate}
            onChange={e => setFromDate(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none"
            style={{ borderColor: '#E5E7EB' }}
          />
        </div>
        <div className="flex-1">
          <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Au</label>
          <input
            type="date"
            value={toDate}
            onChange={e => setToDate(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none"
            style={{ borderColor: '#E5E7EB' }}
          />
        </div>
        <button
          onClick={generate}
          disabled={loading}
          className="px-6 py-2.5 rounded-xl text-sm font-semibold cursor-pointer disabled:opacity-60 flex items-center gap-2 whitespace-nowrap"
          style={{ background: '#0D1B4B', color: 'white' }}
        >
          {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Générer
        </button>
        <button
          onClick={exportCSV}
          disabled={exporting}
          className="px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer disabled:opacity-60 flex items-center gap-2 whitespace-nowrap"
          style={{ background: '#9fe870', color: '#0D1B4B' }}
        >
          <Download className="w-4 h-4" />
          {exporting ? 'Export...' : 'Exporter CSV'}
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-3 p-4 rounded-2xl mb-6" style={{ background: '#FEE2E2', border: '1px solid #FECACA' }}>
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-700">Erreur</p>
            <p className="text-xs text-red-600">{error}</p>
          </div>
        </div>
      )}

      {!report && !loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <BarChart3 className="w-16 h-16 mb-4 text-gray-200" />
          <p className="text-sm font-medium text-gray-400">Sélectionnez une période et cliquez sur Générer</p>
        </div>
      )}

      {loading && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 rounded-2xl animate-pulse" style={{ background: '#F3F4F8' }} />
          ))}
        </div>
      )}

      {report && !loading && (
        <div className="space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { label: 'Total transactions', value: report.total_transactions, color: '#6366f1', suffix: '' },
              { label: 'Montant complété (HTG)', value: report.completed_amount.toLocaleString('fr-HT'), color: '#9fe870', suffix: '' },
              { label: 'Transactions échouées', value: report.failed_count, color: '#DC2626', suffix: '' },
              { label: 'Paiements factures', value: report.bill_payments_total, color: '#059669', suffix: '' },
              { label: 'Montant factures (HTG)', value: report.bill_amount_total.toLocaleString('fr-HT'), color: '#f59e0b', suffix: '' },
              { label: 'Nouveaux utilisateurs', value: report.new_users, color: '#0ea5e9', suffix: '' },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-2xl p-5" style={{ background: 'white', border: '1px solid #E5E7EB' }}>
                <p className="text-xs text-gray-500 mb-2">{label}</p>
                <p className="text-2xl font-bold" style={{ color }}>{value}</p>
              </div>
            ))}
          </div>

          {/* By provider */}
          {report.by_provider.length > 0 && (
            <div className="rounded-2xl overflow-hidden" style={{ background: 'white', border: '1px solid #E5E7EB' }}>
              <div className="px-5 py-4" style={{ borderBottom: '1px solid #E5E7EB' }}>
                <h3 className="text-sm font-bold text-gray-900">Par fournisseur</h3>
              </div>
              <table className="w-full">
                <thead>
                  <tr style={{ background: '#F9FAFB' }}>
                    {['Fournisseur', 'Nb transactions', 'Montant total (HTG)'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {report.by_provider.map(row => (
                    <tr key={row.provider_name} style={{ borderTop: '1px solid #F3F4F6' }}>
                      <td className="px-4 py-3 text-sm font-medium text-gray-800">{row.provider_name}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{row.cnt}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-800">{Number(row.total).toLocaleString('fr-HT')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* By type */}
          {report.by_type.length > 0 && (
            <div className="rounded-2xl overflow-hidden" style={{ background: 'white', border: '1px solid #E5E7EB' }}>
              <div className="px-5 py-4" style={{ borderBottom: '1px solid #E5E7EB' }}>
                <h3 className="text-sm font-bold text-gray-900">Par type de transaction</h3>
              </div>
              <table className="w-full">
                <thead>
                  <tr style={{ background: '#F9FAFB' }}>
                    {['Type', 'Nb', 'Montant total (HTG)'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {report.by_type.map(row => (
                    <tr key={row.type} style={{ borderTop: '1px solid #F3F4F6' }}>
                      <td className="px-4 py-3 text-sm font-medium text-gray-800">{TYPE_LABELS[row.type] ?? row.type}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{row.cnt}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-800">{Number(row.total).toLocaleString('fr-HT')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
