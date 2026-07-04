import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email')
  if (!email) {
    return NextResponse.json({ error: 'email query param required' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, role: true, password: true, createdAt: true, name: true },
  })

  if (!user) {
    return NextResponse.json({ exists: false })
  }

  return NextResponse.json({
    exists: true,
    role: user.role,
    hasPassword: !!user.password,
    passwordLength: user.password ? user.password.length : 0,
    createdAt: user.createdAt,
  })
}
