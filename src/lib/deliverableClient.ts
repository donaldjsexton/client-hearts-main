type DeliverableGallery = {
  id: string;
  title: string;
  photoCount: number;
};

type DeliverableManifestPhoto = {
  id: string;
  url: string;
  filename?: string | null;
  sortOrder?: number | null;
};

export function parseDeliverableLink(input: string): { baseUrl: string; shareToken?: string } {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    throw new Error('Please enter a valid Deliverable URL');
  }

  const baseUrl = url.origin;
  const pathParts = url.pathname.split('/').filter(Boolean);
  let shareToken: string | undefined;

  if (pathParts[0] === 'share' || pathParts[0] === 'g') {
    shareToken = pathParts[1];
  }

  return { baseUrl, shareToken };
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const message = `Deliverable request failed (${response.status})`;
    throw new Error(message);
  }
  return response.json() as Promise<T>;
}

export async function listGalleries(baseUrl: string, shareToken?: string): Promise<{ galleries: DeliverableGallery[] }> {
  const url = new URL('/api/public/galleries', baseUrl);
  if (shareToken) {
    url.searchParams.set('shareToken', shareToken);
  }
  try {
    const response = await fetch(url.toString());
    return await handleResponse<{ galleries: DeliverableGallery[] }>(response);
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error('Unable to reach Deliverable. Check the link and ensure CORS is enabled.');
    }
    throw error;
  }
}

export async function getGalleryManifest(baseUrl: string, galleryId: string, shareToken?: string): Promise<{ gallery: { id: string; title: string }; photos: DeliverableManifestPhoto[] }> {
  const url = new URL(`/api/public/galleries/${galleryId}/manifest`, baseUrl);
  if (shareToken) {
    url.searchParams.set('shareToken', shareToken);
  }
  try {
    const response = await fetch(url.toString());
    return await handleResponse<{ gallery: { id: string; title: string }; photos: DeliverableManifestPhoto[] }>(response);
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error('Unable to reach Deliverable. Check the link and ensure CORS is enabled.');
    }
    throw error;
  }
}
