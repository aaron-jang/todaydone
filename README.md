# Daily Loop

A simple, offline-first daily routine tracker built with React, TypeScript, and IndexedDB.

## Features

- ✅ Track daily routines with two types:
  - **Check**: Simple completion checkbox
  - **Time**: Track time spent with +5/+10/+30 minute buttons
- 📊 View history and track your streak
- 💾 All data stored locally in IndexedDB
- 📱 Mobile-friendly responsive design
- 🚀 No server required - works completely offline
- 📦 Export/Import data as JSON
- 🔄 GitHub Pages deployment ready

## Tech Stack

- **Vite** - Build tool
- **React 18** - UI framework
- **TypeScript** - Type safety
- **React Router** (HashRouter) - Client-side routing
- **Dexie** - IndexedDB wrapper
- **CSS** - Simple, mobile-first styling

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd daily-loop
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open http://localhost:5173 in your browser

## Development

### Project Structure

```
src/
├── pages/
│   ├── Today.tsx      # Today's routine checklist
│   ├── Routines.tsx   # Manage routines
│   ├── History.tsx    # View history and streak
│   └── Settings.tsx   # Export/Import/Reset
├── lib/
│   ├── db.ts          # Dexie database setup
│   ├── models.ts      # TypeScript interfaces
│   └── date.ts        # Date utility functions
├── App.tsx            # Main app with HashRouter
├── main.tsx           # Entry point
└── App.css            # Styles
```

### Data Models

**Routine**
```typescript
{
  id: string;
  title: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  type: 'check' | 'time';
  targetMinutes?: number;
}
```

**DailyLog**
```typescript
{
  date: string;           // YYYY-MM-DD
  routineId: string;
  done: boolean;
  updatedAt: string;
  spentMinutes?: number;  // for time-type routines
}
```

## Deployment

### GitHub Pages

1. Update `vite.config.ts` with your repository name:
```typescript
export default defineConfig({
  plugins: [react()],
  base: '/your-repo-name/',  // Change this
})
```

2. Install gh-pages (already in devDependencies):
```bash
npm install
```

3. Build and deploy:
```bash
npm run deploy
```

4. Enable GitHub Pages in your repository settings:
   - Go to Settings > Pages
   - Source: gh-pages branch
   - Your app will be available at: `https://yourusername.github.io/your-repo-name/`

### Manual Deployment

1. Build the project:
```bash
npm run build
```

2. The `dist/` folder contains all static files ready for deployment to any static hosting service.

## Usage

### Adding Routines

1. Go to **Routines** page
2. Enter routine title
3. Select type:
   - **Check**: Simple completion checkbox
   - **Time**: Track time with target minutes
4. Click **Add**

### Daily Usage

1. Open **Today** page
2. For check routines: Click checkbox to mark as done
3. For time routines: Use +5/+10/+30 buttons to add minutes
4. Progress is saved automatically

### Viewing History

1. Go to **History** page
2. View last 14 days of activity
3. See your current streak (consecutive days with all routines completed)

### Data Management

1. Go to **Settings** page
2. **Export**: Download all data as JSON
3. **Import**: Upload previously exported JSON file
4. **Reset**: Delete all data (cannot be undone)

## Browser Support

- Chrome/Edge (recommended)
- Firefox
- Safari (iOS and macOS)

Requires IndexedDB support (available in all modern browsers).

## License

MIT

## Contributing

This is an MVP project. Feel free to fork and customize for your needs!
