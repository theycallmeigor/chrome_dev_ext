# CheckoutChamp Funnel Tracker - Web App

A modern web application for tracking and managing CheckoutChamp e-commerce funnels and pages. This app syncs with the Chrome extension and provides a centralized dashboard for viewing, organizing, and analyzing your funnel data.

## Features

- 📊 **Comprehensive Dashboard** - View all your funnels at a glance
- 🔍 **Advanced Search & Filtering** - Find funnels by name, domain, page type, and more
- ⭐ **Favorites & Pinning** - Mark important funnels for quick access
- 📝 **Notes & Tags** - Add context and organize your funnels
- 🔀 **A/B Test Tracking** - Identify and track split-tested pages
- 📤 **Import/Export** - Seamlessly sync with Chrome extension data
- 📊 **CSV Export** - Export funnel pages for analysis
- 📈 **Statistics Dashboard** - Track your total funnels, pages, and more

## Prerequisites

Before you begin, make sure you have installed:

- **Node.js** (version 18 or higher)
  - Download from: https://nodejs.org/
  - To check if installed: Open terminal and run `node --version`

- **npm** (comes with Node.js)
  - To check if installed: Run `npm --version`

## Quick Start (Local Development)

### 1. Navigate to the web-app directory

```bash
cd web-app
```

### 2. Install dependencies

```bash
npm install
```

This will install all required packages (may take 1-2 minutes).

### 3. Start the development server

```bash
npm run dev
```

### 4. Open your browser

Navigate to: **http://localhost:3000**

You should see the CheckoutChamp Funnel Tracker dashboard!

### 5. Import your data

1. Click the **"Import JSON"** button
2. Select your exported JSON file from the Chrome extension
3. Your funnels will appear in the dashboard

## Project Structure

```
web-app/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── funnels/      # Funnel CRUD operations
│   │   ├── pages/        # Page operations
│   │   ├── import/       # Import from extension
│   │   ├── export/       # Export to extension format
│   │   └── stats/        # Statistics
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Home page
├── components/            # React components
│   ├── Dashboard.tsx     # Main dashboard
│   ├── FunnelCard.tsx    # Funnel display card
│   ├── SearchBar.tsx     # Search functionality
│   ├── FilterBar.tsx     # Filters
│   ├── StatsBar.tsx      # Statistics display
│   └── ImportExport.tsx  # Import/Export UI
├── lib/                   # Utilities and database
│   ├── db.ts             # SQLite database connection
│   ├── database-utils.ts # Database operations
│   └── types.ts          # TypeScript types
├── public/               # Static files
└── checkout-champ.db     # SQLite database (created automatically)
```

## Database

The app uses **SQLite** for data storage. The database file (`checkout-champ.db`) is created automatically in the project root when you first run the app.

- **Location**: `web-app/checkout-champ.db`
- **Backup**: Simply copy this file to back up your data
- **Reset**: Delete this file to start fresh (will be recreated)

## Deployment Options

### Option 1: Vercel (Recommended - Easiest)

Vercel is the easiest way to deploy Next.js apps. It's **free** for personal projects!

#### Step-by-Step:

1. **Create a Vercel account**
   - Go to: https://vercel.com/signup
   - Sign up with GitHub (recommended)

2. **Install Vercel CLI** (optional, for command-line deployment)
   ```bash
   npm install -g vercel
   ```

3. **Deploy from GitHub** (Easiest method):
   - Push your code to GitHub
   - Go to https://vercel.com/new
   - Import your repository
   - Vercel will auto-detect Next.js and configure everything
   - Click "Deploy"

4. **Deploy from CLI** (Alternative):
   ```bash
   cd web-app
   vercel
   ```
   - Follow the prompts
   - Your app will be live in minutes!

#### Important Note for Vercel:

**SQLite doesn't work on Vercel** (serverless environment). You'll need to use a different database:

- **Option A**: Use **Vercel Postgres** (free tier available)
  - Follow: https://vercel.com/docs/storage/vercel-postgres

- **Option B**: Use **Turso** (SQLite-compatible, serverless)
  - Sign up: https://turso.tech/
  - Follow their Next.js guide

### Option 2: Railway (SQLite Supported)

Railway supports SQLite since it provides a persistent file system.

#### Step-by-Step:

1. **Create a Railway account**
   - Go to: https://railway.app/
   - Sign up with GitHub

2. **Create a new project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository

3. **Configure**
   - Railway will auto-detect Next.js
   - Add environment variable: `NODE_ENV=production`
   - Deploy!

4. **Your app will be live** at a Railway-provided URL

**Cost**: Free tier includes $5/month credit (usually enough for small projects)

### Option 3: Local Network (For Local Use Only)

Run the app on your local network so other devices can access it:

```bash
npm run dev -- -H 0.0.0.0
```

Then access from other devices using: `http://YOUR_LOCAL_IP:3000`

To find your local IP:
- **Mac/Linux**: Run `ifconfig | grep inet`
- **Windows**: Run `ipconfig` and look for "IPv4 Address"

### Option 4: Docker (Advanced)

If you're familiar with Docker:

1. **Create a Dockerfile** in the web-app directory:

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

2. **Build and run**:
```bash
docker build -t checkout-champ-tracker .
docker run -p 3000:3000 -v $(pwd)/checkout-champ.db:/app/checkout-champ.db checkout-champ-tracker
```

## Environment Variables

For production, create a `.env.local` file:

```env
NODE_ENV=production
```

## Troubleshooting

### "Module not found" errors

```bash
rm -rf node_modules package-lock.json
npm install
```

### Port 3000 is already in use

Change the port:
```bash
npm run dev -- -p 3001
```

### Database locked error

Close other processes accessing the database:
```bash
rm checkout-champ.db
# Database will be recreated automatically
```

### Build errors

Make sure you're using Node 18+:
```bash
node --version
```

Update if needed from: https://nodejs.org/

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run linting

### Adding New Features

The codebase is organized for easy extension:

1. **New API routes**: Add to `app/api/`
2. **New components**: Add to `components/`
3. **Database operations**: Add to `lib/database-utils.ts`
4. **Types**: Add to `lib/types.ts`

## Syncing with Chrome Extension

### Exporting from Extension

1. Open the Chrome extension
2. Go to "Database" view
3. Click "Export History"
4. Save the JSON file

### Importing to Web App

1. Open the web app
2. Click "Import JSON"
3. Select the exported file
4. Your data will be imported

### Exporting from Web App

1. Click "Export JSON" in the web app
2. Save the file
3. Import it back into the Chrome extension using "Import History"

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: SQLite (better-sqlite3)
- **Runtime**: Node.js 18+

## Support & Issues

If you encounter any issues:

1. Check the troubleshooting section above
2. Make sure all dependencies are installed
3. Ensure you're using Node 18 or higher
4. Try deleting `node_modules` and reinstalling

## License

MIT License - Feel free to modify and use as needed!

---

**Made with ❤️ for CheckoutChamp users**
