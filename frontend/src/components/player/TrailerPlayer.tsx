'use client';

import { useState, useEffect, useRef } from 'react';
import Hls from 'hls.js';
import { Play, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TrailerPlayerProps {
  trailerUrl: string;
  posterUrl?: string;
  title: string;
  className?: string;
}

type TrailerType = 'youtube' | 'vimeo' | 'hls' | 'direct';

function getTrailerType(url: string): TrailerType {
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    return 'youtube';
  }
  if (url.includes('vimeo.com')) {
    return 'vimeo';
  }
  if (url.endsWith('.m3u8')) {
    return 'hls';
  }
  return 'direct';
}

function getYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?/]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function getVimeoVideoId(url: string): string | null {
  const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return match ? match[1] : null;
}

export function TrailerPlayer({ trailerUrl, posterUrl, title, className }: TrailerPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const trailerType = getTrailerType(trailerUrl);

  useEffect(() => {
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, []);

  const handlePlay = () => {
    setIsPlaying(true);
    setIsLoading(true);
  };

  // Initialize HLS for self-hosted trailers
  useEffect(() => {
    if (!isPlaying || trailerType !== 'hls' || !videoRef.current) return;

    const video = videoRef.current;

    if (Hls.isSupported()) {
      const hls = new Hls();
      hlsRef.current = hls;
      hls.loadSource(trailerUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false);
        video.play();
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = trailerUrl;
      video.addEventListener('loadedmetadata', () => {
        setIsLoading(false);
        video.play();
      });
    }
  }, [isPlaying, trailerType, trailerUrl]);

  // YouTube embed
  if (isPlaying && trailerType === 'youtube') {
    const videoId = getYouTubeVideoId(trailerUrl);
    return (
      <div className={cn('relative aspect-video bg-black rounded-lg overflow-hidden', className)}>
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
          className="absolute inset-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title={`${title} trailer`}
        />
      </div>
    );
  }

  // Vimeo embed
  if (isPlaying && trailerType === 'vimeo') {
    const videoId = getVimeoVideoId(trailerUrl);
    return (
      <div className={cn('relative aspect-video bg-black rounded-lg overflow-hidden', className)}>
        <iframe
          src={`https://player.vimeo.com/video/${videoId}?autoplay=1`}
          className="absolute inset-0 w-full h-full"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          title={`${title} trailer`}
        />
      </div>
    );
  }

  // HLS or direct video
  if (isPlaying && (trailerType === 'hls' || trailerType === 'direct')) {
    return (
      <div className={cn('relative aspect-video bg-black rounded-lg overflow-hidden', className)}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            <Loader2 className="w-12 h-12 text-white animate-spin" />
          </div>
        )}
        <video
          ref={videoRef}
          className="w-full h-full"
          poster={posterUrl}
          controls
          playsInline
          autoPlay={trailerType === 'direct'}
          src={trailerType === 'direct' ? trailerUrl : undefined}
          onLoadedData={() => setIsLoading(false)}
          title={`${title} trailer`}
        />
      </div>
    );
  }

  // Poster with play button
  return (
    <div
      className={cn(
        'relative aspect-video bg-gray-900 rounded-lg overflow-hidden cursor-pointer group',
        className
      )}
      onClick={handlePlay}
    >
      {posterUrl && (
        <img
          src={posterUrl}
          alt={`${title} trailer`}
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}
      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors" />
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center group-hover:scale-110 transition-transform">
          <Play className="w-8 h-8 text-white ml-1" fill="white" />
        </div>
        <span className="text-white font-medium mt-4">Watch Trailer</span>
      </div>
    </div>
  );
}
