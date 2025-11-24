# Contributing to MultiFinger Board

First off, thank you for considering contributing to MultiFinger Board! It's people like you that make this project better.

## Code of Conduct

By participating in this project, you are expected to uphold our Code of Conduct:
- Be respectful and inclusive
- Accept constructive criticism gracefully
- Focus on what is best for the community

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates. When you create a bug report, include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples to demonstrate the steps**
- **Describe the behavior you observed and what you expected**
- **Include screenshots if possible**
- **Include your environment details** (OS, browser, Node.js version)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion:

- **Use a clear and descriptive title**
- **Provide a step-by-step description of the suggested enhancement**
- **Provide specific examples to demonstrate the steps**
- **Describe the current behavior and explain which behavior you expected to see instead**
- **Explain why this enhancement would be useful**

### Pull Requests

1. Fork the repo and create your branch from `main`
2. If you've added code that should be tested, add tests
3. Ensure the test suite passes
4. Make sure your code lints
5. Issue that pull request!

## Development Process

### Setting Up Your Development Environment

1. **Fork the repository**
```bash
git clone https://github.com/YOUR_USERNAME/multifingerboard.git
cd multifingerboard
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up your environment variables**
```bash
cp .env.example .env
# Edit .env with your local database credentials
```

4. **Run database migrations**
```bash
npx prisma generate
npx prisma migrate dev
```

5. **Start the development server**
```bash
npm run dev
```

### Coding Guidelines

- **TypeScript**: All code should be written in TypeScript
- **Formatting**: Use the project's ESLint and Prettier configurations
- **Naming Conventions**: 
  - Components: PascalCase (e.g., `WhiteboardCanvas.tsx`)
  - Functions: camelCase (e.g., `handleMouseDown`)
  - Constants: UPPER_SNAKE_CASE (e.g., `MAX_STROKE_WIDTH`)
- **File Organization**: Keep files focused and modular

### Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
feat: add support for multiple pages
fix: resolve touch event handler memory leak
docs: update installation instructions
style: format code with prettier
refactor: simplify stroke rendering logic
test: add tests for whiteboard store
chore: update dependencies
```

### Branch Naming

- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring

## Testing

Before submitting a pull request:

1. **Run linting**
```bash
npm run lint
```

2. **Type check**
```bash
npx tsc --noEmit
```

3. **Build the project**
```bash
npm run build
```

## Project Structure

```
multifingerboard/
├── src/
│   ├── app/              # Next.js pages and API routes
│   ├── components/       # React components
│   └── store/            # State management
├── prisma/               # Database schema and migrations
├── public/               # Static assets
└── .github/              # GitHub Actions workflows
```

## Areas You Can Contribute To

### High Priority
- [ ] Add unit tests for store logic
- [ ] Implement shape drawing tools (rectangles, circles, lines)
- [ ] Add export functionality (PNG, PDF, SVG)
- [ ] Improve mobile responsiveness
- [ ] Add collaborative editing features

### Medium Priority
- [ ] Add more color palettes
- [ ] Implement layers support
- [ ] Add zoom and pan functionality
- [ ] Create keyboard shortcuts documentation
- [ ] Improve accessibility (ARIA labels, keyboard navigation)

### Good First Issues
- [ ] Add more preset stroke widths
- [ ] Improve toolbar UI/UX
- [ ] Add loading states
- [ ] Create example boards
- [ ] Write end-to-end tests

## Questions?

Feel free to open an issue with the `question` label if you have any questions about contributing.

## Recognition

Contributors will be recognized in the README.md file and release notes.

Thank you for your contributions! 🎉
