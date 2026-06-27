import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import Event from '@/models/Event';

function generateNumericCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const user = session.user as any;
  const query = user.role === 'admin' ? {} : { photographer: user.id };
  const events = await Event.find(query)
    .populate('photographer', 'name email')
    .sort({ createdAt: -1 });
  return NextResponse.json(events);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  await connectDB();

  let numericCode = generateNumericCode();
  let exists = await Event.findOne({ numericCode });
  while (exists) {
    numericCode = generateNumericCode();
    exists = await Event.findOne({ numericCode });
  }

  const qrData = `${process.env.NEXTAUTH_URL}/event/${numericCode}`;
  const user = session.user as any;

  const event = await Event.create({
    ...body,
    photographer: user.id,
    numericCode,
    qrData,
  });

  return NextResponse.json(event, { status: 201 });
}
