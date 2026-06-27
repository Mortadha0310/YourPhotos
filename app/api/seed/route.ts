export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';

export async function GET() {
  await connectDB();
  const exists = await User.findOne({ email: 'admin@photoshare.com' });
  if (exists) return NextResponse.json({ message: 'Already seeded' });

  const hashed = await bcrypt.hash('Admin@123', 12);
  await User.create({
    name: 'Admin',
    email: 'admin@photoshare.com',
    password: hashed,
    role: 'admin',
    isActive: true,
  });
  return NextResponse.json({ message: 'Admin created: admin@photoshare.com / Admin@123' });
}
