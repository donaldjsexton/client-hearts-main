import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Camera } from 'lucide-react';
import { useCreateSession } from '@/hooks/useSessions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';

export default function Index() {
  const [sessionName, setSessionName] = useState('');
  const navigate = useNavigate();
  const createSession = useCreateSession();

  const handleCreate = async () => {
    if (!sessionName.trim()) return;
    try {
      const session = await createSession.mutateAsync(sessionName.trim());
      toast.success('Session created! Redirecting to dashboard...');
      navigate(`/review/${session.review_token}`);
    } catch {
      toast.error('Failed to create session');
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Camera className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Deliverable</CardTitle>
          <CardDescription>
            Create a photo session to share with your clients for proofing.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            value={sessionName}
            onChange={(e) => setSessionName(e.target.value)}
            placeholder="Enter session name (e.g., Smith Wedding)"
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          />
          <Button 
            className="w-full gap-2" 
            onClick={handleCreate}
            disabled={!sessionName.trim() || createSession.isPending}
          >
            <Plus size={18} />
            {createSession.isPending ? 'Creating...' : 'Create Session'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}