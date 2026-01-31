import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useSessionByToken } from '@/hooks/useSession';
import { usePhotos } from '@/hooks/usePhotos';
import { useFavorites, useToggleFavorite } from '@/hooks/useFavorites';
import { PhotoGrid } from '@/components/PhotoGrid';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export default function Gallery() {
  const { sessionToken } = useParams<{ sessionToken: string }>();
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  
  const { data: session, isLoading: sessionLoading, error: sessionError } = useSessionByToken(sessionToken);
  const { data: photos = [], isLoading: photosLoading } = usePhotos(session?.id);
  const { data: favorites = [] } = useFavorites(session?.id);
  const toggleFavorite = useToggleFavorite();

  const favoritedIds = useMemo(() => new Set(favorites.map(f => f.photo_id)), [favorites]);
  
  const displayedPhotos = useMemo(() => {
    if (showFavoritesOnly) {
      return photos.filter(p => favoritedIds.has(p.id));
    }
    return photos;
  }, [photos, favoritedIds, showFavoritesOnly]);

  const handleToggleFavorite = (photoId: string, isFavorited: boolean) => {
    if (!session) return;
    toggleFavorite.mutate({ photoId, sessionId: session.id, isFavorited });
  };

  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (sessionError || !session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-semibold text-foreground">Gallery Not Found</h1>
          <p className="text-muted-foreground">This gallery link may be invalid or expired.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{session.name}</h1>
            <p className="text-sm text-muted-foreground">
              {favorites.length} favorite{favorites.length !== 1 ? 's' : ''} selected
            </p>
          </div>
          <Button
            variant={showFavoritesOnly ? "default" : "outline"}
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            className="gap-2"
          >
            <Heart className={showFavoritesOnly ? "fill-current" : ""} size={18} />
            {showFavoritesOnly ? 'Show All' : 'Favorites Only'}
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {photosLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-lg" />
            ))}
          </div>
        ) : (
          <PhotoGrid
            photos={displayedPhotos}
            favoritedIds={favoritedIds}
            onToggleFavorite={handleToggleFavorite}
          />
        )}
      </main>
    </div>
  );
}
