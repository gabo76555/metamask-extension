import { useReducer, useRef, useCallback, useEffect } from 'react';

const scrollReducer = (state, action) => {
  switch (action.type) {
    case 'START_PROGRAMMATIC_SCROLL':
      return { ...state, isProgrammaticScroll: true };
    case 'END_PROGRAMMATIC_SCROLL':
      return {
        isProgrammaticScroll: false,
        buttonsEnabled: true,
        showArrow: false,
      };
    case 'MANUAL_SCROLL':
      return state.isProgrammaticScroll
        ? state
        : {
            ...state,
            buttonsEnabled: action.isAtBottom,
            showArrow: !action.isAtBottom && action.isScrollable,
          };
    default:
      return state;
  }
};

/**
 * This hook accepts `isScrollable` from the `useScrollRequired` hook and manages state for a scroll arrow
 * and buttons that may exist within content that has `useScrollRequired`'s ref attached to it.
 * It returns scroll state and handlers for scroll events on that content.
 *
 * @param {boolean} requireScroll - Whether the content requires scrolling.
 * @param {boolean} isScrollable - Whether the content is scrollable.
 * @returns {object} The scroll state and the handlers for the scroll events.
 */
export const useScrollHandling = (requireScroll, isScrollable) => {
  const [scrollState, dispatch] = useReducer(scrollReducer, {
    isProgrammaticScroll: false,
    buttonsEnabled: false,
    showArrow: true,
  });

  const isProgrammaticScrollRef = useRef(false);

  useEffect(() => {
    // If the content doesn't require scrolling, we don't need to update the scroll state
    if (!requireScroll) {
      return;
    }

    if (isScrollable) {
      dispatch({
        type: 'MANUAL_SCROLL',
        isAtBottom: false,
        isScrollable: true,
      });
    } else {
      dispatch({
        type: 'MANUAL_SCROLL',
        isAtBottom: true,
        isScrollable: false,
      });
    }
  }, [isScrollable, requireScroll]);

  const handleScroll = useCallback(
    (e, onScroll) => {
      if (!requireScroll) {
        return;
      }

      const isActuallyAtBottom =
        Math.abs(
          e.target.scrollTop + e.target.clientHeight - e.target.scrollHeight,
        ) < 2;

      if (isProgrammaticScrollRef.current && isActuallyAtBottom) {
        isProgrammaticScrollRef.current = false;
        dispatch({ type: 'END_PROGRAMMATIC_SCROLL' });
      } else {
        dispatch({
          type: 'MANUAL_SCROLL',
          isAtBottom: isActuallyAtBottom,
          isScrollable,
        });
      }
      onScroll?.(e);
    },
    [requireScroll, isScrollable],
  );

  const handleScrollToBottom = useCallback((scrollToBottom) => {
    if (isProgrammaticScrollRef.current) {
      return;
    }
    isProgrammaticScrollRef.current = true;
    dispatch({ type: 'START_PROGRAMMATIC_SCROLL' });
    scrollToBottom();
  }, []);

  return {
    scrollState,
    handleScroll,
    handleScrollToBottom,
  };
};
