import { PhotoCard } from './PhotoCard';

interface Photo {
  id: string;
  url: string;
}

interface PhotoGridProps {
  photos: Photo[];
  favoritedIds: Set<string>;
  onToggleFavorite: (photoId: string, isFavorited: boolean) => void;
}

export function PhotoGrid({ photos, favoritedIds, onToggleFavorite }: PhotoGridProps) {
  if (photos.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        No photos in this gallery yet.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {photos.map((photo) => (
        <PhotoCard
          key={photo.id}
          url={photo.url}
          isFavorited={favoritedIds.has(photo.id)}
          onToggle={() => onToggleFavorite(photo.id, favoritedIds.has(photo.id))}
        />
      ))}
    </div>
  );
}
