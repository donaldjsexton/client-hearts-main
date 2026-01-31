import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Trash2, Download, Copy, ChevronDown, ExternalLink, Image } from 'lucide-react';
import { useSessionByReviewToken, useAllSessions } from '@/hooks/useSession';
import { usePhotos, useAddPhotos, useDeletePhoto } from '@/hooks/usePhotos';
import { useAllFavorites } from '@/hooks/useFavorites';
import { useCreateSession, useDeleteSession } from '@/hooks/useSessions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { parseDeliverableLink, listGalleries, getGalleryManifest } from '@/lib/deliverableClient';
import { supabase } from '@/integrations/supabase/client';

export default function Review() {
  const { reviewToken } = useParams<{ reviewToken: string }>();
  const navigate = useNavigate();
  
  const { data: session, isLoading: sessionLoading, error: sessionError } = useSessionByReviewToken(reviewToken);
  const { data: allSessions = [] } = useAllSessions();
  const { data: photos = [] } = usePhotos(session?.id);
  const { data: allFavorites = [] } = useAllFavorites(session?.id);
  
  const createSession = useCreateSession();
  const deleteSession = useDeleteSession();
  const addPhotos = useAddPhotos();
  const deletePhoto = useDeletePhoto();
  
  const [newSessionName, setNewSessionName] = useState('');
  const [deliverableInput, setDeliverableInput] = useState('');
  const [deliverableBaseUrl, setDeliverableBaseUrl] = useState<string | null>(null);
  const [deliverableShareToken, setDeliverableShareToken] = useState<string | undefined>();
  const [galleries, setGalleries] = useState<Array<{ id: string; title: string; photoCount: number }>>([]);
  const [selectedGalleryId, setSelectedGalleryId] = useState<string>('');
  const [showImport, setShowImport] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const getFilename = (url: string) => {
    try {
      const parsed = new URL(url);
      const parts = parsed.pathname.split('/').filter(Boolean);
      return parts[parts.length - 1] || parsed.hostname;
    } catch {
      return url;
    }
  };

  const toCsvCell = (value: string) => {
    const needsQuotes = /[",\n]/.test(value);
    const escaped = value.replace(/"/g, '""');
    return needsQuotes ? `"${escaped}"` : escaped;
  };

  // Most loved photos ranked by total favorites
  const mostLoved = useMemo(() => {
    const counts = new Map<string, number>();
    allFavorites.forEach(f => {
      counts.set(f.photo_id, (counts.get(f.photo_id) || 0) + 1);
    });
    return photos
      .map(p => ({ ...p, count: counts.get(p.id) || 0 }))
      .filter(p => p.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [photos, allFavorites]);

  // Group favorites by client
  const byClient = useMemo(() => {
    const clientMap = new Map<string, { photoIds: string[]; count: number }>();
    allFavorites.forEach(f => {
      const existing = clientMap.get(f.client_id) || { photoIds: [], count: 0 };
      existing.photoIds.push(f.photo_id);
      existing.count++;
      clientMap.set(f.client_id, existing);
    });
    return Array.from(clientMap.entries()).map(([clientId, data]) => ({
      clientId,
      ...data,
    }));
  }, [allFavorites]);

  const handleCreateSession = async () => {
    if (!newSessionName.trim()) return;
    try {
      const newSession = await createSession.mutateAsync(newSessionName.trim());
      setNewSessionName('');
      navigate(`/review/${newSession.review_token}`);
      toast.success('Session created!');
    } catch {
      toast.error('Failed to create session');
    }
  };

  const handleConnectDeliverable = async () => {
    if (!deliverableInput.trim()) return;
    try {
      setIsConnecting(true);
      const parsed = parseDeliverableLink(deliverableInput.trim());
      const result = await listGalleries(parsed.baseUrl, parsed.shareToken);
      setDeliverableBaseUrl(parsed.baseUrl);
      setDeliverableShareToken(parsed.shareToken);
      setGalleries(result.galleries);
      setSelectedGalleryId(result.galleries[0]?.id ?? '');
      toast.success('Connected to Deliverable');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to connect to Deliverable';
      toast.error(message);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleImportGallery = async () => {
    if (!session || !deliverableBaseUrl || !selectedGalleryId) return;
    try {
      setIsImporting(true);
      const manifest = await getGalleryManifest(deliverableBaseUrl, selectedGalleryId, deliverableShareToken);
      const existingUrls = new Set(photos.map(p => p.url));
      const photosToInsert = manifest.photos
        .filter(photo => !existingUrls.has(photo.url))
        .map(photo => ({
          url: photo.url,
          deliverable_photo_id: photo.id,
          filename: photo.filename ?? getFilename(photo.url),
          sort_order: photo.sortOrder ?? null,
        }));
      if (photosToInsert.length === 0) {
        toast.error('No new photos to import');
        return;
      }
      await addPhotos.mutateAsync({ sessionId: session.id, photos: photosToInsert });
      const { error } = await supabase
        .from('sessions')
        .update({
          deliverable_base_url: deliverableBaseUrl,
          deliverable_gallery_id: selectedGalleryId,
          deliverable_share_token: deliverableShareToken ?? null,
          imported_at: new Date().toISOString(),
        })
        .eq('id', session.id);
      if (error) throw error;
      toast.success(`Imported ${photosToInsert.length} photo(s)`);
      setShowImport(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to import gallery';
      toast.error(message);
    } finally {
      setIsImporting(false);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      await deleteSession.mutateAsync(sessionId);
      toast.success('Session deleted');
      if (session?.id === sessionId) {
        navigate('/');
      }
    } catch {
      toast.error('Failed to delete session');
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    try {
      await deletePhoto.mutateAsync(photoId);
      toast.success('Photo deleted');
    } catch {
      toast.error('Failed to delete photo');
    }
  };

  const copyLink = (token: string) => {
    const url = `${window.location.origin}/gallery/${token}`;
    navigator.clipboard.writeText(url);
    toast.success('Client link copied!');
  };

  const exportCSV = () => {
    if (!session) return;
    const headers = ['session_name', 'session_id', 'photo_id', 'url', 'filename', 'deliverable_photo_id', 'client_id', 'favorited_at'];
    const rows = allFavorites.map(f => {
      const photo = photos.find(p => p.id === f.photo_id);
      return [
        session.name,
        session.id,
        f.photo_id,
        photo?.url || '',
        photo?.filename || '',
        photo?.deliverable_photo_id || '',
        f.client_id,
        f.created_at,
      ].map((value) => toCsvCell(value)).join(',');
    });
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${session.name}-favorites.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported!');
  };

  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  if (sessionError || !session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-semibold text-foreground">Review Dashboard Not Found</h1>
          <p className="text-muted-foreground">This review link may be invalid.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold text-foreground">Deliverable</h1>
          <p className="text-sm text-muted-foreground">Photographer Review Dashboard</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Current Session Info */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{session.name}</CardTitle>
                <CardDescription>{photos.length} photos · {allFavorites.length} total favorites</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => copyLink(session.session_token)}>
                  <Copy size={16} className="mr-1" /> Copy Client Link
                </Button>
                <Button variant="outline" size="sm" onClick={exportCSV} disabled={allFavorites.length === 0}>
                  <Download size={16} className="mr-1" /> Export CSV
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Import from Deliverable */}
            <Collapsible open={showImport} onOpenChange={setShowImport}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  <span className="flex items-center gap-2">
                    <Plus size={16} /> Import from Deliverable
                  </span>
                  <ChevronDown className={cn("h-4 w-4 transition-transform", showImport && "rotate-180")} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-4 space-y-4">
                <div className="space-y-2">
                  <Input
                    value={deliverableInput}
                    onChange={(e) => setDeliverableInput(e.target.value)}
                    placeholder="Deliverable share link or base URL"
                  />
                  <Button
                    onClick={handleConnectDeliverable}
                    disabled={!deliverableInput.trim() || isConnecting}
                  >
                    {isConnecting ? 'Connecting...' : 'Connect'}
                  </Button>
                </div>

                {galleries.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Select a gallery</label>
                    <select
                      className="w-full border rounded-md bg-background p-2 text-sm"
                      value={selectedGalleryId}
                      onChange={(e) => setSelectedGalleryId(e.target.value)}
                    >
                      {galleries.map((gallery) => (
                        <option key={gallery.id} value={gallery.id}>
                          {gallery.title} ({gallery.photoCount})
                        </option>
                      ))}
                    </select>
                    <Button
                      onClick={handleImportGallery}
                      disabled={!selectedGalleryId || isImporting || addPhotos.isPending}
                    >
                      {isImporting ? 'Importing...' : 'Import selected gallery'}
                    </Button>
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>

            {/* Photo List */}
            {photos.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-muted-foreground">Photos in this session</h4>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {photos.map((photo) => (
                    <div key={photo.id} className="relative group aspect-square">
                      <img src={photo.url} alt="" className="w-full h-full object-cover rounded-md" />
                      <button
                        onClick={() => handleDeletePhoto(photo.id)}
                        className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Most Loved */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Most Loved</CardTitle>
            <CardDescription>Photos ranked by total favorites across all clients</CardDescription>
          </CardHeader>
          <CardContent>
            {mostLoved.length === 0 ? (
              <p className="text-muted-foreground text-sm">No favorites yet.</p>
            ) : (
              <div className="w-full overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted-foreground border-b">
                      <th className="py-2 pr-2">#</th>
                      <th className="py-2 pr-2">Photo</th>
                      <th className="py-2 pr-2">Filename / URL</th>
                      <th className="py-2">Favorites</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mostLoved.map((photo, i) => (
                      <tr key={photo.id} className="border-b last:border-b-0">
                        <td className="py-2 pr-2 font-medium">{i + 1}</td>
                        <td className="py-2 pr-2">
                          <img src={photo.url} alt="" className="w-12 h-12 object-cover rounded-md" />
                        </td>
                        <td className="py-2 pr-2">
                          <div className="font-medium">{getFilename(photo.url)}</div>
                          <div className="text-muted-foreground truncate max-w-[240px]">{photo.url}</div>
                        </td>
                        <td className="py-2 font-semibold">{photo.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* By Client Session */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">By Client Session</CardTitle>
            <CardDescription>Favorites grouped by anonymous client</CardDescription>
          </CardHeader>
          <CardContent>
            {byClient.length === 0 ? (
              <p className="text-muted-foreground text-sm">No client sessions yet.</p>
            ) : (
              <Accordion type="multiple" className="space-y-2">
                {byClient.map((client) => (
                  <AccordionItem key={client.clientId} value={client.clientId} className="border rounded-md px-3">
                    <AccordionTrigger className="text-sm hover:no-underline">
                      <span>
                        Client {client.clientId.slice(0, 8)}... 
                        <span className="text-muted-foreground ml-2">({client.count} favorites)</span>
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-4 gap-2 py-2">
                        {client.photoIds.map((photoId) => {
                          const photo = photos.find(p => p.id === photoId);
                          if (!photo) return null;
                          return (
                            <img
                              key={photoId}
                              src={photo.url}
                              alt=""
                              className="w-full aspect-square object-cover rounded-md"
                            />
                          );
                        })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </CardContent>
        </Card>

        {/* Session Management */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">All Sessions</CardTitle>
            <CardDescription>Manage your photo sessions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Create new session */}
            <div className="flex gap-2">
              <Input
                value={newSessionName}
                onChange={(e) => setNewSessionName(e.target.value)}
                placeholder="New session name"
                onKeyDown={(e) => e.key === 'Enter' && handleCreateSession()}
              />
              <Button onClick={handleCreateSession} disabled={!newSessionName.trim() || createSession.isPending}>
                <Plus size={16} className="mr-1" /> Create
              </Button>
            </div>

            {/* Session list */}
            <div className="space-y-2">
              {allSessions.map((s) => (
                <div
                  key={s.id}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-md border",
                    s.id === session.id && "bg-muted"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Image size={16} className="text-muted-foreground" />
                    <span className="font-medium">{s.name}</span>
                  </div>
                  <div className="flex gap-2">
                    {s.id !== session.id && (
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/review/${s.review_token}`)}>
                        <ExternalLink size={14} />
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => copyLink(s.session_token)}>
                      <Copy size={14} />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteSession(s.id)}>
                      <Trash2 size={14} className="text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
