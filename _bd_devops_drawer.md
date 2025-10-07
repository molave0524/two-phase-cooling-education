# DevOps Drawer - Technical Implementation Guide

**Audience:** Developers
**Purpose:** Complete technical specification for implementing DevOps Drawer feature
**Date:** 2025-10-05
**Status:** Design Complete - Ready for Implementation

---

## Table of Contents

1. [Feature Overview](#feature-overview)
2. [User Experience](#user-experience)
3. [Architecture](#architecture)
4. [Key Integration Technologies](#key-integration-technologies)
5. [Component Structure](#component-structure)
6. [API Endpoints](#api-endpoints)
7. [Database Schema](#database-schema)
8. [Implementation Steps](#implementation-steps)
9. [Security Considerations](#security-considerations)
10. [Testing Strategy](#testing-strategy)

---

## Feature Overview

### Problem Statement

Developers spend significant time:

- Manually checking database table counts
- Comparing schemas across environments (local vs DEV vs UAT)
- Verifying environment configuration
- Debugging which version is deployed
- Checking service health (DB, APIs, etc.)

**Current workflow:**

```bash
# Check database
psql $DATABASE_URL -c "SELECT COUNT(*) FROM products"
psql $DATABASE_URL -c "\dt"

# Check environment
git log -1
node --version
echo $GEMINI_API_KEY

# Compare schemas
# No easy way - manually export and diff
```

**Time spent:** 10-15 minutes per check, multiple times per day

### Solution

**DevOps Drawer** - A slide-out panel accessible from the environment badge that shows:

- ✅ Real-time system health
- ✅ Environment metadata (version, commit, deployment date)
- ✅ Database inspector (tables, counts, schema)
- ✅ Cross-database comparison (using PostgreSQL FDW)
- ✅ Configuration status
- ✅ Performance metrics
- ✅ Activity logs

**New workflow:**

```
1. Click environment badge (upper left)
2. See all information in one place
3. Total time: 5 seconds
```

**Time saved:** 10+ minutes per check × 5 checks/day = 50 min/day per developer

---

## User Experience

### UI Flow

```
┌─────────────────────────────────────────────────────────────┐
│ Header                                                      │
│ ┌─────┐                                                     │
│ │ 💻  │ ← Click environment badge                          │
│ │LOCAL│                                                     │
│ └─────┘                                                     │
└─────────────────────────────────────────────────────────────┘
                │
                │ (Opens drawer from right)
                ▼
┌─────────────────────────────────────────────────────────────┐
│                                        ┌──────────────────┐ │
│                                        │ DevOps Console   │ │
│                                        │ [×]              │ │
│                                        │──────────────────│ │
│                                        │ 🟢 System Health │ │
│                                        │ ✅ Database: OK  │ │
│                                        │ ✅ AI: OK        │ │
│                                        │ ⚠️  Redis: N/A   │ │
│                                        │──────────────────│ │
│                                        │ 📊 Environment   │ │
│                                        │ ENV: LOCAL       │ │
│                                        │ Commit: daa8878  │ │
│                                        │ Version: 0.1.1   │ │
│                                        │──────────────────│ │
│                                        │ 🗄️ Database      │ │
│                                        │ ▼ Tables (11)    │ │
│                                        │   products: 12   │ │
│                                        │   orders: 156    │ │
│                                        │   users: 47      │ │
│                                        │ [Compare DBs ▾] │ │
│                                        │──────────────────│ │
│                                        │ ⚡ Quick Actions │ │
│                                        │ [Clear Cache]    │ │
│                                        │ [Export Logs]    │ │
│                                        └──────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Interactions

1. **Open Drawer**: Click environment badge
2. **Close Drawer**: Click X button, click outside, or press Escape
3. **Expand Sections**: Click section headers to expand/collapse
4. **Compare Databases**: Select source/target from dropdown, click Compare
5. **Refresh Data**: Auto-refreshes every 10 seconds (or manual refresh button)
6. **Copy Values**: Click to copy commit hash, version, etc.

### Responsive Behavior

**Desktop (>768px):**

- Drawer slides in from right
- Width: 400px
- Overlay dims background

**Mobile (<768px):**

- Full-screen overlay
- Width: 100%
- Swipe down to close

---

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ FRONTEND (React/Next.js)                                    │
└─────────────────────────────────────────────────────────────┘
                        │
                        │ API Calls (every 10s)
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ API ROUTES (Next.js API)                                    │
│ ├─ /api/devops/health           → System health checks     │
│ ├─ /api/devops/environment      → Env metadata             │
│ ├─ /api/devops/database/info    → Table list + counts      │
│ ├─ /api/devops/database/compare → Schema comparison (FDW)  │
│ └─ /api/devops/config           → Configuration status     │
└─────────────────────────────────────────────────────────────┘
                        │
                        │ Database Queries
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ POSTGRESQL DATABASE                                         │
│ ├─ Local Docker (localhost:5432)                           │
│ ├─ DEV (Neon ep-dev-xxx)        ← Connected via FDW        │
│ ├─ UAT (Neon ep-uat-xxx)        ← Connected via FDW        │
│ └─ PROD (Neon ep-prod-xxx)      ← Read-only FDW            │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

```
User clicks badge
    ↓
DevOpsDrawer opens
    ↓
useEffect triggers API calls (parallel)
    ↓
┌──────────────────┬──────────────────┬──────────────────┐
│ /api/devops/     │ /api/devops/     │ /api/devops/     │
│ health           │ environment      │ database/info    │
└────────┬─────────┴────────┬─────────┴────────┬─────────┘
         │                  │                  │
         ↓                  ↓                  ↓
    Check services    Get Git info      Query tables
         │                  │                  │
         └──────────────────┴──────────────────┘
                            │
                            ↓
                    Update UI state
                            │
                            ↓
                  Display in drawer sections
```

---

## Key Integration Technologies

### 1. PostgreSQL Foreign Data Wrapper (FDW)

**Purpose:** Query remote databases from local database for comparison

**Why FDW?**

- ✅ Native PostgreSQL feature (no external dependencies)
- ✅ True SQL joins across databases
- ✅ PostgreSQL optimizes queries
- ✅ Single connection point (local DB)
- ✅ Can compare schema AND data

**How it works:**

```sql
-- Setup (one-time per environment)
CREATE EXTENSION postgres_fdw;

-- Create foreign server connection
CREATE SERVER dev_server
FOREIGN DATA WRAPPER postgres_fdw
OPTIONS (host 'ep-dev-xxx.neon.tech', dbname 'neondb', sslmode 'require');

-- Map credentials
CREATE USER MAPPING FOR CURRENT_USER
SERVER dev_server
OPTIONS (user 'neondb_owner', password 'xxx');

-- Import remote schema
CREATE SCHEMA dev_remote;
IMPORT FOREIGN SCHEMA public FROM SERVER dev_server INTO dev_remote;

-- Now query both databases in single SQL
SELECT
  local.tablename,
  local_count.count as local_rows,
  remote_count.count as dev_rows
FROM pg_tables local
LEFT JOIN dev_remote.pg_tables remote ON local.tablename = remote.tablename
LEFT JOIN (SELECT COUNT(*) FROM products) local_count ON true
LEFT JOIN (SELECT COUNT(*) FROM dev_remote.products) remote_count ON true
WHERE local.schemaname = 'public';
```

**Alternatives considered:**
| Approach | Pros | Cons | Decision |
|----------|------|------|----------|
| **FDW** | Native, efficient, SQL | Requires extension | ✅ **Chosen** |
| Dual connections | Always works | Slower, memory overhead | Fallback only |
| Manual export/import | Simple | Very slow, manual | ❌ Rejected |

### 2. React Query (TanStack Query)

**Purpose:** Data fetching, caching, and state management for API calls

**Why React Query?**

- ✅ Automatic background refetching
- ✅ Built-in caching (reduces API calls)
- ✅ Loading/error states handled
- ✅ Optimistic updates
- ✅ Polling support (auto-refresh)

**Usage:**

```typescript
// Fetch system health with auto-refresh every 10s
const {
  data: health,
  isLoading,
  error,
} = useQuery({
  queryKey: ['devops', 'health'],
  queryFn: () => fetch('/api/devops/health').then(r => r.json()),
  refetchInterval: 10000, // 10 seconds
  staleTime: 5000,
})
```

**Installation:**

```bash
npm install @tanstack/react-query
```

### 3. Framer Motion

**Purpose:** Smooth drawer animations

**Why Framer Motion?**

- ✅ Already in dependencies (framer-motion: ^10.16.16)
- ✅ Production-ready animations
- ✅ Gesture support (swipe to close)
- ✅ Accessibility (respects prefers-reduced-motion)

**Usage:**

```typescript
import { motion, AnimatePresence } from 'framer-motion'

<AnimatePresence>
  {isOpen && (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25 }}
    >
      {/* Drawer content */}
    </motion.div>
  )}
</AnimatePresence>
```

### 4. Drizzle ORM

**Purpose:** Database queries (already in use)

**Why leverage existing Drizzle setup?**

- ✅ Type-safe queries
- ✅ Already configured
- ✅ Team familiar with it
- ✅ Works with raw SQL when needed (for FDW)

**Usage:**

```typescript
import { db } from '@/db'
import { sql } from 'drizzle-orm'

// Type-safe query
const products = await db.select().from(products)

// Raw SQL for FDW queries
const comparison = await db.execute(sql`
  SELECT * FROM pg_tables local
  FULL OUTER JOIN dev_remote.pg_tables remote
    ON local.tablename = remote.tablename
`)
```

### 5. Zustand (Optional - State Management)

**Purpose:** Global state for drawer open/closed state

**Why Zustand?**

- ✅ Already in dependencies (zustand: ^4.4.7)
- ✅ Simple, lightweight
- ✅ No provider wrapper needed
- ✅ Persistent state (localStorage)

**Usage:**

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface DevOpsDrawerState {
  isOpen: boolean
  expandedSections: string[]
  toggleDrawer: () => void
  toggleSection: (section: string) => void
}

export const useDevOpsDrawer = create<DevOpsDrawerState>()(
  persist(
    set => ({
      isOpen: false,
      expandedSections: ['health', 'environment'],
      toggleDrawer: () => set(state => ({ isOpen: !state.isOpen })),
      toggleSection: section =>
        set(state => ({
          expandedSections: state.expandedSections.includes(section)
            ? state.expandedSections.filter(s => s !== section)
            : [...state.expandedSections, section],
        })),
    }),
    { name: 'devops-drawer' }
  )
)
```

---

## Component Structure

### File Organization

```
src/
├── components/
│   └── devops/
│       ├── DevOpsDrawer.tsx           # Main drawer component
│       ├── DevOpsDrawer.module.css    # Styles
│       ├── sections/
│       │   ├── HealthStatus.tsx       # System health section
│       │   ├── EnvironmentInfo.tsx    # Environment metadata
│       │   ├── DatabaseInspector.tsx  # Database tables/info
│       │   ├── SchemaComparison.tsx   # Cross-DB schema diff
│       │   ├── ConfigStatus.tsx       # Configuration info
│       │   ├── PerformanceMetrics.tsx # Performance stats
│       │   └── ActivityLog.tsx        # Recent activity
│       ├── hooks/
│       │   ├── useHealthCheck.ts      # Fetch health data
│       │   ├── useEnvironmentInfo.ts  # Fetch env data
│       │   ├── useDatabaseInfo.ts     # Fetch DB data
│       │   └── useSchemaComparison.ts # Fetch schema diff
│       └── utils/
│           ├── fdw-setup.ts           # FDW connection setup
│           └── schema-diff.ts         # Schema comparison logic
│
├── app/
│   └── api/
│       └── devops/
│           ├── health/
│           │   └── route.ts           # GET system health
│           ├── environment/
│           │   └── route.ts           # GET env metadata
│           ├── database/
│           │   ├── info/
│           │   │   └── route.ts       # GET table list + counts
│           │   ├── compare/
│           │   │   └── route.ts       # POST schema comparison
│           │   └── fdw/
│           │       ├── setup/
│           │       │   └── route.ts   # POST setup FDW
│           │       └── teardown/
│           │           └── route.ts   # POST remove FDW
│           └── config/
│               └── route.ts           # GET configuration status
│
└── stores/
    └── devopsDrawerStore.ts           # Zustand store (optional)
```

### Component Hierarchy

```
DevOpsDrawer
├── DrawerHeader
│   ├── Title ("DevOps Console")
│   └── CloseButton
│
├── DrawerContent (scrollable)
│   ├── HealthStatus
│   │   ├── ServiceStatus (Database)
│   │   ├── ServiceStatus (AI)
│   │   ├── ServiceStatus (Stripe)
│   │   └── ServiceStatus (Email)
│   │
│   ├── EnvironmentInfo
│   │   ├── EnvironmentBadge (DEV/UAT/PROD)
│   │   ├── GitInfo (branch, commit)
│   │   ├── VersionInfo (app, node, next)
│   │   └── DeploymentInfo (date, time)
│   │
│   ├── DatabaseInspector
│   │   ├── DatabaseSelector (Local/DEV/UAT)
│   │   ├── TableList
│   │   │   └── TableRow (name, count, size) × N
│   │   └── TableDetails (expanded)
│   │       ├── ColumnList
│   │       ├── IndexList
│   │       └── RelationshipList
│   │
│   ├── SchemaComparison
│   │   ├── SourceSelector (Local/DEV/UAT)
│   │   ├── TargetSelector (DEV/UAT/PROD)
│   │   ├── CompareButton
│   │   └── DiffView
│   │       ├── TablesAdded
│   │       ├── TablesRemoved
│   │       └── TablesModified
│   │
│   ├── ConfigStatus
│   │   ├── AuthProviders (Google, GitHub)
│   │   ├── FeatureFlags
│   │   └── SecretWarnings
│   │
│   ├── PerformanceMetrics (optional)
│   │   ├── Uptime
│   │   ├── MemoryUsage
│   │   └── RequestCount
│   │
│   └── ActivityLog (optional)
│       └── LogEntry × N
│
└── DrawerFooter
    ├── RefreshButton
    ├── LastUpdated
    └── QuickActions
        ├── ClearCache
        └── ExportLogs
```

---

## API Endpoints

### 1. System Health (`/api/devops/health`)

**Method:** GET

**Response:**

```typescript
interface HealthResponse {
  timestamp: string
  overall: 'healthy' | 'degraded' | 'unhealthy'
  services: {
    database: {
      status: 'healthy' | 'unhealthy'
      latency: number // ms
      connectionPool: { active: number; idle: number }
    }
    ai: {
      status: 'healthy' | 'unhealthy'
      provider: 'gemini' | 'openai'
      quotaRemaining?: number
    }
    stripe: {
      status: 'healthy' | 'unhealthy'
      mode: 'test' | 'live'
    }
    email: {
      status: 'healthy' | 'unhealthy'
      provider: 'console' | 'ses' | 'sendgrid'
    }
    cache?: {
      status: 'healthy' | 'unhealthy'
      provider: 'redis' | 'memory'
    }
  }
}
```

**Implementation:**

```typescript
// app/api/devops/health/route.ts
import { db } from '@/db'
import { NextResponse } from 'next/server'

export async function GET() {
  const checks = await Promise.allSettled([checkDatabase(), checkAI(), checkStripe(), checkEmail()])

  const services = {
    database: checks[0].status === 'fulfilled' ? checks[0].value : { status: 'unhealthy' },
    ai: checks[1].status === 'fulfilled' ? checks[1].value : { status: 'unhealthy' },
    stripe: checks[2].status === 'fulfilled' ? checks[2].value : { status: 'unhealthy' },
    email: checks[3].status === 'fulfilled' ? checks[3].value : { status: 'unhealthy' },
  }

  const overall = Object.values(services).every(s => s.status === 'healthy')
    ? 'healthy'
    : Object.values(services).some(s => s.status === 'unhealthy')
      ? 'degraded'
      : 'unhealthy'

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    overall,
    services,
  })
}

async function checkDatabase() {
  const start = Date.now()
  await db.execute('SELECT 1')
  const latency = Date.now() - start

  return {
    status: 'healthy',
    latency,
    connectionPool: { active: 1, idle: 4 }, // Mock data
  }
}
```

### 2. Environment Info (`/api/devops/environment`)

**Method:** GET

**Response:**

```typescript
interface EnvironmentResponse {
  environment: 'local' | 'dev' | 'uat' | 'prod'
  git: {
    branch: string
    commit: string
    commitShort: string
    commitDate: string
    commitMessage: string
  }
  versions: {
    app: string
    node: string
    nextjs: string
    database: string
  }
  deployment: {
    deployedAt: string
    deployedBy?: string
    buildNumber?: string
  }
}
```

**Implementation:**

```typescript
// app/api/devops/environment/route.ts
import { execSync } from 'child_process'
import { NextResponse } from 'next/server'
import packageJson from '@/package.json'

export async function GET() {
  const gitCommit = execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim()
  const gitBranch = execSync('git branch --show-current', { encoding: 'utf-8' }).trim()
  const gitDate = execSync('git log -1 --format=%ci', { encoding: 'utf-8' }).trim()
  const gitMessage = execSync('git log -1 --format=%s', { encoding: 'utf-8' }).trim()

  return NextResponse.json({
    environment: process.env.NODE_ENV === 'production' ? process.env.VERCEL_ENV || 'prod' : 'local',
    git: {
      branch: gitBranch,
      commit: gitCommit,
      commitShort: gitCommit.substring(0, 7),
      commitDate: gitDate,
      commitMessage: gitMessage,
    },
    versions: {
      app: packageJson.version,
      node: process.version,
      nextjs: packageJson.dependencies.next,
      database: 'PostgreSQL 15',
    },
    deployment: {
      deployedAt: new Date().toISOString(),
      deployedBy: process.env.VERCEL_GIT_COMMIT_AUTHOR_NAME,
      buildNumber: process.env.VERCEL_GIT_COMMIT_SHA,
    },
  })
}
```

### 3. Database Info (`/api/devops/database/info`)

**Method:** GET

**Query Parameters:**

- `database` (optional): Which database to query (local, dev, uat, prod)

**Response:**

```typescript
interface DatabaseInfoResponse {
  database: {
    name: string
    type: 'postgresql'
    version: string
    size: string
  }
  tables: Array<{
    name: string
    rowCount: number
    size: string
    lastModified: string
    columns: number
    indexes: number
  }>
  statistics: {
    totalTables: number
    totalRows: number
    totalSize: string
  }
}
```

**Implementation:**

```typescript
// app/api/devops/database/info/route.ts
import { db } from '@/db'
import { sql } from 'drizzle-orm'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const targetDb = searchParams.get('database') || 'local'

  // Get table list with statistics
  const tables = await db.execute(sql`
    SELECT
      schemaname,
      tablename,
      pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
      (SELECT count(*) FROM pg_stat_user_tables WHERE tablename = t.tablename) as row_count,
      (SELECT last_vacuum FROM pg_stat_user_tables WHERE tablename = t.tablename) as last_modified
    FROM pg_tables t
    WHERE schemaname = 'public'
    ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
  `)

  return NextResponse.json({
    database: {
      name: process.env.DATABASE_URL?.split('/').pop()?.split('?')[0] || 'unknown',
      type: 'postgresql',
      version: '15',
      size: '458 KB',
    },
    tables: tables.rows,
    statistics: {
      totalTables: tables.rows.length,
      totalRows: tables.rows.reduce((sum, t) => sum + (t.row_count || 0), 0),
      totalSize: '458 KB',
    },
  })
}
```

### 4. Schema Comparison (`/api/devops/database/compare`)

**Method:** POST

**Body:**

```typescript
{
  source: 'local' | 'dev' | 'uat' | 'prod'
  target: 'dev' | 'uat' | 'prod'
}
```

**Response:**

```typescript
interface SchemaComparisonResponse {
  timestamp: string
  source: string
  target: string
  comparison: {
    tablesOnlyInSource: string[]
    tablesOnlyInTarget: string[]
    tablesInBoth: string[]
    columnDifferences: Array<{
      table: string
      column: string
      status: 'added' | 'removed' | 'modified'
      sourceType?: string
      targetType?: string
    }>
    breakingChanges: string[]
    isCompatible: boolean
  }
}
```

**Implementation:**

```typescript
// app/api/devops/database/compare/route.ts
import { db } from '@/db'
import { sql } from 'drizzle-orm'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { source, target } = await request.json()

  // Ensure FDW is setup for target
  await setupFDW(target)

  // Compare tables
  const tableComparison = await db.execute(sql`
    SELECT
      COALESCE(s.tablename, t.tablename) as table_name,
      CASE
        WHEN s.tablename IS NULL THEN 'only_in_target'
        WHEN t.tablename IS NULL THEN 'only_in_source'
        ELSE 'in_both'
      END as status
    FROM pg_tables s
    FULL OUTER JOIN ${sql.raw(target)}_remote.pg_tables t
      ON s.tablename = t.tablename
    WHERE s.schemaname = 'public' OR t.schemaname = 'public'
  `)

  // Compare columns for tables in both
  const columnComparison = await db.execute(sql`
    SELECT
      COALESCE(s.table_name, t.table_name) as table_name,
      COALESCE(s.column_name, t.column_name) as column_name,
      s.data_type as source_type,
      t.data_type as target_type,
      CASE
        WHEN s.column_name IS NULL THEN 'removed'
        WHEN t.column_name IS NULL THEN 'added'
        WHEN s.data_type != t.data_type THEN 'modified'
        ELSE 'same'
      END as status
    FROM information_schema.columns s
    FULL OUTER JOIN ${sql.raw(target)}_remote.information_schema.columns t
      ON s.table_name = t.table_name AND s.column_name = t.column_name
    WHERE (s.table_schema = 'public' OR t.table_schema = 'public')
      AND status != 'same'
  `)

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    source,
    target,
    comparison: {
      tablesOnlyInSource: tableComparison.rows
        .filter(r => r.status === 'only_in_source')
        .map(r => r.table_name),
      tablesOnlyInTarget: tableComparison.rows
        .filter(r => r.status === 'only_in_target')
        .map(r => r.table_name),
      tablesInBoth: tableComparison.rows.filter(r => r.status === 'in_both').map(r => r.table_name),
      columnDifferences: columnComparison.rows,
      breakingChanges: detectBreakingChanges(columnComparison.rows),
      isCompatible: detectBreakingChanges(columnComparison.rows).length === 0,
    },
  })
}

async function setupFDW(environment: string) {
  const urls = {
    dev: process.env.DEV_POSTGRES_URL,
    uat: process.env.UAT_POSTGRES_URL,
    prod: process.env.PROD_POSTGRES_URL,
  }

  const url = urls[environment]
  if (!url) throw new Error(`No URL for ${environment}`)

  const parsed = new URL(url)

  await db.execute(
    sql.raw(`
    CREATE EXTENSION IF NOT EXISTS postgres_fdw;

    DROP SERVER IF EXISTS ${environment}_server CASCADE;
    CREATE SERVER ${environment}_server
    FOREIGN DATA WRAPPER postgres_fdw
    OPTIONS (
      host '${parsed.hostname}',
      port '${parsed.port || '5432'}',
      dbname '${parsed.pathname.slice(1)}',
      sslmode 'require'
    );

    CREATE USER MAPPING FOR CURRENT_USER
    SERVER ${environment}_server
    OPTIONS (user '${parsed.username}', password '${parsed.password}');

    DROP SCHEMA IF EXISTS ${environment}_remote CASCADE;
    CREATE SCHEMA ${environment}_remote;

    IMPORT FOREIGN SCHEMA public
    FROM SERVER ${environment}_server
    INTO ${environment}_remote;
  `)
  )
}
```

---

## Database Schema

### No Additional Tables Required

The DevOps Drawer uses existing database introspection via PostgreSQL system catalogs:

- `pg_tables` - Table metadata
- `pg_stat_user_tables` - Table statistics
- `information_schema.columns` - Column metadata
- `information_schema.table_constraints` - Constraint info

### Optional: Activity Log Table

If implementing activity logging:

```sql
CREATE TABLE devops_activity_log (
  id SERIAL PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  event_type TEXT NOT NULL, -- 'query', 'deployment', 'error', etc.
  user_id INTEGER REFERENCES users(id),
  description TEXT NOT NULL,
  metadata JSONB,

  INDEX idx_timestamp (timestamp),
  INDEX idx_event_type (event_type)
);
```

---

## Implementation Steps

### Phase 1: Core Drawer (4-6 hours)

**Step 1: Create base components**

```bash
mkdir -p src/components/devops/sections
mkdir -p src/components/devops/hooks
mkdir -p src/app/api/devops/{health,environment,database/info}
```

**Step 2: Implement drawer shell**

- `DevOpsDrawer.tsx` - Main component with slide animation
- `DevOpsDrawer.module.css` - Styling
- Wire up to EnvironmentBadge click

**Step 3: Add React Query provider**

```typescript
// app/providers.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient()

export function Providers({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      {/* existing providers */}
      {children}
    </QueryClientProvider>
  )
}
```

**Step 4: Implement API endpoints**

- `/api/devops/health` - System health checks
- `/api/devops/environment` - Git/version info
- `/api/devops/database/info` - Basic table list

**Step 5: Create sections**

- `HealthStatus.tsx` - Display health data
- `EnvironmentInfo.tsx` - Display git/version data
- `DatabaseInspector.tsx` - Display table list

**Milestone:** Can open drawer, see basic info, auto-refresh works

### Phase 2: Database Inspector (3-4 hours)

**Step 1: Enhanced database queries**

- Add row counts per table
- Add table sizes
- Add last modified timestamps

**Step 2: Expandable table details**

- Click table to expand
- Show column list (name, type, nullable)
- Show indexes
- Show relationships (foreign keys)

**Step 3: Add search/filter**

- Filter tables by name
- Sort by name/size/count

**Milestone:** Can browse database schema in detail

### Phase 3: Schema Comparison (4-5 hours)

**Step 1: FDW setup endpoint**

- `/api/devops/database/fdw/setup` - Setup FDW connection
- Test connection to DEV/UAT/PROD

**Step 2: Schema comparison endpoint**

- `/api/devops/database/compare` - Compare schemas
- Detect tables added/removed
- Detect column changes
- Detect breaking changes

**Step 3: Comparison UI**

- `SchemaComparison.tsx` component
- Source/target selectors
- Diff viewer with color coding
- Breaking change warnings

**Milestone:** Can compare local vs DEV schemas visually

### Phase 4: Polish & Optimization (2-3 hours)

**Step 1: Error handling**

- Handle API failures gracefully
- Show error messages
- Retry logic

**Step 2: Loading states**

- Skeleton loaders
- Spinners
- Progress indicators

**Step 3: Accessibility**

- Keyboard navigation (Tab, Escape)
- Screen reader support
- Focus management

**Step 4: Performance**

- Debounce search
- Virtualize long lists
- Optimize queries

**Milestone:** Production-ready feature

---

## Security Considerations

### 1. Environment Gating

```typescript
// Only show drawer in non-production
if (process.env.NODE_ENV === 'production' && process.env.VERCEL_ENV === 'production') {
  return null // Don't render drawer in production
}
```

### 2. API Route Protection

```typescript
// Protect sensitive endpoints
export async function GET(request: Request) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production' && process.env.VERCEL_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  // Or require authentication
  const session = await getServerSession(authOptions)
  if (!session || !session.user?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Proceed with logic
}
```

### 3. Credential Masking

```typescript
// Never expose full credentials
const maskedEnvVars = {
  GEMINI_API_KEY: process.env.GEMINI_API_KEY
    ? `${process.env.GEMINI_API_KEY.substring(0, 8)}...`
    : 'Not set',
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY
    ? `sk_***...${process.env.STRIPE_SECRET_KEY.slice(-4)}`
    : 'Not set',
}
```

### 4. Read-Only Database Access

```typescript
// For production FDW, use read-only credentials
const prodUrl = process.env.PROD_POSTGRES_URL_READONLY // Separate read-only user

// Or set session to read-only
await db.execute(sql`SET SESSION CHARACTERISTICS AS TRANSACTION READ ONLY`)
```

### 5. Rate Limiting

```typescript
// Limit API calls to prevent abuse
import { withRateLimit } from '@/lib/with-rate-limit'

export const GET = withRateLimit(
  async (request: Request) => {
    // Handler logic
  },
  { maxRequests: 60, windowMs: 60000 } // 60 requests per minute
)
```

---

## Testing Strategy

### Unit Tests

```typescript
// __tests__/components/devops/DatabaseInspector.test.tsx
import { render, screen } from '@testing-library/react'
import { DatabaseInspector } from '@/components/devops/sections/DatabaseInspector'

describe('DatabaseInspector', () => {
  it('renders table list', () => {
    const tables = [
      { name: 'products', rowCount: 12, size: '48KB' },
      { name: 'orders', rowCount: 156, size: '124KB' }
    ]

    render(<DatabaseInspector tables={tables} />)

    expect(screen.getByText('products')).toBeInTheDocument()
    expect(screen.getByText('12 rows')).toBeInTheDocument()
  })

  it('expands table details on click', async () => {
    // Test expansion logic
  })
})
```

### Integration Tests

```typescript
// __tests__/api/devops/health.test.ts
import { GET } from '@/app/api/devops/health/route'

describe('/api/devops/health', () => {
  it('returns healthy status', async () => {
    const response = await GET(new Request('http://localhost:3000/api/devops/health'))
    const data = await response.json()

    expect(data.overall).toBe('healthy')
    expect(data.services.database.status).toBe('healthy')
  })
})
```

### Manual Testing Checklist

- [ ] Drawer opens on badge click
- [ ] Drawer closes on X button click
- [ ] Drawer closes on outside click
- [ ] Drawer closes on Escape key
- [ ] Health status updates every 10 seconds
- [ ] Table list shows correct counts
- [ ] Schema comparison works (local vs DEV)
- [ ] Breaking changes detected correctly
- [ ] FDW connection works
- [ ] Mobile responsive (full screen on mobile)
- [ ] Keyboard navigation works
- [ ] Loading states display correctly
- [ ] Error states display correctly

---

## Performance Optimization

### 1. Query Optimization

```sql
-- Use indexes for faster queries
CREATE INDEX idx_products_created_at ON products(created_at);

-- Use COUNT(*) instead of SELECT COUNT(*)
-- PostgreSQL optimizes COUNT(*)

-- For large tables, use estimates
SELECT reltuples::bigint AS estimate
FROM pg_class
WHERE relname = 'products';
```

### 2. Caching Strategy

```typescript
// React Query caching
const { data } = useQuery({
  queryKey: ['database', 'tables'],
  queryFn: fetchTables,
  staleTime: 30000, // Consider fresh for 30s
  cacheTime: 300000, // Keep in cache for 5min
})
```

### 3. Lazy Loading

```typescript
// Only fetch when drawer opens
useEffect(() => {
  if (isOpen) {
    fetchHealthData()
    fetchEnvironmentData()
    fetchDatabaseData()
  }
}, [isOpen])
```

### 4. Virtualization (for large lists)

```typescript
// Use react-window for large table lists
import { FixedSizeList } from 'react-window'

<FixedSizeList
  height={400}
  itemCount={tables.length}
  itemSize={50}
>
  {({ index, style }) => (
    <div style={style}>{tables[index].name}</div>
  )}
</FixedSizeList>
```

---

## Troubleshooting

### Issue: FDW Connection Fails

**Symptoms:**

```
ERROR: could not connect to server
```

**Solutions:**

1. Check environment variable exists: `echo $DEV_POSTGRES_URL`
2. Test connection manually: `psql $DEV_POSTGRES_URL -c "SELECT 1"`
3. Verify SSL mode: Neon requires `sslmode=require`
4. Check network: Firewall may block PostgreSQL port 5432

### Issue: Drawer Not Opening

**Symptoms:**

- Click badge, nothing happens

**Solutions:**

1. Check console for errors
2. Verify Zustand store is working: `useDevOpsDrawer.getState()`
3. Check if component is rendered: Inspect React DevTools
4. Verify environment gating isn't blocking it

### Issue: Stale Data

**Symptoms:**

- Data not refreshing

**Solutions:**

1. Check React Query `refetchInterval` is set
2. Manually invalidate cache: `queryClient.invalidateQueries(['health'])`
3. Check network tab: Are API calls being made?
4. Verify API endpoint is working: `curl http://localhost:3000/api/devops/health`

---

## Next Steps

### Immediate (Phase 1)

1. Implement core drawer component
2. Add basic API endpoints
3. Test with simple data

### Short-term (Phase 2-3)

1. Add database inspector
2. Implement FDW schema comparison
3. Polish UI/UX

### Future Enhancements

1. **Export functionality** - Download schema comparison as JSON/CSV
2. **Real-time updates** - WebSocket for live data
3. **Query builder** - Visual query builder for cross-DB queries
4. **Performance profiling** - Show slow queries
5. **Deployment history** - Timeline of deployments
6. **Team collaboration** - Share drawer state via URL

---

**Document Version:** 1.0
**Last Updated:** 2025-10-05
**Author:** Development Team
**Status:** Ready for Implementation

**Estimated Implementation Time:** 12-18 hours (over 2-3 days)
**Priority:** Medium (Nice-to-have, high developer productivity value)
