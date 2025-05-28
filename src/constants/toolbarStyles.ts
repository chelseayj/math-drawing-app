// 툴바 스타일 상수들
export const TOOLBAR_STYLES = {
  container: {
    position: 'fixed' as const,
    bottom: '30px',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '12px 16px',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    borderRadius: '20px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    zIndex: 1000
  },
  
  button: {
    base: {
      width: '40px',
      height: '40px',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.2s ease',
      fontSize: '18px'
    },
    
    selected: {
      backgroundColor: '#007bff',
      color: 'white',
      boxShadow: '0 2px 8px rgba(0, 123, 255, 0.3)'
    },
    
    default: {
      backgroundColor: 'transparent',
      color: '#6b7280'
    },
    
    danger: {
      backgroundColor: 'transparent',
      color: '#dc3545'
    },
    
    warning: {
      backgroundColor: 'transparent',
      color: '#ff6b6b'
    },
    
    hover: {
      default: {
        backgroundColor: '#f5f5f5',
        color: '#374151'
      },
      danger: {
        backgroundColor: '#fff5f5'
      },
      warning: {
        backgroundColor: '#fff5f5'
      }
    }
  },
  
  tooltip: {
    container: {
      position: 'absolute' as const,
      bottom: '120%',
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      color: 'white',
      padding: '6px 10px',
      borderRadius: '6px',
      fontSize: '12px',
      fontWeight: '500',
      whiteSpace: 'nowrap' as const,
      zIndex: 1000,
      pointerEvents: 'none' as const
    },
    
    shortcut: {
      marginLeft: '8px',
      opacity: 0.7,
      fontSize: '11px'
    },
    
    arrow: {
      position: 'absolute' as const,
      top: '100%',
      left: '50%',
      transform: 'translateX(-50%)',
      width: 0,
      height: 0,
      borderLeft: '4px solid transparent',
      borderRight: '4px solid transparent',
      borderTop: '4px solid rgba(0, 0, 0, 0.9)'
    }
  },
  
  divider: {
    width: '1px',
    height: '32px',
    backgroundColor: '#e5e7eb',
    margin: '0 8px'
  }
} as const; 