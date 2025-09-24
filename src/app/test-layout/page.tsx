export default function TestLayoutPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'white',
        paddingTop: '20px', // Extra spacing for visibility
      }}
    >
      {/* Success indicator */}
      <div
        style={{
          backgroundColor: '#22c55e',
          padding: '20px',
          margin: '20px',
          borderRadius: '8px',
          textAlign: 'center',
          fontSize: '18px',
          fontWeight: 'bold',
          color: 'white',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        }}
      >
        ✅ CORRECT LAYOUT: Header above, content below with proper spacing
      </div>

      {/* Simulated product page breadcrumb */}
      <div
        style={{
          backgroundColor: '#f8fafc',
          padding: '16px 0',
          borderBottom: '1px solid #e2e8f0',
        }}
      >
        <div
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            padding: '0 16px',
          }}
        >
          <nav style={{ fontSize: '14px' }}>
            <span>
              <a href='/' style={{ color: '#0284c7', textDecoration: 'none' }}>
                Home
              </a>
              <span style={{ color: '#94a3b8', margin: '0 8px' }}>/</span>
              <a href='/products' style={{ color: '#0284c7', textDecoration: 'none' }}>
                Products
              </a>
              <span style={{ color: '#94a3b8', margin: '0 8px' }}>/</span>
              <span style={{ color: '#475569' }}>Two-Phase Cooling Case Pro</span>
            </span>
          </nav>
        </div>
      </div>

      {/* Simulated product page content */}
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '32px 16px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '48px',
        }}
      >
        {/* Left column - Product image placeholder */}
        <div>
          <div
            style={{
              aspectRatio: '4/3',
              backgroundColor: '#f1f5f9',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              color: '#64748b',
              border: '2px dashed #cbd5e1',
            }}
          >
            Product Image Gallery
          </div>
        </div>

        {/* Right column - Product info */}
        <div>
          <h1
            style={{
              fontSize: '36px',
              fontWeight: 'bold',
              color: '#0f172a',
              marginBottom: '8px',
              lineHeight: '1.1',
            }}
          >
            Two-Phase Cooling Case Pro
          </h1>
          <p
            style={{
              fontSize: '20px',
              color: '#475569',
              marginBottom: '24px',
              lineHeight: '1.5',
            }}
          >
            Revolutionary cooling technology for high-performance computing
          </p>

          <div
            style={{
              marginBottom: '24px',
              paddingBottom: '24px',
              borderBottom: '1px solid #e2e8f0',
            }}
          >
            <span
              style={{
                fontSize: '32px',
                fontWeight: 'bold',
                color: '#0284c7',
              }}
            >
              $1,299
            </span>
          </div>

          <div
            style={{
              padding: '16px',
              backgroundColor: '#f8fafc',
              borderRadius: '8px',
              marginBottom: '24px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '8px',
              }}
            >
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  backgroundColor: '#22c55e',
                }}
              ></div>
              <span
                style={{
                  fontWeight: '500',
                  color: '#0f172a',
                }}
              >
                In Stock (15 available)
              </span>
            </div>
          </div>

          <button
            style={{
              width: '100%',
              padding: '16px 24px',
              backgroundColor: '#0284c7',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: 'pointer',
            }}
          >
            View Details & Specifications
          </button>
        </div>
      </div>

      {/* Explanation */}
      <div
        style={{
          backgroundColor: '#fef3c7',
          padding: '20px',
          margin: '20px',
          borderRadius: '8px',
          borderLeft: '4px solid #f59e0b',
        }}
      >
        <h3 style={{ color: '#92400e', marginBottom: '12px' }}>
          This is how the product page should look:
        </h3>
        <ul style={{ color: '#78350f', paddingLeft: '20px' }}>
          <li>Header stays fixed at the top</li>
          <li>Breadcrumb appears below header with clear separation</li>
          <li>Product content flows naturally below</li>
          <li>No text overlapping with navigation</li>
        </ul>
      </div>
    </div>
  )
}
