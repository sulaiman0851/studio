'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { createClient } from '@/lib/supabase/client';
import { Eye, Download, Trash2, Maximize2, Minimize2, FlipHorizontal } from 'lucide-react';
import { FloatingMap } from '@/components/floating-map';
import { GallerySkeleton } from '@/components/ui/gallery-skeleton';
import { Skeleton } from '@/components/ui/skeleton';

interface GeotaggedPhoto {
  id: string;
  image_url: string;
  latitude: number;
  longitude: number;
  created_at: string;
  caption?: string;
  description?: string;
}

const GeotagPage = () => {
  const { toast } = useToast();
  const { currentUser, loading: authLoading, role } = useAuth();
  const supabase = createClient();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number; timestamp?: number } | null>(null);
  const [photos, setPhotos] = useState<GeotaggedPhoto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingGallery, setIsLoadingGallery] = useState(true);
  const [previewPhoto, setPreviewPhoto] = useState<GeotaggedPhoto | null>(null);
  
  // Camera UI State
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isMirrored, setIsMirrored] = useState(false);

  // Pagination State
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Permissions: camera + geolocation
  useEffect(() => {
    let watchId: number | null = null;
    let mediaStream: MediaStream | null = null;

    const getPermissions = async () => {
      try {
        // Watch geolocation
        watchId = navigator.geolocation.watchPosition(
          (position) => {
            setCoords({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              timestamp: position.timestamp,
            });
          },
          (err) => {
            const msg = `Location error: ${err.message}`;
            setError(msg);
            toast({ title: 'Location Error', description: err.message, variant: 'destructive' });
          }
        );
        
        // Get camera stream
        mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        setStream(mediaStream);
        if (videoRef.current) videoRef.current.srcObject = mediaStream;
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Permission error';
        setError(`Permission error: ${msg}`);
        toast({ title: 'Permission Error', description: msg, variant: 'destructive' });
      }
    };
    
    getPermissions();
    
    // Cleanup function - stops camera and geolocation when component unmounts
    return () => {
      // Stop geolocation watch
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
      
      // Stop all camera tracks
      if (mediaStream) {
        mediaStream.getTracks().forEach((track) => {
          track.stop();
          console.log('Camera track stopped:', track.kind);
        });
      }
    };
  }, []);

  // Assign stream to video element when available
  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  // Fetch photos function
  const fetchPhotos = async (pageNum: number, isLoadMore = false) => {
    try {
      if (isLoadMore) setIsLoadingMore(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
      
      const response = await fetch(`/api/geotag/photos?page=${pageNum}&limit=12`, { 
        credentials: 'include',
        headers 
      });
      
      if (!response.ok) throw new Error('Failed to fetch photos');
      
      const result = await response.json();
      // Handle both old array format (backward compatibility) and new paginated format
      const newPhotos = Array.isArray(result) ? result : result.data;
      const meta = Array.isArray(result) ? { hasMore: false } : result.meta;

      if (isLoadMore) {
        setPhotos(prev => [...prev, ...newPhotos]);
      } else {
        setPhotos(newPhotos);
      }
      
      setHasMore(meta.hasMore);
      setPage(pageNum);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      toast({ title: 'Error', description: `Could not load gallery: ${msg}`, variant: 'destructive' });
    } finally {
      setIsLoadingGallery(false);
      setIsLoadingMore(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchPhotos(1);
  }, []);

  const loadMore = () => {
    if (!isLoadingMore && hasMore) {
      fetchPhotos(page + 1, true);
    }
  };

  // Take a photo and upload
  const takePhoto = async () => {
    if (!currentUser) {
      toast({ title: 'Unauthorized', description: 'You must be logged in to take a photo.', variant: 'destructive' });
      return;
    }
    if (!videoRef.current || !canvasRef.current || !coords) {
      toast({ title: 'Error', description: 'Camera or location not ready.', variant: 'destructive' });
      return;
    }
    setIsUploading(true);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      toast({ title: 'Error', description: 'Could not get canvas context.', variant: 'destructive' });
      setIsUploading(false);
      return;
    }
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Handle Mirroring
    if (isMirrored) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
    
    // Reset transform for text overlay
    if (isMirrored) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    
    // Draw overlay background for better readability
    const gradient = ctx.createLinearGradient(0, canvas.height - 80, 0, canvas.height);
    gradient.addColorStop(0, 'transparent');
    gradient.addColorStop(1, 'rgba(0,0,0,0.7)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, canvas.height - 80, canvas.width, 80);

    // Draw text
    ctx.fillStyle = 'white';
    ctx.shadowColor = 'black';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;

    // Date & Time
    // Use GPS timestamp if available for accuracy, otherwise fallback to device time
    const photoTime = coords.timestamp ? new Date(coords.timestamp) : new Date();
    const dateText = photoTime.toLocaleString('id-ID', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    ctx.font = 'bold 16px Arial';
    ctx.fillText(dateText, 20, canvas.height - 45);

    // Coordinates
    const coordText = `Lat: ${coords.latitude.toFixed(6)}, Lon: ${coords.longitude.toFixed(6)}`;
    ctx.font = '14px Arial';
    ctx.fillText(coordText, 20, canvas.height - 20);

    // Draw Map Overlay (Yandex Static Map via Proxy)
    try {
      const mapImg = new Image();
      mapImg.crossOrigin = "Anonymous";
      
      await new Promise((resolve, reject) => {
        mapImg.onload = resolve;
        mapImg.onerror = reject;
        // Add timestamp to prevent caching issues if location changes rapidly
        mapImg.src = `/api/geotag/proxy-map?lat=${coords.latitude}&lon=${coords.longitude}&t=${Date.now()}`;
      });

      // Map dimensions (adjust based on canvas size if needed)
      const mapWidth = 120;
      const mapHeight = 80;
      const margin = 10;
      const x = canvas.width - mapWidth - margin;
      const y = canvas.height - mapHeight - margin;

      // Draw white border/frame for the map
      ctx.fillStyle = 'white';
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 4;
      ctx.fillRect(x - 2, y - 2, mapWidth + 4, mapHeight + 4);

      // Reset shadow for image
      ctx.shadowColor = 'transparent';
      ctx.drawImage(mapImg, x, y, mapWidth, mapHeight);

      // Draw red marker pin in the center of the map
      const pinX = x + mapWidth / 2;
      const pinY = y + mapHeight / 2;

      // Pin circle
      ctx.fillStyle = '#ef4444'; // Red-500
      ctx.beginPath();
      ctx.arc(pinX, pinY, 4, 0, Math.PI * 2);
      ctx.fill();
      
      // Pin border
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.stroke();
    } catch (e) {
      console.error('Failed to draw map overlay:', e);
      // Continue even if map fails
    }

    const dataUrl = canvas.toDataURL('image/jpeg');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const response = await fetch('/api/geotag/upload', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          image: dataUrl,
          latitude: coords.latitude,
          longitude: coords.longitude,
        }),
        credentials: 'include',
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to upload photo');
      }
      const newPhoto = await response.json();
      // Assume API returns { url, latitude, longitude, id }
      setPhotos((prev) => [
        {
          ...newPhoto,
          image_url: newPhoto.url,
          created_at: new Date().toISOString(),
          id: newPhoto.id ?? `${Date.now()}`,
        },
        ...prev,
      ]);
      toast({ title: 'Photo Uploaded!', description: 'Saved to your gallery.' });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      toast({ title: 'Upload Error', description: msg, variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };

  // Download photo
  const downloadPhoto = async (photo: GeotaggedPhoto) => {
    try {
      const response = await fetch(photo.image_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `geotag_${photo.id}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({ title: 'Success', description: 'Photo downloaded!' });
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to download photo', variant: 'destructive' });
    }
  };

  // Delete photo (admin only)
  const deletePhoto = async (photo: GeotaggedPhoto) => {
    if (!confirm(`Hapus foto ini?\n\nLat: ${photo.latitude?.toFixed(5)}\nLon: ${photo.longitude?.toFixed(5)}`)) {
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: HeadersInit = {};
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const response = await fetch(`/api/geotag/photos/${photo.id}`, {
        method: 'DELETE',
        headers,
        credentials: 'include',
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to delete photo');
      }

      // Remove from local state
      setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
      toast({ title: 'Success', description: 'Photo deleted successfully!' });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    }
  };

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ caption: '', description: '' });

  // Update edit form when preview photo changes
  useEffect(() => {
    if (previewPhoto) {
      setEditForm({
        caption: previewPhoto.caption || '',
        description: previewPhoto.description || '',
      });
      setIsEditing(false);
    }
  }, [previewPhoto]);

  const savePhotoDetails = async () => {
    if (!previewPhoto) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const response = await fetch(`/api/geotag/photos/${previewPhoto.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(editForm),
      });

      if (!response.ok) throw new Error('Failed to update photo');

      const updatedPhoto = await response.json();
      
      // Update local state
      setPhotos(prev => prev.map(p => p.id === updatedPhoto.id ? updatedPhoto : p));
      setPreviewPhoto(updatedPhoto);
      setIsEditing(false);
      toast({ title: 'Success', description: 'Photo details updated!' });
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to save details', variant: 'destructive' });
    }
  };

  // Render UI
  return (
    <div className="p-4 md:p-8">
      <Card>
        <CardHeader>
          <CardTitle>Geotag Photo</CardTitle>
        </CardHeader>
        <CardContent>
          {error && <div className="text-red-500 mb-4">{error}</div>}
          <div className={`${isFullScreen ? 'fixed inset-0 z-50 bg-black flex items-center justify-center' : 'relative mb-4'}`}>
            {!stream ? (
              <Skeleton className="w-full aspect-video rounded-md bg-muted animate-pulse flex items-center justify-center">
                <p className="text-muted-foreground text-sm">Initializing Camera...</p>
              </Skeleton>
            ) : (
              <>
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  className={`${isFullScreen ? 'h-full w-full object-cover' : 'w-full rounded-md shadow-sm'} ${isMirrored ? 'scale-x-[-1]' : ''} transition-transform duration-300`} 
                />
                
                {/* Camera Controls Overlay */}
                <div className="absolute top-4 right-4 flex gap-2 z-10">
                  <Button
                    size="icon"
                    variant="secondary"
                    className="bg-black/50 hover:bg-black/70 text-white border-0"
                    onClick={() => setIsMirrored(!isMirrored)}
                  >
                    <FlipHorizontal className="h-5 w-5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="bg-black/50 hover:bg-black/70 text-white border-0"
                    onClick={() => setIsFullScreen(!isFullScreen)}
                  >
                    {isFullScreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
                  </Button>
                </div>

                {/* Shutter Button (Full Screen Mode Only) */}
                {isFullScreen && (
                  <div className="absolute bottom-8 left-0 right-0 flex justify-center z-10">
                    <Button
                      size="lg"
                      className="h-16 w-16 rounded-full border-4 border-white bg-transparent hover:bg-white/20"
                      onClick={takePhoto}
                      disabled={isUploading}
                    >
                      <div className={`h-12 w-12 rounded-full ${isUploading ? 'bg-gray-400' : 'bg-red-500'}`} />
                    </Button>
                  </div>
                )}
              </>
            )}
            
            {coords && stream && (
              <div className={`absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs p-1 rounded z-10 ${isFullScreen ? 'bottom-8 left-8 text-sm p-2' : ''}`}>
                Lat: {coords.latitude.toFixed(5)}, Lon: {coords.longitude.toFixed(5)}
              </div>
            )}
          </div>
          <Button
            onClick={takePhoto}
            disabled={!stream || !coords || isUploading || authLoading || !currentUser}
          >
            {isUploading ? 'Uploading...' : 'Take Photo'}
          </Button>
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </CardContent>
      </Card>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Gallery</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingGallery ? (
            <GallerySkeleton />
          ) : photos.length === 0 ? (
            <p>No photos taken yet.</p>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {photos.map((photo) => (
                  <div key={photo.id || photo.created_at} className="relative group">
                    <img src={photo.image_url} alt={`Geotagged at ${photo.created_at}`} className="w-full rounded-md" />
                    
                    {/* Overlay dengan tombol preview & download */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 rounded-md flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                      <Button
                        size="icon"
                        variant="secondary"
                        onClick={() => setPreviewPhoto(photo)}
                        className="h-10 w-10"
                      >
                        <Eye className="h-5 w-5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="secondary"
                        onClick={() => downloadPhoto(photo)}
                        className="h-10 w-10"
                      >
                        <Download className="h-5 w-5" />
                      </Button>
                      {role === 'admin' && (
                        <Button
                          size="icon"
                          variant="destructive"
                          onClick={() => deletePhoto(photo)}
                          className="h-10 w-10"
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      )}
                    </div>

                    {/* Info coordinates */}
                    <div className="absolute bottom-0 left-0 bg-black bg-opacity-50 text-white text-xs p-1 rounded-b-md w-full">
                      <p>Lat: {photo.latitude?.toFixed(5) ?? 'N/A'}</p>
                      <p>Lon: {photo.longitude?.toFixed(5) ?? 'N/A'}</p>
                    </div>
                  </div>
                ))}
              </div>

              {hasMore && (
                <div className="mt-6 flex justify-center">
                  <Button 
                    variant="outline" 
                    onClick={loadMore} 
                    disabled={isLoadingMore}
                  >
                    {isLoadingMore ? 'Loading...' : 'Load More'}
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Preview Modal */}
      <Dialog open={!!previewPhoto} onOpenChange={(open) => !open && setPreviewPhoto(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Photo Details</DialogTitle>
          </DialogHeader>
          {previewPhoto && (
            <div className="space-y-4">
              <div className="relative aspect-video bg-black rounded-md overflow-hidden">
                <img 
                  src={previewPhoto.image_url} 
                  alt="Preview" 
                  className="object-contain w-full h-full" 
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Caption</label>
                    {isEditing ? (
                      <input
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={editForm.caption}
                        onChange={(e) => setEditForm(prev => ({ ...prev, caption: e.target.value }))}
                        placeholder="Add a caption..."
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground min-h-[20px]">{previewPhoto.caption || 'No caption'}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium">Description</label>
                    {isEditing ? (
                      <textarea
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={editForm.description}
                        onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Add a description..."
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{previewPhoto.description || 'No description'}</p>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    {isEditing ? (
                      <>
                        <Button onClick={savePhotoDetails}>Save Changes</Button>
                        <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                      </>
                    ) : (
                      <Button variant="outline" onClick={() => setIsEditing(true)}>Edit Details</Button>
                    )}
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="font-semibold">Latitude</p>
                      <p className="font-mono text-xs">{previewPhoto.latitude?.toFixed(7)}</p>
                    </div>
                    <div>
                      <p className="font-semibold">Longitude</p>
                      <p className="font-mono text-xs">{previewPhoto.longitude?.toFixed(7)}</p>
                    </div>
                  </div>
                  <div>
                    <p className="font-semibold">Created At</p>
                    <p>{new Date(previewPhoto.created_at).toLocaleString()}</p>
                  </div>
                  <div className="pt-4">
                    <Button 
                      onClick={() => downloadPhoto(previewPhoto)}
                      className="w-full"
                      variant="secondary"
                    >
                      <Download className="h-4 w-4 mr-2" /> Download Photo
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Floating Map - Bottom Right */}
      {coords && <FloatingMap latitude={coords.latitude} longitude={coords.longitude} />}
    </div>
  );
};

export default GeotagPage;
