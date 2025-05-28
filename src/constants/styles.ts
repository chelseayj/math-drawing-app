// 토스트 스타일
export const TOAST_STYLES = {
  container: {
    position: 'fixed' as const,
    top: '30px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    color: 'white',
    padding: '12px 20px',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: '500',
    pointerEvents: 'none' as const,
    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
    backdropFilter: 'blur(10px)',
    zIndex: 1000,
    textAlign: 'center' as const
  }
} as const;

// 캔버스 스타일
export const CANVAS_STYLES = {
  container: {
    width: '100vw',
    height: '100vh',
    overflow: 'hidden' as const
  }
} as const; 