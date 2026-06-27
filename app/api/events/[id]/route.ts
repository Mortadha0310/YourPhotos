import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import Event from '@/models/Event';
import Photo from '@/models/Photo';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  await connectDB();
  // Support lookup by numericCode or _id
  const event = await Event.findOne({
    $or: [{ numericCode: params.id }, { _id: params.id.match(/^[0-9a-fA-F]{24}$/) ? params.id : null }],
  }).populate('photographer', 'name email avatar');
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(event);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  await connectDB();
  const event = await Event.findByIdAndUpdate(params.id, body, { new: true });
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(event);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  await Photo.deleteMany({ event: params.id });
  await Event.findByIdAndDelete(params.id);
  return NextResponse.json({ success: true });
}
