# Contributing to AURA ORCHA Routing Demo

Thank you for your interest in contributing to this project! This demo application showcases ORCHA routing capabilities.

## Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/yourusername/aura-ui.git
   cd aura-ui
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your ORCHA backend URL
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

## Project Structure

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed architecture documentation.

## Coding Standards

### TypeScript

- Enable strict mode (already configured)
- Provide explicit types for props and state
- Avoid `any` when possible (allowed for prepared_payload due to dynamic nature)

### React

- Use functional components with hooks
- Prefer named exports for components
- Use `React.FC` for component type definitions
- Keep components focused and single-purpose

### Styling

- Use Tailwind CSS utility classes
- Follow existing color scheme (indigo primary)
- Maintain responsive design
- Use semantic class names

### File Naming

- Components: `PascalCase.tsx` (e.g., `MessageBubble.tsx`)
- Utilities: `camelCase.ts` (e.g., `orcha.ts`)
- Types: `camelCase.d.ts` (e.g., `orcha.d.ts`)
- Constants: `UPPER_SNAKE_CASE`

## Making Changes

### Adding a New Component

1. Create component file in `src/components/`
2. Import and use in parent component
3. Add TypeScript types for props
4. Include accessibility attributes (aria-labels)
5. Test in browser

### Modifying API Layer

1. Update types in `src/types/orcha.d.ts` first
2. Implement changes in `src/api/orcha.ts`
3. Update components using the API
4. Test with actual backend

### Styling Changes

1. Use existing Tailwind utilities when possible
2. Extend `tailwind.config.js` for custom values
3. Maintain design consistency
4. Test responsive breakpoints

## Testing

### Manual Testing Checklist

- [ ] Login with user_id works
- [ ] Messages send successfully
- [ ] Attachments can be added and removed
- [ ] RAG toggle works
- [ ] Routing responses display correctly
- [ ] JSON payload is collapsible
- [ ] Copy JSON button works
- [ ] Logout clears session
- [ ] Page refresh preserves session and messages
- [ ] Error states display properly
- [ ] Loading states work
- [ ] Responsive design works on mobile

### Browser Testing

Test in:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Git Workflow

### Branch Naming

- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation changes
- `refactor/description` - Code refactoring

### Commit Messages

Follow conventional commits:

```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Formatting, missing semicolons, etc.
- `refactor`: Code restructuring
- `test`: Adding tests
- `chore`: Maintenance tasks

Examples:
```
feat(chat): add message search functionality
fix(api): handle network timeout errors
docs(readme): update installation instructions
```

## Pull Request Process

1. **Create a Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Changes**
   - Follow coding standards
   - Test thoroughly
   - Update documentation if needed

3. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat(scope): description"
   ```

4. **Push to Your Fork**
   ```bash
   git push origin feature/your-feature-name
   ```

5. **Open Pull Request**
   - Provide clear description
   - Reference any related issues
   - Include screenshots for UI changes

6. **Code Review**
   - Address feedback
   - Make requested changes
   - Push updates to same branch

## Areas for Contribution

### High Priority

- [ ] Implement real file upload functionality
- [ ] Add endpoint call functionality
- [ ] Improve error handling and user feedback
- [ ] Add unit tests
- [ ] Enhance accessibility (WCAG 2.1 AA)

### Medium Priority

- [ ] Add message search/filter
- [ ] Implement dark mode
- [ ] Add markdown rendering for messages
- [ ] Create storybook for components
- [ ] Add E2E tests (Playwright/Cypress)

### Nice to Have

- [ ] Add message export (JSON/CSV)
- [ ] Implement message editing
- [ ] Add keyboard shortcuts
- [ ] Create mobile app version
- [ ] Add voice input support

## Questions or Issues?

- **Documentation**: Check [README.md](./README.md), [QUICKSTART.md](./QUICKSTART.md), [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Bugs**: Open an issue with reproduction steps
- **Features**: Open an issue to discuss before implementing
- **Questions**: Open a discussion or issue

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Focus on constructive feedback
- Respect different viewpoints
- Prioritize project health

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.

---

Thank you for contributing! 🎉

