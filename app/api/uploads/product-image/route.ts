import { v2 as cloudinary } from 'cloudinary';
import sharp from 'sharp';
import { getUserBySessionToken, parseCookie } from '@/lib/serverAuth';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

async function requireAdmin(request: Request) {
  const token = parseCookie(request.headers.get('cookie'), 'wf_session');
  if (!token) return null;

  const user = await getUserBySessionToken(token);
  if (!user || user.role !== 'admin') return null;
  return user;
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return Response.json(
        {
          error:
            'Missing Cloudinary server credentials. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.',
        },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return Response.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!file.type.startsWith('image/')) {
      return Response.json({ error: 'Invalid file type' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const inputBuffer = Buffer.from(bytes);

    // Convert every upload to WebP before sending to Cloudinary.
    const webpBuffer = await sharp(inputBuffer)
      .rotate()
      .webp({ quality: 84 })
      .toBuffer();

    const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'zhilakaii/products',
          resource_type: 'image',
          format: 'webp',
        },
        (error, uploaded) => {
          if (error || !uploaded?.secure_url) {
            reject(error || new Error('Upload failed'));
            return;
          }

          resolve({ secure_url: uploaded.secure_url });
        }
      );

      uploadStream.end(webpBuffer);
    });

    return Response.json({ url: result.secure_url }, { status: 201 });
  } catch (error) {
    return Response.json(
      {
        error: 'Failed to upload image',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
