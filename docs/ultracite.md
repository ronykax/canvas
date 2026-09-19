# Ultracite

Oxlint + Oxfmt. `npm run check` / `npm run fix`. Most formatting and common issues are auto-fixed — run `npm run fix` before committing.

Write type-safe, maintainable code. Clarity and explicit intent over brevity.

## Type safety

- Explicit types for parameters and return values when they help
- `as const` for immutable values and literal types
- Type narrowing instead of type assertions
- Named constants instead of magic numbers

## Modern JavaScript / TypeScript

- Arrow functions for callbacks and short functions
- `for...of` over `.forEach()` and indexed `for` loops
- Optional chaining (`?.`) and nullish coalescing (`??`)
- Template literals over string concatenation
- Destructuring for object and array assignments
- `const` by default, `let` only when reassignment is needed, never `var`

## Async

- Always `await` promises in async functions — use the return value
- `async/await` instead of promise chains
- Handle errors with try/catch
- Do not use async functions as Promise executors

## React

- Function components, not class components
- Hooks at the top level only, never conditionally
- List every dependency in hook dependency arrays
- `key` on list items — unique IDs, not array indices
- Nest children between tags; do not pass them as props
- Do not define components inside other components
- Pass `ref` as a prop — not `React.forwardRef`

## Errors

- No `console.log`, `debugger`, or `alert` in production code
- Throw `Error` objects with descriptive messages, not strings
- Do not catch only to rethrow
- Early returns over nested conditionals for error cases

## Organization

- Keep functions focused
- Extract complex conditions into named booleans
- Early returns to reduce nesting
- Simple conditionals over nested ternaries
- Group related code; separate concerns
