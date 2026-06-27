import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import bcrypt from 'bcryptjs';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'admin')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const users = await User.find({ role: 'photographer' }).select('-password').sort({ createdAt: -1 });
  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'admin')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { name, email, password } = await req.json();
  if (!name || !email || !password)
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

  await connectDB();
  const exists = await User.findOne({ email });
  if (exists) return NextResponse.json({ error: 'Email already exists' }, { status: 409 });

  const hashed = await bcrypt.hash(password, 12);
  const user = await User.create({ name, email, password: hashed, role: 'photographer' });
  const { password: _, ...safe } = user.toObject();
  return NextResponse.json(safe, { status: 201 });
}
