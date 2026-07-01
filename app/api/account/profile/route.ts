import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, createdAt: true },
  })
  return NextResponse.json(user)
}

export async function PATCH(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { name } = await request.json()
  if (!name || String(name).trim().length < 1) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }
  await prisma.user.update({
    where: { id: session.user.id },
    data: { name: String(name).trim() },
  })
  return NextResponse.json({ success: true })
}
