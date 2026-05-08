# <div align="center">ANARCH STREAMING</div>

<div align="center">
  <strong>The ultimate minimalist streaming experience.</strong>
</div>

<div align="center">
  <p align="center">
    <a href="#features">Features</a> •
    <a href="#tech-stack">Tech Stack</a> •
    <a href="#getting-started">Getting Started</a> •
    <a href="#social-network">Social Network</a>
  </p>
</div>

---

## 🎬 Project Overview

**Anarch Streaming** is a state-of-the-art, web-based cinema platform designed for film enthusiasts who value speed, aesthetics, and social connectivity. Built with a focus on "Anarch" branding—characterized by its bold typography, dark-mode elegance, and high-performance animations—it offers a seamless way to discover and manage your movie and series collection.

## 🚀 Key Features

- **Dynamic Discovery**: Explore trending titles, popular movies, and must-watch series with real-time data powered by TMDB.
- **Advanced Search**: A global, lightning-fast search overlay that brings you closer to your favorite content instantly.
- **Social Rebel Network**: Connect with friends, explore their viewing habits, and discover new titles through their curated watchlists.
- **Personalized Account**: Manage your identity with customizable profiles, view your streaming history, and sync your data via CSV imports.
- **Immersive Playback**: Quick access to trailers and external streaming players with a single click.
- **Premium Aesthetics**: Fluid animations powered by Motion and a custom design system built with Tailwind CSS 4.

## 🛠 Tech Stack

- **Frontend**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/) (Vanilla-first approach)
- **Animations**: [Motion](https://motion.dev/) (formerly Framer Motion)
- **Icons**: [Lucide React](https://lucide.dev/)
- **API**: [TMDB (The Movie Database)](https://www.themoviedb.org/documentation/api)
- **Data Parsing**: [PapaParse](https://www.papaparse.com/) (CSV syncing)

## 📦 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- A TMDB API Key

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd Anarch
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up Environment Variables:**
   Create a `.env` file in the root directory and add your TMDB API key:
   ```env
   VITE_TMDB_API_KEY=your_tmdb_api_key_here
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` to view it in your browser.

## 🌐 Social Network

Anarch isn't just about watching; it's about the community. The **Friend Network** allows you to:
- Add "Rebel" friends by their ID.
- View real-time stats (Watched vs. Saved).
- Explore shared taste and discover hidden gems through friend profiles.

## 🛡 License

This project is part of the Anarch ecosystem. All rights reserved.

---

<div align="center">
  Built with ❤️ for Rebels.
</div>
