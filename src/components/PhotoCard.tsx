import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PhotoCardProps {
  url: string;
  isFavorited: boolean;
  onToggle: () => void;
}

export function PhotoCard({ url, isFavorited, onToggle }: PhotoCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-lg bg-muted aspect-square">
      <img
        src={url}
        alt="Photo"
        className="w-full h-full object-cover transition-transform group-hover:scale-105"
        loading="lazy"
      />
      <button
        onClick={onToggle}
        className={cn(
          "absolute bottom-3 right-3 p-2 rounded-full transition-all",
          "bg-background/80 backdrop-blur-sm hover:bg-background",
          "shadow-lg hover:shadow-xl"
        )}
      >
        <Heart
          className={cn(
            "h-6 w-6 transition-colors",
            isFavorited ? "fill-primary text-primary" : "text-muted-foreground hover:text-primary"
          )}
        />
      </button>
    </div>
  );
}
