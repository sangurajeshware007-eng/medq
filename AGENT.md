# AGENT.md — Project Intelligence File
> Every AI agent, assistant, or developer must read this file before
> touching any code in this project.

---

## 🧠 Project Overview
- **Type:** React Native / Expo App
- **Language:** TypeScript (strict mode)
- **Routing:** Expo Router (file-based)
- **State:** Zustand (client) + TanStack Query (server)
- **Forms:** React Hook Form + Zod
- **Styling:** NativeWind (Tailwind for RN)
- **HTTP:** Axios with interceptors
- **Testing:** Jest + React Native Testing Library

---

## 📁 Folder Structure
src/
├── components/       # Shared reusable UI components
├── features/         # Feature-based modules
│   └── [feature]/
│       ├── components/
│       ├── hooks/
│       ├── services/
│       └── types/
├── hooks/            # Global custom hooks
├── services/         # API/service layer
├── store/            # Zustand stores
├── navigation/       # Navigation types & config
├── utils/            # Pure helper functions
├── constants/        # App-wide constants
├── types/            # Global TypeScript types
└── theme/            # Colors, spacing, typography

---

## ✅ Coding Standards

### Principles
- SOLID, DRY, KISS, Separation of Concerns
- No magic strings or numbers — use constants
- No "any" TypeScript types — ever
- No inline functions/objects inside JSX

### Components
- Functional components only
- One component per file
- Props must have TypeScript interface/type
- Use React.memo only when re-render is proven expensive
- Always handle: loading, error, and empty states

### Hooks
- All business logic lives in custom hooks
- Named with useXxx convention
- One responsibility per hook

### Services
- All API calls go in /services
- Use Axios instance from src/services/api.ts
- Never call fetch() or axios directly in components

### State Management
- Server state → TanStack Query (useQuery, useMutation)
- Global UI state → Zustand
- Local UI state → useState / useReducer
- No prop drilling beyond 2 levels — use context or Zustand

### Forms
- Always use React Hook Form
- Always validate with Zod schemas
- Zod schemas live in /features/[feature]/schemas/

### Styling
- NativeWind utility classes preferred
- Theme tokens from src/theme/ for colors/spacing
- No hardcoded color hex values in components

---

## 🚫 Anti-Patterns — Never Do This
- ❌ Class components
- ❌ Direct API calls inside components
- ❌ Hardcoded strings/colors/numbers
- ❌ console.log in production code
- ❌ Ignoring error/loading states
- ❌ useEffect for data fetching (use React Query)
- ❌ Mutating state directly
- ❌ Any type in TypeScript
- ❌ God components (>200 lines — split it)

---

## 📐 Naming Conventions
| Type         | Convention         | Example               |
|---|---|---|
| Component    | PascalCase         | UserProfileCard       |
| Hook         | camelCase + use    | useAuthSession        |
| Service      | camelCase          | authService           |
| Constant     | UPPER_SNAKE_CASE   | MAX_RETRY_COUNT       |
| Type/Interface | PascalCase       | IUserProps / UserType |
| File (component) | PascalCase    | UserProfileCard.tsx   |
| File (hook/util) | camelCase     | useAuthSession.ts     |

---

## 🔄 Git Commit Convention
feat: add login screen
fix: resolve token refresh bug
refactor: extract useAuth hook
chore: update dependencies
docs: update AGENT.md

---

## 📝 When Adding New Features
1. Create feature folder under src/features/[feature-name]/
2. Define TypeScript types first in /types
3. Create Zod schema if forms are involved
4. Build service layer (API calls)
5. Build custom hook (business logic)
6. Build UI components (pure, dumb)
7. Wire together in the screen file
8. Write tests

---

## 🤖 AI Agent Instructions
- ALWAYS read this file before writing or modifying any code
- ALWAYS follow the standards above — no shortcuts
- ALWAYS update this file if new libraries or patterns are introduced
- NEVER introduce a new pattern without adding it here first
- If something is unclear, ask before assuming