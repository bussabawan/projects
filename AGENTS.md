<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:nextjs-proxy-rule -->
# Next.js 16 Proxy (Middleware)
In Next.js 16, the `middleware.ts` file has been renamed and replaced by `proxy.ts` (e.g., `src/proxy.ts`). It must export a function named `proxy` instead of `middleware`. Always treat `proxy.ts` as the middleware and do NOT try to create or rename it to `middleware.ts`.
<!-- END:nextjs-proxy-rule -->
