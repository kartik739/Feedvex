<div align="center">
  <img src="https://raw.githubusercontent.com/kartik739/Feedvex/main/frontend/public/favicon.svg" width="120" height="120" alt="FeedVex Logo" />
  
  <h1>FeedVex</h1>
  <p><strong>A Premium, High-Performance Reddit Search Engine</strong></p>
  
  <p>
    <a href="https://feedvex.vercel.app">Live Demo</a> •
    <a href="#features">Features</a> •
    <a href="#tech-stack">Tech Stack</a> •
    <a href="#getting-started">Getting Started</a>
  </p>
</div>

<br />

## 📖 About FeedVex

FeedVex is a premium, production-ready search engine designed specifically for Reddit. It bypasses the limitations of Reddit's native search by intelligently indexing posts from top subreddits, parsing discussions, and delivering ultra-relevant results using a custom **BM25 Ranking Algorithm**. 

Built with modern web technologies, FeedVex features the bespoke "Vex Obsidian" design system—a stunning, handcrafted UI featuring dark mode aesthetics, glassmorphism, and dynamic micro-animations for an unparalleled user experience.

---

## ✨ Features

- 🔍 **BM25 Full-Text Search**: Highly relevant, lightning-fast search results matching titles, content, and metadata.
- ⚡ **Real-time Ingestion**: Automatically pulls and indexes live data from Reddit using background collector daemons.
- 🛡️ **Secure Authentication**: Seamless login and user management powered by Clerk.
- 🚄 **Edge Caching**: 5-minute intelligent caching via Upstash Redis for instant repeat searches.
- 📊 **Live Telemetry & Metrics**: Real-time server health and search telemetry via WebSockets.
- 🎨 **Premium Aesthetics**: Bespoke "Vex Obsidian" design utilizing Inter typography and tailored color palettes.

---

## 🛠 Tech Stack

FeedVex is built using a modern, serverless-first architecture optimized for performance and zero-ops deployments.

### Frontend
- **Framework**: React 18 + Vite
- **Styling**: Tailwind CSS (Vex Obsidian Theme) + Framer Motion
- **Icons**: Lucide React
- **Deployment**: Vercel (Global Edge Network)

### Backend
- **Runtime**: Node.js + Express
- **Database**: PostgreSQL (hosted on Neon)
- **Caching & Rate Limiting**: Upstash Redis
- **Authentication**: Clerk
- **Deployment**: Render

---

## 🚀 Getting Started

Follow these instructions to set up FeedVex on your local machine for development and testing.

### Prerequisites
- [Node.js](https://nodejs.org/en/) (v18 or higher)
- [Git](https://git-scm.com/)
- A free PostgreSQL database (e.g., [Neon](https://neon.tech))
- A free Redis database (e.g., [Upstash](https://upstash.com))
- A [Clerk](https://clerk.com) account for authentication

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/kartik739/Feedvex.git
   cd Feedvex
   ```

2. **Install dependencies:**
   ```bash
   # This will install dependencies for both the frontend and backend workspaces
   npm install
   ```

3. **Configure Environment Variables:**
   Copy the example environment file and fill in your keys:
   ```bash
   cp .env.example .env
   ```
   *Note: Ensure you fill out the `DATABASE_URL`, `REDIS_URL`, `CLERK_SECRET_KEY`, and `VITE_CLERK_PUBLISHABLE_KEY` in the `.env` file.*

4. **Start the Development Servers:**
   ```bash
   # Terminal 1: Start the backend API (Runs on port 3000)
   npm run dev:backend

   # Terminal 2: Start the frontend Vite server (Runs on port 5173)
   npm run dev:frontend
   ```

5. **Access the Application:**
   Open your browser and navigate to `http://localhost:5173`.

---

## 🌐 Production Deployment

FeedVex is designed to be easily deployable on Vercel and Render.

1. **Backend (Render)**:
   - Create a new Web Service on Render.
   - Set the Build Command: `npm install --include=dev && npm run build:backend`
   - Set the Start Command: `npm start`
   - Ensure all environment variables from `.env` are mirrored in the Render dashboard.

2. **Frontend (Vercel)**:
   - Import the repository into Vercel.
   - Set the Framework Preset to `Vite`.
   - Set the Build Command: `npm run build:frontend`
   - Set the Output Directory: `dist`
   - Add `VITE_CLERK_PUBLISHABLE_KEY` and `VITE_API_URL` (pointing to your Render URL) to the Vercel Environment Variables.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/kartik739/Feedvex/issues). 

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
