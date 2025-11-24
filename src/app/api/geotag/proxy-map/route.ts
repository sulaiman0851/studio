import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');

  if (!lat || !lon) {
    return NextResponse.json({ error: 'Missing lat/lon' }, { status: 400 });
  }

  // Calculate OSM Tile coordinates
  // Zoom level 15 is good for street level details
  const zoom = 15;
  const latNum = parseFloat(lat);
  const lonNum = parseFloat(lon);

  const n = Math.pow(2, zoom);
  const xTile = Math.floor(n * ((lonNum + 180) / 360));
  const latRad = (latNum * Math.PI) / 180;
  const yTile = Math.floor(
    (n * (1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI)) / 2
  );

  // OSM Tile URL
  const tileUrl = `https://tile.openstreetmap.org/${zoom}/${xTile}/${yTile}.png`;

  try {
    const response = await fetch(tileUrl, {
      headers: {
        'User-Agent': 'GeotagApp/1.0', // OSM requires a User-Agent
      },
    });
    
    if (!response.ok) throw new Error('Failed to fetch map tile');

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Return image directly
    return new NextResponse(buffer as any, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Map proxy error:', error);
    return NextResponse.json({ error: 'Failed to fetch map' }, { status: 500 });
  }
}
