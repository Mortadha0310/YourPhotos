import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import Photo from '@/models/Photo';
import { deleteImage } from '@/lib/cloudinary';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  await connectDB();
  const photo = await Photo.findByIdAndUpdate(params.id, body, { new: true });
  return NextResponse.json(photo);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const photo = await Photo.findById(params.id);
  if (!photo) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  await deleteImage(photo.publicId);
  await photo.deleteOne();
  return NextResponse.json({ success: true });
}
