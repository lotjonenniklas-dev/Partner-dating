import { getTotalUsers, getTotalMatches, getTotalMessages } from '@/lib/supabase-helpers'

export const runtime = 'nodejs'

/**
 * GET /api/admin/stats
 * Returns Supabase statistics for admin dashboard
 */
export async function GET() {
  try {
    const [users, matches, messages] = await Promise.all([
      getTotalUsers(),
      getTotalMatches(),
      getTotalMessages()
    ])

    return Response.json({
      users,
      matches,
      messages,
      timestamp: Date.now()
    })
  } catch (error) {
    console.error('Admin stats error:', error)
    return Response.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
