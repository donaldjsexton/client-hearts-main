# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## Environment variables

Create a `.env` file with:

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

## Deliverable import flow

The review dashboard supports importing photos from a Deliverable share link:
1) Paste a Deliverable share link or base URL.
2) Connect to load available galleries.
3) Select a gallery and import photos into the proofing session.

The import expects Deliverable to expose the following public endpoints:

```
GET {baseUrl}/api/public/galleries?shareToken={shareToken}
```

Response:
```
{
  "galleries": [
    { "id": "gal_123", "title": "Smith Wedding", "photoCount": 220 }
  ]
}
```

```
GET {baseUrl}/api/public/galleries/{galleryId}/manifest?shareToken={shareToken}
```

Response:
```
{
  "gallery": { "id": "gal_123", "title": "Smith Wedding" },
  "photos": [
    { "id": "p1", "url": "https://cdn.../IMG_0001.jpg", "filename": "IMG_0001.jpg", "sortOrder": 1 }
  ]
}
```

## Files modified and migrations added

- `src/pages/Review.tsx`
- `src/hooks/usePhotos.ts`
- `src/lib/deliverableClient.ts`
- `src/integrations/supabase/types.ts`
- `supabase/migrations/20260131163000_add_deliverable_import_fields.sql`

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
