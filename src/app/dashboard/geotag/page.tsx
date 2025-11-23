'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/use-auth';

interface GeotaggedPhoto {
  id: string;
  image_url: string;
  latitude: number;
  longitude: number;
  created_at: string;
}

const GeotagPage = () => {
  const { toast } = useToast();
  const { currentUser, loading: authLoading } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [photos, setPhotos] = useState<GeotaggedPhoto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingGallery, setIsLoadingGallery] = useState(true);

  // Permissions: camera + geolocation
  useEffect(() => {
    const getPermissions = async () => {
      try {
        navigator.geolocation.watchPosition(
          (position) => {
            setCoords({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
          },
          (err) => {
            const msg = `Location error: ${err.message}`;
            setError(msg);
            toast({ title: 'Location Error', description: err.message, variant: 'destructive' });
          }
        );
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        setStream(mediaStream);
        if (videoRef.current) videoRef.current.srcObject = mediaStream;
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Permission error';
        setError(`Permission error: ${msg}`);
        toast({ title: 'Permission Error', description: msg, variant: 'destructive' });
      }
    };
    getPermissions();
    return () => {
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // Load gallery photos
  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        const response = await fetch('/api/geotag/photos', { credentials: 'include' });
        if (!response.ok) throw new Error('Failed to fetch photos');
        const data = await response.json();
        setPhotos(data);
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Unknown error';
        toast({ title: 'Error', description: `Could not load gallery: ${msg}`, variant: 'destructive' });
      } finally {
        setIsLoadingGallery(false);
      }
    };
    fetchPhotos();
  }, [toast]);

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
    ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.shadowColor = 'black';
    ctx.shadowBlur = 7;
    const coordText = `Lat: ${coords.latitude.toFixed(5)}, Lon: ${coords.longitude.toFixed(5)}`;
    ctx.fillText(coordText, 20, canvas.height - 20);
    const dataUrl = canvas.toDataURL('image/jpeg');

    // Convert dataURL to Blob/File
    const blob = await (await fetch(dataUrl)).blob();
    const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
    const formData = new FormData();
    formData.append('file', file);
    formData.append('latitude', coords.latitude.toString());
    formData.append('longitude', coords.longitude.toString());

    try {
      const response = await fetch('/api/geotag/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include', // send auth cookie
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

  // Render UI
  return (
    <div className="p-4 md:p-8">
      <Card>
        <CardHeader>
          <CardTitle>Geotag Photo</CardTitle>
        </CardHeader>
        <CardContent>
          {error && <div className="text-red-500 mb-4">{error}</div>}
          <div className="relative mb-4">
            <video ref={videoRef} autoPlay playsInline className="w-full rounded-md" />
            {coords && (
              <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs p-1 rounded">
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
            <p>Loading gallery...</p>
          ) : photos.length === 0 ? (
            <p>No photos taken yet.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {photos.map((photo) => (
                <div key={photo.id || photo.created_at} className="relative">
                  <img src={photo.image_url} alt={`Geotagged at ${photo.created_at}`} className="w-full rounded-md" />
                  <div className="absolute bottom-0 left-0 bg-black bg-opacity-50 text-white text-xs p-1 rounded-b-md w-full">
                    <p>Lat: {photo.latitude.toFixed(5)}</p>
                    <p>Lon: {photo.longitude.toFixed(5)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GeotagPage;
