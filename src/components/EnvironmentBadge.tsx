/**
 * Environment Badge Component
 * Displays current environment (DEV/UAT/PROD) for testing multi-env setup
 */

export function EnvironmentBadge() {
  const env = process.env.NODE_ENV
  const isVercel = process.env.VERCEL === '1'
  const vercelEnv = process.env.VERCEL_ENV || 'unknown'

  // Determine environment label
  let envLabel = 'LOCAL'
  let bgColor = '#6b7280' // gray

  if (isVercel) {
    if (vercelEnv === 'production') {
      envLabel = 'PROD'
      bgColor = '#10b981' // green
    } else if (vercelEnv === 'preview') {
      // Check URL to determine if DEV or UAT
      const url = process.env.VERCEL_URL || ''
      if (url.includes('develop')) {
        envLabel = 'DEV'
        bgColor = '#3b82f6' // blue
      } else if (url.includes('uat')) {
        envLabel = 'UAT'
        bgColor = '#f59e0b' // orange
      } else {
        envLabel = 'PREVIEW'
        bgColor = '#8b5cf6' // purple
      }
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        padding: '8px 16px',
        backgroundColor: bgColor,
        color: 'white',
        borderRadius: '6px',
        fontSize: '14px',
        fontWeight: 'bold',
        zIndex: 9999,
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      }}
    >
      {envLabel}
    </div>
  )
}
