# AsetKu - Personal Asset Tracker

Aplikasi pencatat dan pemantau total aset pribadi yang berfokus pada kesederhanaan, kecepatan, dan estetika premium. Didesain mobile-first untuk iPhone dan dapat di-install sebagai PWA.

## Tech Stack

- **Next.js 14** (App Router, Static Export)
- **React 18** + TypeScript (Strict Mode)
- **Tailwind CSS** + shadcn/ui style
- **Zustand** (State Management)
- **Dexie.js** (IndexedDB)
- **React Hook Form** + Zod (Forms)
- **Recharts** (Charts)
- **next-pwa** (PWA)
- **Lucide Icons**

## Fitur

- ✅ Pencatatan aset dengan kategori
- ✅ Sistem transaksi (tambah/kurang)
- ✅ Custom total groups
- ✅ Target aset dengan progress & estimasi
- ✅ Grafik pertumbuhan aset
- ✅ Distribusi aset (pie, bar chart)
- ✅ Search & filter aset
- ✅ Dark mode / Light mode / System
- ✅ Backup & Restore (JSON)
- ✅ PWA (Installable, Offline-first)
- ✅ Mobile-first responsive
- ✅ Data 100% lokal (IndexedDB)

## Instalasi

```bash
# Clone / masuk ke folder project
cd AsetKu

# Install dependencies
npm install

# Jalankan development server
npm run dev

# Buka di browser
# http://localhost:3000
```

## Generate Icons

Untuk production, buat icon 192x192 dan 512x512 pixel:

1. Buat file `public/icon-192.png` (192x192px)
2. Buat file `public/icon-512.png` (512x512px)

Atau gunakan tool seperti [RealFaviconGenerator](https://realfavicongenerator.net/)

## Build & Deploy

### Vercel

```bash
# Build
npm run build

# Deploy (otomatis via Vercel CLI atau GitHub integration)
npx vercel
```

### Cloudflare Pages

```bash
# Build
npm run build

# Output ada di folder 'out/'
# Upload folder 'out/' ke Cloudflare Pages
```

### Manual Static Hosting

```bash
npm run build
# Serve folder 'out/' dengan web server apapun
```

## Install sebagai PWA

### iPhone (Safari)
1. Buka app di Safari
2. Tap tombol Share (↑)
3. Pilih "Add to Home Screen"
4. Tap "Add"

### Android (Chrome)
1. Buka app di Chrome
2. Tap menu (⋮)
3. Pilih "Install app" atau "Add to Home screen"

## Struktur Project

```
src/
├── app/            # Next.js App Router
├── components/
│   ├── layout/     # AppShell, ThemeProvider
│   ├── pages/      # Dashboard, Assets, Statistics, Goals, Settings
│   ├── shared/     # Modal forms, charts
│   └── ui/         # Reusable UI (Card, Button, Input, Modal, Progress)
├── db/             # Dexie.js schema & seed
├── hooks/          # Custom hooks
├── lib/            # Utilities
├── store/          # Zustand store
└── types/          # TypeScript interfaces
```

## Data Flow

```
User Action → Zustand Store → Dexie.js (IndexedDB) → Re-render UI
```

Semua nilai aset dihitung dari histori transaksi, bukan disimpan langsung.

## License

MIT
