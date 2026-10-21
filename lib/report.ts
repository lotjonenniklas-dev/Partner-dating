export const reportReasons = [
  { id: "sopimaton", label: "Sopimaton sisältö" },
  { id: "hairinta", label: "Häirintä" },
  { id: "huijaus", label: "Huijaus" },
  { id: "alaikainen", label: "Vaikuttaa alaikäiseltä" },
] as const

export type ReportReason = (typeof reportReasons)[number]["id"]

const LOCAL_KEY = "partner-reports"
const LOCAL_LIMIT = 50

export function isReportReason(value: unknown): value is ReportReason {
  return reportReasons.some((item) => item.id === value)
}

export function rememberReport(entry: { personId: string; reason: ReportReason; at: number }) {
  const raw = localStorage.getItem(LOCAL_KEY)
  let current: unknown = []
  if (raw) {
    try {
      current = JSON.parse(raw)
    } catch {
      current = []
    }
  }
  const list = Array.isArray(current) ? current : []
  const next = [...list, entry].slice(-LOCAL_LIMIT)
  localStorage.setItem(LOCAL_KEY, JSON.stringify(next))
}
