<div align="center">
  <img src="public/logo.png" alt="AIFA Logo" width="200"/>
  <h1>MultiFinger Board 🎨✋</h1>
  <p>A modern, multitouch-enabled whiteboard application built with Next.js 16, featuring real-time drawing capabilities with support for multiple simultaneous touch inputs.</p>
</div>

![Next.js](https://img.shields.io/badge/Next.js-16.0.3-black)
![React](https://img.shields.io/badge/React-19.2.0-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Prisma](https://img.shields.io/badge/Prisma-7.0.0-2D3748)

## ✨ Features

### 🖌️ Drawing Tools
- **Pen Tool**: Classic drawing with customizable colors and stroke widths
- **Highlighter Tool**: Semi-transparent highlighting for annotations
- **Eraser Tool**: Remove strokes with precision
- **Multitouch Support**: Draw with multiple fingers simultaneously on touch devices

### 🎨 Customization
- **Color Picker**: Choose from preset colors or select custom colors
- **Stroke Width**: Adjustable from 1-30px with live preview
- **Quick Size Presets**: Small (3px), Medium (8px), Large (15px)

### ⚡ Advanced Features
- **Undo/Redo**: Full history management with Zundo
- **Responsive Canvas**: Auto-resizes to fit any screen
- **Touch Optimization**: Native touch event handling for smooth drawing
- **State Management**: Efficient global state with Zustand

### 🔐 Authentication & Database
- **NextAuth.js**: Secure authentication system
- **Prisma ORM**: PostgreSQL database integration
- **User Management**: User accounts, sessions, and board persistence

## 🚀 Getting Started

### Prerequisites

- Node.js 20+ and npm
- PostgreSQL database
- Git

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/aifalabsglobal/multifingerboard.git
cd multifingerboard
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/database_name"

# NextAuth
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
```

4. **Generate Prisma Client**
```bash
npx prisma generate
```

5. **Run database migrations**
```bash
npx prisma migrate dev
```

6. **Start the development server**
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see your whiteboard!

## 🏗️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) with App Router and Turbopack
- **UI Library**: [React 19](https://react.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Canvas Rendering**: [Konva](https://konvajs.org/) & [React-Konva](https://konvajs.org/docs/react/)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/)
- **Undo/Redo**: [Zundo](https://github.com/charkour/zundo)
- **Authentication**: [NextAuth.js v5](https://next-auth.js.org/)
- **Database**: [PostgreSQL](https://www.postgresql.org/)
- **ORM**: [Prisma 7](https://www.prisma.io/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)

## 📁 Project Structure

```
multifingerboard/
├── prisma/
│   ├── migrations/        # Database migrations
│   └── schema.prisma      # Prisma schema
├── public/                # Static assets
├── src/
│   ├── app/              # Next.js App Router pages
│   ├── components/       # React components
│   │   ├── WhiteboardCanvas.tsx  # Main canvas component
│   │   └── Toolbar.tsx           # Drawing toolbar
│   └── store/            # Zustand stores
│       └── whiteboardStore.ts    # Whiteboard state management
├── .env                  # Environment variables (not in git)
├── next.config.ts        # Next.js configuration
├── tailwind.config.ts    # Tailwind CSS configuration
└── tsconfig.json         # TypeScript configuration
```

## 🎮 Usage

### Drawing
- **Mouse**: Click and drag to draw
- **Touch**: Use one or more fingers to draw simultaneously
- **Tools**: Select pen, highlighter, or eraser from the toolbar

### Keyboard Shortcuts
- `Ctrl+Z` / `Cmd+Z`: Undo
- `Ctrl+Y` / `Cmd+Y`: Redo

### Toolbar Controls
- **Tools Section**: Switch between pen, highlighter, and eraser
- **Colors Section**: Pick preset colors or use custom color picker
- **Width Section**: Adjust stroke width with buttons or slider
- **Actions Section**: Undo, redo, and clear page

## 🔧 Development

### Build for Production
```bash
npm run build
```

### Start Production Server
```bash
npm start
```

### Lint Code
```bash
npm run lint
```

### Database Commands
```bash
# Generate Prisma Client
npx prisma generate

# Create a migration
npx prisma migrate dev --name migration_name

# Open Prisma Studio
npx prisma studio
```

## 🌐 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Visit [Vercel](https://vercel.com)
3. Import your repository
4. Add environment variables:
   - `DATABASE_URL`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL`
5. Deploy!

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/aifalabsglobal/multifingerboard)

### Environment Variables for Production

Make sure to set these in your deployment platform:

- `DATABASE_URL`: Your production PostgreSQL connection string
- `NEXTAUTH_SECRET`: A secure random string (generate with `openssl rand -base64 32`)
- `NEXTAUTH_URL`: Your production URL (e.g., `https://yourapp.vercel.app`)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Canvas rendering powered by [Konva](https://konvajs.org/)
- State management with [Zustand](https://zustand-demo.pmnd.rs/)
- Icons from [Lucide](https://lucide.dev/)

## 📧 Contact

For questions or support, please open an issue on GitHub.

---

Made with ❤️ by AIFA Labs Global
