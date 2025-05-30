import { useEffect, useCallback } from 'react';

interface UseKeyboardEventsProps {
  onEscapePressed: () => void;
}

export const useKeyboardEvents = ({ onEscapePressed }: UseKeyboardEventsProps) => {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onEscapePressed();
    }
  }, [onEscapePressed]);

  useEffect(() => {
    // 키보드 이벤트 리스너 등록
    document.addEventListener('keydown', handleKeyDown);

    // 컴포넌트 언마운트 시 리스너 제거
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return {
    // 필요시 추가 기능을 여기에 반환할 수 있음
  };
}; 