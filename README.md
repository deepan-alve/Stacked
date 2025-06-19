# 🎬 Stacked - Modern Media Tracking App

**Stacked** is a beautiful, modern media tracking application built with the latest web technologies. Track movies, TV shows, books, anime, games, podcasts, and more in one elegant interface.

![Stacked App](https://img.shields.io/badge/Status-In%20Development-yellow)
![Next.js](https://img.shields.io/badge/Next.js-14+-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue)
![Tailwind](https://img.shields.io/badge/Tailwind-CSS-38bdf8)

## ✨ Features

### 🎨 Modern 2025 Design
- **Glassmorphism UI** with frosted glass effects
- **Gradient text** and neon accent colors (#00C2FF, #FF00C7)
- **Smooth animations** and hover effects
- **Dark theme** optimized for extended use
- **Responsive design** for mobile and desktop

### 📱 Core Functionality
- ✅ **Media Library** - Browse and manage your collection
- ✅ **Manual Entry** - Add media with ratings, notes, and tags
- ✅ **Collections** - Organize media into custom groups
- ✅ **Advanced Filtering** - Search by type, status, rating
- ✅ **Multiple View Modes** - Grid and list layouts
- ✅ **User Profile** - Track stats and progress

### 🚀 Planned Features
- 🔄 **External API Integration** (TMDB, Jikan, Open Library)
- 🔄 **Supabase Authentication** and database
- 🔄 **Real-time sync** across devices
- 🔄 **Social features** and sharing
- 🔄 **Export/Import** functionality
- 🔄 **Mood tracking** and analytics

## 🛠 Tech Stack

### Frontend
- **Next.js 14+** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Shadcn/ui** component library
- **Framer Motion** for animations
- **Lucide React** icons

### Backend (Planned)
- **Supabase** for database and auth
- **PostgreSQL** with Row Level Security
- **Real-time subscriptions**
- **Edge Functions** for API logic

### External APIs (Planned)
- **TMDB** - Movies and TV shows
- **Jikan** - Anime data
- **Open Library** - Book information
- **IGDB** - Game database

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or pnpm

### Installation
```bash
# Install dependencies
npm install

# Set up environment variables
# Edit .env.local with your API keys (when implementing Supabase)

# Start development server
npm run dev
```

Visit `http://localhost:3000` to see the app!

## 📂 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Homepage
│   ├── library/           # Media library
│   ├── add/               # Add new media
│   ├── collections/       # Collections management
│   └── profile/           # User profile
├── components/            # Reusable components
│   ├── ui/               # Shadcn/ui components
│   └── navigation.tsx    # Main navigation
├── lib/                  # Utility functions
│   ├── supabase/         # Supabase client setup
│   └── utils.ts          # Helper utilities
├── store/                # State management
│   └── index.ts          # Zustand stores
└── types/                # TypeScript definitions
    └── index.ts          # App types
```

## 🎨 Design System

### Colors
- **Background**: `#0F0F0F` (Deep black-gray)
- **Primary**: `#00C2FF` (Electric cyan)
- **Accent**: `#FF00C7` (Neon magenta)
- **Card**: `#1A1A1A` (Dark gray)
- **Border**: `#2A2A2A` (Medium gray)

### Typography
- **Headers**: Clash Display / Satoshi Bold
- **Body**: Inter / Space Grotesk
- **Sizes**: 16-18px body, 24-40px headers

### Effects
- **Glassmorphism**: `backdrop-blur-xl` with subtle transparency
- **Glow effects**: Subtle box-shadows on interactive elements
- **Animations**: Smooth transitions and hover states

---

Built with ❤️ using modern web technologies for the ultimate media tracking experience.
