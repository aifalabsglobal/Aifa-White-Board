<div align="center">
  <img src="public/aifa-logo.png" alt="AIFA Logo" width="300"/>
  
  # AIFA White Board 🎨
  
  ### An Advanced Collaborative Whiteboard Platform
  
  <p align="center">
    <strong>By AI First Academy</strong><br/>
    <em>The School of Artificial Intelligence</em>
  </p>

  ![Next.js](https://img.shields.io/badge/Next.js-16.0.3-black)
  ![React](https://img.shields.io/badge/React-19.2.0-blue)
  ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
  ![Prisma](https://img.shields.io/badge/Prisma-7.0.0-2D3748)
  ![License](https://img.shields.io/badge/License-MIT-green)

</div>

---

## ✨ Features

### 🖌️ Advanced Drawing Tools
- **Pen Tool**: Classic drawing with customizable colors and stroke widths
- **Highlighter Tool**: Semi-transparent highlighting for annotations
- **Eraser Tool**: Precision erasing for corrections
- **Text Tool**: Add rich text annotations with customizable fonts and sizes
- **Shape Tools**: Rectangle, Circle, and Line drawing with precision
- **Laser Pointer**: Temporary pointing tool for presentations
- **Multitouch Support**: Draw with multiple fingers simultaneously on touch devices

### 🎨 Customization & Styling
- **Color Picker**: Choose from preset colors or select custom colors with HEX support
- **Stroke Width**: Adjustable from 1-30px with live preview
- **Quick Size Presets**: Small (3px), Medium (8px), Large (15px)
- **Canvas Background**: Customizable board background colors
- **Font Customization**: Multiple font families and sizes for text elements

### 📄 Multi-Page Management
- **Unlimited Pages**: Create and manage multiple pages within each board
- **Page Navigation**: Seamless switching between pages
- **Page Thumbnails**: Visual preview of all pages
- **Auto-save**: Automatic persistence of all page content

### 🗂️ Workspace Organization
- **Workspaces**: Organize boards into logical workspaces
- **Topics**: Further categorize boards within workspaces
- **Board Management**: Create, rename, and delete boards with ease
- **Smart Navigation**: Hierarchical navigation through workspaces → topics → boards

### 🎥 Recording & Export
- **Screen Recording**: Record your whiteboard sessions with audio
- **Camera Integration**: Include webcam feed in recordings (draggable overlay)
- **Recording Controls**: Pause, resume, and stop recordings
- **Download Options**: Export recordings as video files
- **PDF Export**: Download individual pages or entire boards as PDF

### 🔐 User Management
- **Secure Authentication**: NextAuth.js-powered login system
- **User Profiles**: Customizable user profiles with avatars
- **Password Management**: Secure password change functionality
- **Session Management**: Persistent login sessions

### ⚡ Performance & UX
- **Undo/Redo**: Full history management with Zundo (Ctrl+Z / Ctrl+Y)
- **Responsive Canvas**: Auto-resizes to fit any screen
- **Touch Optimization**: Native touch event handling for smooth drawing
- **Custom Modals**: Beautiful, branded modal dialogs (no native popups)
- **Keyboard Shortcuts**: Efficient workflow with hotkeys
- **Drag & Drop**: Draggable toolbar for optimal workspace layout

### 💾 Data Persistence
- **PostgreSQL Database**: Robust data storage
- **Prisma ORM**: Type-safe database queries
- **Auto-save**: Continuous saving of all changes
- **Board History**: Access previous versions and changes

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+ and npm
- PostgreSQL database
- Git

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/aifalabsglobal/Aifa-White-Board.git
cd Aifa-White-Board
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

Visit [http://localhost:3000](http://localhost:3000) to start using AIFA White Board!

---

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
- **PDF Generation**: [jsPDF](https://github.com/parallax/jsPDF) & [html2canvas](https://html2canvas.hertzen.com/)

---

## 📁 Project Structure

```
Aifa-White-Board/
├── prisma/
│   ├── migrations/          # Database migrations
│   └── schema.prisma        # Prisma schema
├── public/                  # Static assets
│   ├── aifa-logo.png       # AIFA logo
│   └── ...
├── src/
│   ├── app/                # Next.js App Router pages
│   │   ├── board/          # Board view pages
│   │   ├── workspaces/     # Workspace pages
│   │   ├── api/            # API routes
│   │   └── layout.tsx      # Root layout
│   ├── components/         # React components
│   │   ├── WhiteboardCanvas.tsx
│   │   ├── Toolbar.tsx
│   │   ├── AppModal.tsx
│   │   ├── RecordingButton.tsx
│   │   └── providers/      # Context providers
│   ├── store/              # Zustand stores
│   │   ├── whiteboardStore.ts
│   │   └── workspaceStore.ts
│   └── lib/                # Utility functions
├── .env                    # Environment variables
├── next.config.ts          # Next.js configuration
├── tailwind.config.ts      # Tailwind CSS configuration
└── tsconfig.json           # TypeScript configuration
```

---

## 🎮 Usage

### Drawing
- **Mouse**: Click and drag to draw
- **Touch**: Use one or more fingers to draw simultaneously
- **Tools**: Select pen, highlighter, eraser, shapes, or text from the toolbar

### Keyboard Shortcuts
- `Ctrl+Z` / `Cmd+Z`: Undo
- `Ctrl+Y` / `Cmd+Y`: Redo
- `Delete`: Delete selected element

### Workspace Navigation
1. **Create Workspace**: Organize your boards into workspaces
2. **Add Topics**: Categorize boards within workspaces
3. **Create Boards**: Add multiple boards to each topic
4. **Multi-Page**: Add unlimited pages to each board

### Recording
1. Click the **Record** button in the top bar
2. Grant camera/microphone permissions
3. Use recording controls to pause/resume
4. Stop recording and download the video

---

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

# Reset database
npx prisma migrate reset
```

---

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

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/aifalabsglobal/Aifa-White-Board)

### Environment Variables for Production

- `DATABASE_URL`: Your production PostgreSQL connection string
- `NEXTAUTH_SECRET`: A secure random string (generate with `openssl rand -base64 32`)
- `NEXTAUTH_URL`: Your production URL (e.g., `https://yourapp.vercel.app`)

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

---

## 🎓 About AI First Academy

**AI First Academy** is *The School of Artificial Intelligence*, dedicated to empowering learners with cutting-edge AI knowledge and practical skills. Our mission is to make AI education accessible, engaging, and impactful.

### Our Vision
To create a world where everyone has the tools and knowledge to leverage artificial intelligence for positive change.

### Connect With Us
- 🌐 Website: [AI First Academy](https://aifirstacademy.com)
- 📧 Email: contact@aifirstacademy.com
- 🐦 Twitter: [@AIFirstAcademy](https://twitter.com/AIFirstAcademy)

---

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Canvas rendering powered by [Konva](https://konvajs.org/)
- State management with [Zustand](https://zustand-demo.pmnd.rs/)
- Icons from [Lucide](https://lucide.dev/)

---

## 📧 Support

For questions, support, or feedback:
- Open an issue on [GitHub](https://github.com/aifalabsglobal/Aifa-White-Board/issues)
- Contact AI First Academy support

---

<div align="center">
  
  **Made with ❤️ by AI First Academy**
  
  *The School of Artificial Intelligence*

  © 2025 AI First Academy. All rights reserved.

</div>
