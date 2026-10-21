import { getAllUsers, blockUser, deleteUser } from '@/lib/supabase-helpers'
import { readLimitedJson } from '@/lib/read-body'

export const runtime = 'nodejs'

/**
 * GET /api/admin/users
 * Returns all users with profiles
 */
export async function GET() {
  try {
    const users = await getAllUsers(100)

    return Response.json({
      users,
      count: users.length
    })
  } catch (error) {
    console.error('Admin users error:', error)
    return Response.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/users
 * Admin actions: block or delete user
 */
export async function POST(request: Request) {
  try {
    const read = await readLimitedJson(request)
    if ('error' in read) {
      return Response.json({ error: 'Invalid request' }, { status: 400 })
    }

    const body = read.value as {
      action?: string
      userId?: string
      targetUserId?: string
    }

    if (!body.action || !body.targetUserId) {
      return Response.json({ error: 'Missing parameters' }, { status: 400 })
    }

    switch (body.action) {
      case 'block':
        if (!body.userId) {
          return Response.json({ error: 'Missing userId' }, { status: 400 })
        }
        const blocked = await blockUser(body.userId, body.targetUserId)
        return Response.json({ success: blocked })

      case 'delete':
        const deleted = await deleteUser(body.targetUserId)
        return Response.json({ success: deleted })

      default:
        return Response.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Admin action error:', error)
    return Response.json(
      { error: 'Action failed' },
      { status: 500 }
    )
  }
}
