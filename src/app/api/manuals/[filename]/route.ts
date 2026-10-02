import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { join } from 'path';
import { statSync, existsSync, createReadStream } from 'fs';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const session = await auth();

  if (!session) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const resolvedParams = await params;
  const filename = resolvedParams.filename;
  // Ensure the filename doesn't contain directory traversal sequences
  if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return new NextResponse('Bad Request', { status: 400 });
  }

  const filePath = join(process.cwd(), 'src', 'lib', 'manuals', filename);

  if (!existsSync(filePath)) {
    return new NextResponse('Not Found', { status: 404 });
  }

  try {
    const stats = statSync(filePath);
    
    // Instead of streaming with a custom ReadableStream which can be complex in Edge/Node environments,
    // we can use standard Web Streams or just read the file into a buffer if it's small enough.
    // Or we can just use createReadStream and wrap it in a ReadableStream.
    
    const readStream = createReadStream(filePath);
    
    // Convert Node.js stream to Web Stream
    const webStream = new ReadableStream({
      start(controller) {
        readStream.on('data', (chunk: Buffer) => controller.enqueue(new Uint8Array(chunk)));
        readStream.on('end', () => controller.close());
        readStream.on('error', (error: Error) => controller.error(error));
      },
      cancel() {
        readStream.destroy();
      },
    });

    return new NextResponse(webStream, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${filename}"`,
        'Content-Length': stats.size.toString(),
      },
    });
  } catch (error) {
    console.error('Error reading manual file:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
