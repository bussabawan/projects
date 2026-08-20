<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:nextjs-proxy-rule -->
# Next.js 16 Proxy (Middleware)
In Next.js 16, the `middleware.ts` file has been renamed and replaced by `proxy.ts` (e.g., `src/proxy.ts`). It must export a function named `proxy` instead of `middleware`. Always treat `proxy.ts` as the middleware and do NOT try to create or rename it to `middleware.ts`.
<!-- END:nextjs-proxy-rule -->

<!-- BEGIN:env-file-rule -->
# Environment Files
**NEVER** delete the `.env.example` file under any circumstances, even when ordered to clear or clean up code. It is required for the project configuration.
<!-- END:env-file-rule -->

# Agent Instructions for OT Project (Next.js + TypeScript + MySQL + Auth.js)

## 1. Project Overview
This is a Next.js application using TypeScript, integrated with a MySQL database and Auth.js (NextAuth.js) for authentication using Google OAuth and custom Credentials for patients.

## 2. Code Style & Standards
- **Language**: TypeScript
- **Framework**: Next.js 16 (App Router)
- **Styling**: CSS Modules (e.g., `styles.module.css`)
- **Authentication**: Auth.js (NextAuth.js v5) with Google OAuth & Credentials
- **Database**: MySQL (via `mysql2/promise`)
- **Environment**: Development (Docker Compose)
- **File Structure**: `src/app` for pages, `src/components` for components, `src/lib` for utilities/database, `src/lib/models` for data models

## 3. Development Setup (Docker)
- Use `compose.dev.yaml` for development
- Services: `server` (Next.js), `mysql`, `phpmyadmin`
- Run `docker compose -f compose.dev.yaml up --build` to start
- Run `docker compose -f compose.dev.yaml watch` to enable hot-reload (if supported)
- Run `docker compose -f compose.dev.yaml down` to stop

## 4. Docker Build Configuration
- Use multi-stage Dockerfile (dev-base, dev-deps, dev-final)
- **NEVER** run `npm install` in the final container - use build args:
  - `ARG NEXT_TELEMETRY_DISABLED=1`
  - `ENV NEXT_TELEMETRY_DISABLED=1`
- Use `RUN --mount=type=cache` for `npm install` to speed up builds

## 5. Environment Variables
- Primary env file: `.env`
- NEVER commit `.env`
- Required variables:
  ```env
  PORT=3000
  MYSQL_ROOT_PASSWORD=password
  MYSQL_DATABASE=ot_project_db
  MYSQL_USER=admin
  MYSQL_PASSWORD=password
  MYSQL_HOST=mysql
  MYSQL_PORT=3306
  AUTH_SECRET="your-secret-here"
  GOOGLE_CLIENT_ID="your-google-client-id"
  GOOGLE_CLIENT_SECRET="your-google-client-secret"
  AUTH_URL="http://localhost:3000"
  ```

## 6. Authentication Flow
- Use `Auth.js` (v5 beta) for Google OAuth and Credentials
- Primary file: `src/auth.ts`
- Providers: Google OAuth, CredentialsProvider
- Required env vars: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `AUTH_SECRET`
- Example implementation structure in `src/auth.ts`:
  ```typescript
  import NextAuth from "next-auth"
  import GoogleProvider from "next-auth/providers/google"
  import CredentialsProvider from "next-auth/providers/credentials"
  import { UserModel } from "@/lib/models/user"
  import { authConfig } from "./auth.config"

  export const { handlers, signIn, signOut, auth } = NextAuth({
    ...authConfig,
    providers: [
      GoogleProvider({ ... }),
      CredentialsProvider({ ... })
    ],
    callbacks: {
      async signIn({ user, account }) { ... },
      async jwt({ token, user, account }) { ... }
    }
  })
  ```

## 7. Database & Models
- Primary file: `src/lib/db.ts`
- Model files: `src/lib/models/*.ts`
- Use `mysql2/promise` for raw SQL queries
- Use parameterized queries `?` to prevent SQL Injection
- Connection Pool is created in `db.ts`

## 8. Dockerfile Best Practices
- Use multi-stage builds
- Optimize layer caching
- Set `NODE_ENV=production` in production image
- Set `PORT` env var
- Set `HOSTNAME=0.0.0.0`

## 9. Common Tasks
- Start dev server: `docker compose -f compose.dev.yaml up --build` or `./run_dev_mode.bat`
- Stop server: `docker compose -f compose.dev.yaml down`
- Login to phpMyAdmin: http://localhost:8081
- Go to app: http://localhost:3000

## 10. Docker Compose Development Rules
- Use `-f compose.dev.yaml` flag for all commands
- **NEVER** modify `compose.dev.yaml` for production builds
- Use `--build` flag for initial startup or if dependencies changed
- Use `-d` for detached mode

## 11. Database Best Practices
- **ALWAYS** use transactions for multi-step writes: `const connection = await db.getConnection(); await connection.beginTransaction(); ... await connection.commit();`
- Check if record exists before insert
- Handle MySQL errors properly
- Example:
  ```typescript
  // src/lib/models/example.ts
  import { db } from '@/lib/db';
  import { RowDataPacket } from 'mysql2';

  export class ExampleModel {
    static async findById(id: number): Promise<any> {
      const [rows] = await db.execute<RowDataPacket[]>(
        'SELECT * FROM some_table WHERE id = ?',
        [id]
      );
      return rows.length ? rows[0] : null;
    }
  }
  ```