# Hemingway Claude Frontend Fixed

This folder contains the Claude-style frontend, cleaned up so it can replace the earlier dummy Next.js files.

## Copy into your project

From inside this extracted folder:

```bash
cp -R app components lib .env.example next.config.mjs tsconfig.json package.json /path/to/your/hemingway-ors-next-dummy/
```

Or copy the directories manually in VS Code.

## Run

```bash
cd /path/to/your/hemingway-ors-next-dummy
npm install
cp .env.example .env.local
npm run dev
```

## ORS env

```env
ORS_API_BASE=https://api.ors.si/crs/v2
ORS_API_KEY=your-real-key
```

Without a key, the site runs in mock mode.
