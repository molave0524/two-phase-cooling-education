# Database Deployment Automation System - Technical Implementation Guide

**Audience:** Developers
**Purpose:** Complete technical specification for implementing autonomous database deployment system
**Date:** 2025-10-05
**Status:** Design Complete - Ready for Implementation

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Core Components](#core-components)
4. [Implementation Steps](#implementation-steps)
5. [File Structure](#file-structure)
6. [Configuration](#configuration)
7. [Database Schema Requirements](#database-schema-requirements)
8. [Testing Strategy](#testing-strategy)
9. [Troubleshooting](#troubleshooting)

---

## System Overview

### Problem Statement

Manual database deployments with complex schema changes are:

- Time-consuming (hours spent testing migrations)
- Error-prone (breaking changes discovered in production)
- Difficult to rollback (no automated recovery)
- Lack visibility (no audit trail or comparison tools)

### Solution

Autonomous deployment system that:

- ✅ Tests migrations in isolated sandbox environment
- ✅ Compares schemas across databases (using PostgreSQL FDW)
- ✅ Automatically rolls back on failure
- ✅ Logs all actions with structured data
- ✅ Alerts team on success/failure
- ✅ Requires minimal human intervention

### Key Design Decisions

| Decision                | Rationale                                                      |
| ----------------------- | -------------------------------------------------------------- |
| **Codebase-integrated** | Leverages existing dependencies, no separate tool installation |
| **PostgreSQL-specific** | Uses FDW for cross-database queries (powerful, native)         |
| **Drizzle-aware**       | Works with existing migration system                           |
| **Sandbox-first**       | Tests on cloned production data before target deployment       |
| **Auto-rollback**       | Database + code reversion on failure                           |

---

## Architecture

### High-Level Flow

```
┌─────────────────────────────────────────────────────────────┐
│ DEVELOPER WORKFLOW                                          │
└─────────────────────────────────────────────────────────────┘

1. Developer makes schema changes on feature branch
2. Runs: npm run deploy:dev
3. System executes autonomous deployment:

   ┌─────────────────┐
   │ Pre-flight      │ → Validate environment, check schema changes
   │ Checks          │
   └────────┬────────┘
            │
   ┌────────▼────────┐
   │ Sandbox         │ → Clone target DB, apply migrations, test
   │ Validation      │
   └────────┬────────┘
            │
   ┌────────▼────────┐
   │ Backup          │ → Capture rollback state (DB + Git)
   │ Target          │
   └────────┬────────┘
            │
   ┌────────▼────────┐
   │ Deploy to       │ → Merge code, push to Git, trigger Vercel
   │ Target          │
   └────────┬────────┘
            │
   ┌────────▼────────┐
   │ Post-Deploy     │ → Validate schema, health checks
   │ Validation      │
   └────────┬────────┘
            │
            ├─ SUCCESS → Alert team, cleanup
            │
            └─ FAILURE → Auto-rollback, alert team
```

### Multi-Database Architecture

```
┌──────────────────┐
│ Feature Branch   │ (Local Docker PostgreSQL)
│ DB: localhost    │
│ Port: 5432       │
└────────┬─────────┘
         │
         │ FDW Connection
         │ (for comparison)
         ▼
┌──────────────────┐
│ Sandbox DB       │ (Local Docker PostgreSQL)
│ Port: 5432       │ Clone of target
│ Isolated test    │
└────────┬─────────┘
         │
         │ Validates migration
         ▼
┌──────────────────┐
│ Target DB (DEV)  │ (Neon PostgreSQL)
│ ep-dev-xxx       │ Production-like data
│ Neon branch      │
└──────────────────┘
```

---

## Core Components

### 1. Deployment Orchestrator (`scripts/deploy/deploy.ts`)

**Responsibilities:**

- Coordinate all deployment phases
- Make autonomous decisions (proceed/abort/rollback)
- Manage deployment lifecycle

**Key Methods:**

```typescript
class DatabaseDeployment {
  async execute(): Promise<DeploymentResult>

  private async preflightChecks(): Promise<void>
  private async sandboxValidation(): Promise<boolean>
  private async deployToTarget(): Promise<void>
  private async postDeploymentValidation(): Promise<boolean>
}
```

**Decision Logic:**

```typescript
// Autonomous decision: proceed or abort?
if (schemaComparison.breakingChanges.length > 0) {
  // Breaking changes detected
  if (schemaComparison.breakingChanges.includes('table removed')) {
    // ABORT: Too dangerous
    return false
  } else if (schemaComparison.breakingChanges.includes('column removed')) {
    // WARN: Proceed with caution (not null columns OK)
    logger.warn('Column removal detected, proceeding...')
  }
}
```

### 2. Structured Logger (`scripts/deploy/logger.ts`)

**Responsibilities:**

- Write structured logs (JSON lines)
- Console output with colors
- Store in database (queryable)
- Generate deployment reports

**Log Format:**

```json
{
  "timestamp": "2025-10-05T16:30:45.123Z",
  "deploymentId": "deploy-dev-1728149445123",
  "phase": "SANDBOX_VALIDATION",
  "level": "INFO",
  "message": "Sandbox validation passed",
  "metadata": {
    "tablesModified": 2,
    "columnsAdded": 5,
    "duration": "12.3s"
  }
}
```

**Usage:**

```typescript
logger.info('Starting deployment', { environment: 'dev' })
logger.phase('SANDBOX VALIDATION')
logger.error('Migration failed', error, { sql: migrationSql })
logger.success('Deployment complete', { duration: '45s' })
```

### 3. Schema Comparator (`scripts/deploy/schema-compare.ts`)

**Responsibilities:**

- Setup FDW connections to remote databases
- Compare schemas (tables, columns, indexes, constraints)
- Detect breaking changes
- Compare data (row counts, orphaned records)

**FDW Setup:**

```sql
-- Enable extension
CREATE EXTENSION IF NOT EXISTS postgres_fdw;

-- Create foreign server
CREATE SERVER dev_server
FOREIGN DATA WRAPPER postgres_fdw
OPTIONS (host 'ep-dev-xxx.neon.tech', dbname 'neondb', sslmode 'require');

-- Create user mapping
CREATE USER MAPPING FOR CURRENT_USER
SERVER dev_server
OPTIONS (user 'neondb_owner', password 'xxx');

-- Import schema
CREATE SCHEMA dev_remote;
IMPORT FOREIGN SCHEMA public FROM SERVER dev_server INTO dev_remote;
```

**Schema Comparison Query:**

```sql
-- Compare table lists
SELECT
  COALESCE(local.tablename, remote.tablename) as table_name,
  CASE
    WHEN local.tablename IS NULL THEN 'only_in_remote'
    WHEN remote.tablename IS NULL THEN 'only_in_local'
    ELSE 'in_both'
  END as status
FROM pg_tables local
FULL OUTER JOIN dev_remote.pg_tables remote
  ON local.tablename = remote.tablename
WHERE local.schemaname = 'public' OR remote.schemaname = 'public';

-- Compare columns
SELECT
  COALESCE(l.column_name, r.column_name) as column_name,
  l.data_type as local_type,
  r.data_type as remote_type,
  CASE
    WHEN l.column_name IS NULL THEN 'added_in_remote'
    WHEN r.column_name IS NULL THEN 'added_in_local'
    WHEN l.data_type != r.data_type THEN 'type_mismatch'
    ELSE 'match'
  END as status
FROM information_schema.columns l
FULL OUTER JOIN dev_remote.information_schema.columns r
  ON l.table_name = r.table_name AND l.column_name = r.column_name
WHERE l.table_name = 'products' OR r.table_name = 'products';
```

**Breaking Change Detection:**

```typescript
detectBreakingChanges(comparison: SchemaComparison): string[] {
  const breaking: string[] = []

  // Tables removed = BREAKING
  if (comparison.tablesOnlyInTarget.length > 0) {
    breaking.push(`Tables removed: ${comparison.tablesOnlyInTarget.join(', ')}`)
  }

  // Columns removed = BREAKING (usually)
  const removed = comparison.columnDifferences.filter(c => c.status === 'removed')
  if (removed.length > 0) {
    breaking.push(`Columns removed: ${removed.map(c => c.table + '.' + c.column).join(', ')}`)
  }

  // Type changes = POTENTIALLY BREAKING
  const typeChanges = comparison.columnDifferences.filter(c => c.status === 'modified')
  for (const change of typeChanges) {
    if (!this.isCompatibleTypeChange(change.sourceType, change.targetType)) {
      breaking.push(`Incompatible type: ${change.table}.${change.column}`)
    }
  }

  return breaking
}
```

### 4. Rollback Manager (`scripts/deploy/rollback.ts`)

**Responsibilities:**

- Capture pre-deployment state
- Backup database (pg_dump)
- Record Git commit hash
- Execute rollback on failure
- Restore database + revert code

**Rollback State:**

```json
{
  "deploymentId": "deploy-dev-1728149445123",
  "timestamp": "2025-10-05T16:30:00.000Z",
  "environment": "dev",
  "databaseBackup": "./.deployments/deploy-dev-1728149445123/backup.dump",
  "gitCommit": "daa88785c6bb43f9f6b86e3dafb49ecb6cf65918",
  "gitBranch": "develop",
  "canRollback": true
}
```

**Rollback Procedure:**

```typescript
async rollback(env: Environment, targetDbUrl: string): Promise<void> {
  // 1. Restore database
  execSync(`pg_restore --dbname="${targetDbUrl}" --clean --if-exists ${this.state.databaseBackup}`)

  // 2. Revert code
  execSync(`git reset --hard ${this.state.gitCommit}`)
  execSync(`git push origin ${this.state.gitBranch} --force`)

  // 3. Wait for Vercel redeployment
  await this.waitForRedeployment(30000)

  logger.info('✅ Rollback complete')
}
```

### 5. Alert System (`scripts/deploy/alerts.ts`)

**Responsibilities:**

- Send Slack notifications
- Send email alerts
- Call webhook endpoints
- Format messages appropriately

**Slack Integration:**

```typescript
async sendSlack(alert: Alert): Promise<void> {
  const payload = {
    text: `🚀 Deployment ${alert.success ? 'Success' : 'Failed'}`,
    attachments: [{
      color: alert.success ? '#36a64f' : '#f44336',
      fields: [
        { title: 'Environment', value: alert.environment, short: true },
        { title: 'Duration', value: `${alert.duration}s`, short: true },
        { title: 'Deployment ID', value: alert.deploymentId }
      ]
    }]
  }

  await fetch(process.env.SLACK_WEBHOOK_URL, {
    method: 'POST',
    body: JSON.stringify(payload)
  })
}
```

---

## Implementation Steps

### Phase 1: Core Framework (4-6 hours)

```bash
# 1. Create directory structure
mkdir -p scripts/deploy
mkdir -p .deployments

# 2. Create base files
touch scripts/deploy/deploy.ts
touch scripts/deploy/logger.ts
touch scripts/deploy/schema-compare.ts
touch scripts/deploy/rollback.ts
touch scripts/deploy/alerts.ts

# 3. Install dependencies (if needed)
npm install --save-dev commander chalk ora
```

**Files to create:**

1. **`scripts/deploy/logger.ts`**
   - Implement `DeploymentLogger` class
   - JSON lines format
   - Console formatting with colors
   - Database logging (optional)
   - Report generation

2. **`scripts/deploy/schema-compare.ts`**
   - Implement `SchemaComparator` class
   - FDW setup method
   - Schema comparison queries
   - Breaking change detection
   - Data comparison methods

3. **`scripts/deploy/rollback.ts`**
   - Implement `RollbackManager` class
   - State capture (pg_dump + Git)
   - Rollback execution
   - Verification

4. **`scripts/deploy/alerts.ts`**
   - Implement `AlertSystem` class
   - Slack webhook integration
   - Email sending (optional)
   - Generic webhook support

5. **`scripts/deploy/deploy.ts`**
   - Implement `DatabaseDeployment` class
   - Wire all components together
   - Deployment phases
   - CLI interface

### Phase 2: Sandbox Validation (3-4 hours)

```typescript
// Implement sandbox creation/destruction
async createSandbox(): Promise<SandboxDB> {
  const name = `sandbox_${this.deploymentId}`

  // Create database
  execSync(`docker exec postgres-dev psql -U postgres -c "CREATE DATABASE ${name}"`)

  // Clone from target
  const targetUrl = this.getTargetDbUrl()
  const dumpFile = `./.deployments/${this.deploymentId}/clone.dump`
  execSync(`pg_dump "${targetUrl}" --format=custom --file=${dumpFile}`)
  execSync(`pg_restore --dbname="postgresql://postgres:postgres@localhost:5432/${name}" ${dumpFile}`)

  return {
    name,
    url: `postgresql://postgres:postgres@localhost:5432/${name}`
  }
}

async destroySandbox(sandbox: SandboxDB): Promise<void> {
  execSync(`docker exec postgres-dev psql -U postgres -c "DROP DATABASE ${sandbox.name}"`)
}
```

### Phase 3: FDW Integration (2-3 hours)

```typescript
// Setup FDW connection
async setupFDW(remoteName: string, remoteUrl: string): Promise<void> {
  const parsed = new URL(remoteUrl)

  // SQL to execute
  const sql = `
    CREATE EXTENSION IF NOT EXISTS postgres_fdw;

    DROP SERVER IF EXISTS ${remoteName}_server CASCADE;
    CREATE SERVER ${remoteName}_server
    FOREIGN DATA WRAPPER postgres_fdw
    OPTIONS (
      host '${parsed.hostname}',
      port '${parsed.port || '5432'}',
      dbname '${parsed.pathname.slice(1)}',
      sslmode 'require'
    );

    CREATE USER MAPPING FOR CURRENT_USER
    SERVER ${remoteName}_server
    OPTIONS (user '${parsed.username}', password '${parsed.password}');

    DROP SCHEMA IF EXISTS ${remoteName}_remote CASCADE;
    CREATE SCHEMA ${remoteName}_remote;

    IMPORT FOREIGN SCHEMA public
    FROM SERVER ${remoteName}_server
    INTO ${remoteName}_remote;
  `

  await db.execute(sql)
}
```

### Phase 4: Testing & Refinement (2-3 hours)

```bash
# Test with dummy migrations
npm run deploy:dev

# Check logs
cat .deployments/deploy-dev-*/deployment.log

# Test rollback manually
npm run db:rollback deploy-dev-1728149445123

# Test schema comparison
npm run db:compare local dev
```

---

## File Structure

```
project-root/
├── scripts/
│   └── deploy/
│       ├── deploy.ts              # Main orchestrator (300-400 lines)
│       ├── logger.ts              # Logging system (200-250 lines)
│       ├── schema-compare.ts      # FDW comparison (250-300 lines)
│       ├── rollback.ts            # Rollback manager (150-200 lines)
│       └── alerts.ts              # Alert system (100-150 lines)
│
├── .deployments/                  # Git-ignored artifacts
│   └── deploy-{env}-{timestamp}/
│       ├── deployment.log         # Structured JSON log
│       ├── backup.dump            # Database backup
│       ├── clone.dump             # Target clone (for sandbox)
│       ├── rollback-state.json    # Rollback information
│       └── schema-comparison.json # Schema diff report
│
├── .env.local                     # Environment variables
│   ├── DEV_POSTGRES_URL           # Neon DEV connection
│   ├── UAT_POSTGRES_URL           # Neon UAT connection
│   ├── PROD_POSTGRES_URL          # Neon PROD connection (read-only)
│   ├── SLACK_WEBHOOK_URL          # Alert webhook
│   └── ALERT_EMAIL                # Alert email
│
└── package.json
    └── scripts:
        ├── "deploy:dev"           # Deploy to DEV
        ├── "deploy:uat"           # Deploy to UAT
        ├── "deploy:prod"          # Deploy to PROD
        ├── "db:compare"           # Compare schemas
        └── "db:rollback"          # Rollback deployment
```

---

## Configuration

### Environment Variables Required

```bash
# .env.local

# Target database URLs
DEV_POSTGRES_URL="postgresql://user:pass@ep-dev-xxx.neon.tech/db?sslmode=require"
UAT_POSTGRES_URL="postgresql://user:pass@ep-uat-xxx.neon.tech/db?sslmode=require"
PROD_POSTGRES_URL="postgresql://user:pass@ep-prod-xxx.neon.tech/db?sslmode=require"

# Target application URLs (for health checks)
DEV_URL="https://app-git-develop.vercel.app"
UAT_URL="https://app-git-uat.vercel.app"
PROD_URL="https://app.vercel.app"

# Alert configuration
SLACK_WEBHOOK_URL="https://hooks.slack.com/services/xxx/yyy/zzz"
ALERT_EMAIL="team@company.com"

# Optional: Email configuration
SMTP_HOST="smtp.resend.com"
SMTP_PORT="587"
SMTP_USER="resend"
SMTP_PASSWORD="re_xxx"
```

### package.json Scripts

```json
{
  "scripts": {
    "deploy:dev": "tsx scripts/deploy/deploy.ts dev",
    "deploy:uat": "tsx scripts/deploy/deploy.ts uat",
    "deploy:prod": "tsx scripts/deploy/deploy.ts prod",

    "db:compare": "tsx scripts/deploy/schema-compare.ts",
    "db:rollback": "tsx scripts/deploy/rollback.ts"
  }
}
```

---

## Database Schema Requirements

### Deployment Logs Table (Optional)

```sql
CREATE TABLE deployment_logs (
  id SERIAL PRIMARY KEY,
  deployment_id TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  phase TEXT NOT NULL,
  level TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB,
  duration INTEGER,
  stack_trace TEXT,

  INDEX idx_deployment_id (deployment_id),
  INDEX idx_timestamp (timestamp)
);
```

### PostgreSQL Extensions Required

```sql
-- Required for FDW
CREATE EXTENSION IF NOT EXISTS postgres_fdw;

-- Optional: For JSON queries
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

---

## Testing Strategy

### Unit Tests

```typescript
// tests/deploy/schema-compare.test.ts
describe('SchemaComparator', () => {
  it('should detect added tables', async () => {
    const comparator = new SchemaComparator(logger, db)
    const result = await comparator.compare('local', 'remote')

    expect(result.tablesOnlyInSource).toContain('product_components')
  })

  it('should detect breaking changes', () => {
    const breaking = comparator.detectBreakingChanges({
      tablesOnlyInTarget: ['users'], // Removed table
      columnDifferences: [],
    })

    expect(breaking).toHaveLength(1)
    expect(breaking[0]).toContain('Tables removed')
  })
})
```

### Integration Tests

```bash
# Test full deployment pipeline
npm run deploy:dev

# Verify deployment succeeded
curl https://app-git-develop.vercel.app/api/health

# Check deployment logs
cat .deployments/*/deployment.log | grep ERROR
```

### Manual Test Scenarios

1. **Happy Path**
   - Make schema change
   - Run `npm run deploy:dev`
   - Verify success

2. **Breaking Change**
   - Remove a column
   - Run deployment
   - Should abort with warning

3. **Migration Failure**
   - Create invalid SQL migration
   - Run deployment
   - Should rollback automatically

4. **Rollback Test**
   - Deploy successfully
   - Manually trigger rollback
   - Verify database + code restored

---

## Troubleshooting

### Common Issues

#### 1. FDW Connection Fails

**Symptom:**

```
ERROR: could not connect to server "dev_server"
```

**Solutions:**

```bash
# Check connection string
psql "$DEV_POSTGRES_URL" -c "SELECT 1"

# Check SSL mode
# Neon requires: sslmode=require

# Check firewall/network
# Ensure local → Neon connectivity

# Check user mapping
SELECT * FROM pg_user_mappings;
```

#### 2. Sandbox Creation Fails

**Symptom:**

```
ERROR: database "sandbox_xxx" already exists
```

**Solution:**

```bash
# Cleanup orphaned sandboxes
docker exec postgres-dev psql -U postgres -c "
  SELECT 'DROP DATABASE ' || datname || ';'
  FROM pg_database
  WHERE datname LIKE 'sandbox_%'
"
```

#### 3. pg_dump/pg_restore Slow

**Symptom:**

- Backup/restore takes >5 minutes

**Solutions:**

```bash
# Use custom format (faster)
pg_dump --format=custom --compress=9

# Use multiple jobs
pg_restore --jobs=4

# Skip indexes during restore (rebuild after)
pg_restore --no-index
```

#### 4. Rollback Fails

**Symptom:**

```
ERROR: Cannot restore, foreign key violations
```

**Solution:**

```bash
# Restore with --clean --if-exists
pg_restore --dbname="$DB_URL" --clean --if-exists backup.dump

# Or disable triggers temporarily
pg_restore --disable-triggers backup.dump
```

#### 5. Vercel Deployment Not Detected

**Symptom:**

- Code pushed but migration not applied

**Solution:**

```bash
# Check Vercel deployment status
vercel deployments list

# Manually trigger deployment
vercel deploy --env=preview

# Check Vercel logs
vercel logs
```

---

## Performance Considerations

### Optimization Tips

1. **Parallel Operations**

   ```typescript
   // Run independent checks in parallel
   await Promise.all([
     this.checkGitStatus(),
     this.checkEnvironmentVariables(),
     this.checkDockerRunning(),
   ])
   ```

2. **Incremental Backups**

   ```bash
   # Only backup changed tables (advanced)
   pg_dump --table=products --table=orders
   ```

3. **Connection Pooling**

   ```typescript
   // Reuse database connections
   private dbConnection: postgres.Sql | null = null

   getConnection() {
     if (!this.dbConnection) {
       this.dbConnection = postgres(url)
     }
     return this.dbConnection
   }
   ```

4. **Caching Schema Metadata**
   ```typescript
   // Cache schema info (valid for deployment duration)
   private schemaCache = new Map<string, SchemaInfo>()
   ```

---

## Next Steps

### Immediate (Week 1)

1. Implement core framework
2. Test with simple migration
3. Add logging and alerts

### Short-term (Month 1)

1. Add comprehensive tests
2. Document edge cases
3. Train team on usage

### Long-term (Quarter 1)

1. Add metrics/analytics
2. Build web dashboard (optional)
3. Integrate with CI/CD

---

## Resources

### Documentation

- PostgreSQL FDW: https://www.postgresql.org/docs/current/postgres-fdw.html
- Drizzle Migrations: https://orm.drizzle.team/docs/migrations
- Neon Branching: https://neon.tech/docs/guides/branching

### Tools

- pg_dump: https://www.postgresql.org/docs/current/app-pgdump.html
- pg_restore: https://www.postgresql.org/docs/current/app-pgrestore.html

### Related Projects

- Flyway: https://flywaydb.org/
- Atlas: https://atlasgo.io/
- Prisma Migrate: https://www.prisma.io/docs/concepts/components/prisma-migrate

---

**Document Version:** 1.0
**Last Updated:** 2025-10-05
**Author:** Development Team
**Status:** Ready for Implementation
