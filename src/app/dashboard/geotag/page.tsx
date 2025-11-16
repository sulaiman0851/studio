'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

interface GeotaggedPhoto {
  id: string;
  image_url: string;
  latitude: number;
  longitude: number;
  created_at: string;
}

const GeotagPage = () => {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [photos, setPhotos] = useState<GeotaggedPhoto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingGallery, setIsLoadingGallery] = useState(true);

  // Get camera and location permissions
  useEffect(() => {
    const getPermissions = async () => {
      try {
        // Get location
        navigator.geolocation.watchPosition(
          (position) => {
            setCoords({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
          },
          (err) => {
            setError(`Location error: ${err.message}`);
            toast({ title: 'Location Error', description: err.message, variant: 'destructive' });
          }
        );

        // Get camera stream
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        let message = 'An unknown error occurred';
        if (err instanceof Error) {
            message = err.message;
        }
        setError(`Permission error: ${message}`);
        toast({ title: 'Permission Error', description: message, variant: 'destructive' });
      }
    };

    getPermissions();

    // Cleanup
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream, toast]);

  // Fetch gallery photos
  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        const response = await fetch('/api/geotag/photos');
        if (!response.ok) {
          throw new Error('Failed to fetch photos');
        }
        const data = await response.json();
        setPhotos(data);
      } catch (err) {
        let message = 'An unknown error occurred';
        if (err instanceof Error) {
            message = err.message;
        }
        toast({ title: 'Error', description: `Could not load gallery: ${message}`, variant: 'destructive' });
      } finally {
        setIsLoadingGallery(false);
      }
    };
    fetchPhotos();
  }, [toast]);

  const takePhoto = async () => {
    if (!videoRef.current || !canvasRef.current || !coords) {
        toast({ title: 'Error', description: 'Camera or location not ready.', variant: 'destructive' });
        return;
    }
    setIsUploading(true);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) {
        toast({ title: 'Error', description: 'Could not get canvas context.', variant: 'destructive' });
        setIsUploading(false);
        return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
    
    context.fillStyle = 'white';
    context.font = '20px Arial';
    context.shadowColor = 'black';
    context.shadowBlur = 7;
    const coordText = `Lat: ${coords.latitude.toFixed(5)}, Lon: ${coords.longitude.toFixed(5)}`;
    context.fillText(coordText, 20, canvas.height - 20);

    const dataUrl = canvas.toDataURL('image/jpeg');

    try {
        const response = await fetch('/api/geotag/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                image: dataUrl,
                latitude: coords.latitude,
                longitude: coords.longitude,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to upload photo');
        }
        
        const newPhoto = await response.json();
        // Manually refetch or add to state to update gallery instantly
        setPhotos(prevPhotos => [{...newPhoto, image_url: newPhoto.url, created_at: new Date().toISOString(), id: ''}, ...prevPhotos]);

        toast({ title: 'Photo Uploaded!', description: 'Saved to your gallery.' });

    } catch (err) {
        let message = 'An unknown error occurred';
        if (err instanceof Error) {
            message = err.message;
        }
        toast({ title: 'Upload Error', description: message, variant: 'destructive' });
    } finally {
        setIsUploading(false);
    }
  };

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
          <Button onClick={takePhoto} disabled={!stream || !coords || isUploading}>
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
