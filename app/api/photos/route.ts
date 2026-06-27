import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import Photo from '@/models/Photo';
import { uploadImage } from '@/lib/cloudinary';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const eventId = searchParams.get('eventId');
  if (!eventId) return NextResponse.json({ error: 'eventId required' }, { status: 400 });

  await connectDB();
  const photos = await Photo.find({ event: eventId }).sort({ createdAt: -1 });
  return NextResponse.json(photos);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await req.formData();
  const eventId = formData.get('eventId') as string;
  const files = formData.getAll('files') as File[];

  if (!eventId || !files.length)
    return NextResponse.json({ error: 'Missing data' }, { status: 400 });

  await connectDB();
  const uploaded = [];

  for (const file of files) {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = `data:${file.type};base64,${buffer.toString('base64')}`;
    const { url, publicId } = await uploadImage(base64, `events/${eventId}`);

    const photo = await Photo.create({
      event: eventId,
      url,
      publicId,
      filename: file.name,
      faceDescriptors: [],
      facesCount: 0,
    });
    uploaded.push(photo);
  }

  return NextResponse.json(uploaded, { status: 201 });
}
