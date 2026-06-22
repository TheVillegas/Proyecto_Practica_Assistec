# AssisTec Lab — Code Review Rules

## ALL FILES

REJECT if:
- Hardcoded secrets, passwords, or tokens
- `console.log` left in production code
- Empty `catch` blocks (silent error swallowing)
- Code duplication
- Missing error handling on async operations

REQUIRE:
- Spanish UI labels for user-facing text
- Conventional commits: `feat:`, `fix:`, `chore:`, `test:`, `refactor:`

---

## Frontend (Angular + Ionic)

REJECT if:
- `any` type used → define proper interface
- Constructor injection used → use `inject()` from `@angular/core`
- Missing return type on methods
- SCSS color functions `darken()`/`lighten()` → migrate to modern Sass
- Inline styles instead of Tailwind classes
- Missing alt text on `<img>` tags
- Hardcoded colors → use design system variables

PREFER:
- Standalone components over NgModules
- `signal()` over plain variables for reactive state
- Typed forms (`FormGroup<Interface>`) over untyped
- Lazy-loaded routes for feature modules

---

## Backend (Node.js + Express + Prisma)

REJECT if:
- `req`, `res`, `next` without TypeScript types
- Synchronous DB operations → must use `async/await` or `.then()`
- Raw SQL queries → use Prisma ORM
- Missing input validation in routes
- JWT payload with sensitive data

REQUIRE:
- Prisma `select`/`include` to limit returned fields
- Error handling middleware for thrown exceptions
- Service layer separation (controller → service → repository)

PREFER:
- `winston` logger over `console.log`
- Transactional writes with `prisma.$transaction()`
- Environment variables via `dotenv` with defaults

---

## Response Format

FIRST LINE must be exactly:
STATUS: PASSED
or
STATUS: FAILED

If FAILED, list: `file:line - rule violated - issue`

---

## Project Skills

- `.agent/skills/linear-activity-creation/SKILL.md` — use for creating detailed AsisTec activities/issues in Linear.
- `.agent/skills/linear-cycle-assignment/SKILL.md` — use for assigning AsisTec issues to Linear cycles/sprints.
