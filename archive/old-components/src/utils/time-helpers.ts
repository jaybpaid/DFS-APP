// Using native Date APIs for immediate TODAY+FUTURE functionality
// TODO: Replace with luxon for proper timezone handling in production

/**
 * Get current time (simplified for immediate use)
 */
export const nowChi = (): Date => {
  return new Date();
};

/**
 * Check if a slate is in the past (before today)
 */
export const isPastSlate = (
  slate: { start_time: string } | { firstGameStartISO: string }
): boolean => {
  try {
    const startTime =
      'start_time' in slate ? slate.start_time : slate.firstGameStartISO;
    const slateDate = new Date(startTime);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return slateDate < today;
  } catch (error) {
    console.warn('Error parsing slate time:', error);
    return false;
  }
};

/**
 * Check if a slate is today
 */
export const isTodaySlate = (
  slate: { start_time: string } | { firstGameStartISO: string }
): boolean => {
  try {
    const startTime =
      'start_time' in slate ? slate.start_time : slate.firstGameStartISO;
    const slateDate = new Date(startTime);
    const today = new Date();

    return slateDate.toDateString() === today.toDateString();
  } catch (error) {
    console.warn('Error parsing slate time:', error);
    return false;
  }
};

/**
 * Check if a slate is in the future (after today)
 */
export const isFutureSlate = (
  slate: { start_time: string } | { firstGameStartISO: string }
): boolean => {
  try {
    const startTime =
      'start_time' in slate ? slate.start_time : slate.firstGameStartISO;
    const slateDate = new Date(startTime);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    return slateDate >= tomorrow;
  } catch (error) {
    console.warn('Error parsing slate time:', error);
    return false;
  }
};

/**
 * Check if a slate is currently live
 */
export const isSloteLive = (
  slate: { start_time: string } | { firstGameStartISO: string }
): boolean => {
  try {
    const startTime =
      'start_time' in slate ? slate.start_time : slate.firstGameStartISO;
    const slateDate = new Date(startTime);
    const now = new Date();

    // Live if started but not complete (simplified)
    return now >= slateDate;
  } catch (error) {
    console.warn('Error parsing slate time:', error);
    return false;
  }
};

/**
 * Check if a slate is locked (past lock time)
 */
export const isSlateLocked = (
  slate: { start_time: string } | { firstGameStartISO: string }
): boolean => {
  try {
    const startTime =
      'start_time' in slate ? slate.start_time : slate.firstGameStartISO;
    const slateDate = new Date(startTime);
    const now = new Date();

    // Locked if past start time (lock time = first game start)
    return now >= slateDate;
  } catch (error) {
    console.warn('Error parsing slate time:', error);
    return false;
  }
};

/**
 * Get slate status badge
 */
export const getSlateStatus = (
  slate: { start_time: string } | { firstGameStartISO: string }
): 'UPCOMING' | 'LIVE' | 'LOCKED' | 'COMPLETE' => {
  if (isPastSlate(slate)) {
    return 'COMPLETE';
  } else if (isSlateLocked(slate)) {
    return 'LOCKED';
  } else if (isSloteLive(slate)) {
    return 'LIVE';
  } else {
    return 'UPCOMING';
  }
};

/**
 * Format date for display
 */
export const formatSlateDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch (error) {
    console.warn('Error formatting date:', error);
    return dateString;
  }
};

/**
 * Get today's date in YYYY-MM-DD format
 */
export const getTodayISO = (): string => {
  const today = new Date();
  return today.toISOString().split('T')[0] || '';
};

/**
 * Check if a date string is in the past
 */
export const isPastDate = (dateString: string): boolean => {
  try {
    const inputDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return inputDate < today;
  } catch (error) {
    return false;
  }
};

/**
 * Validate and correct date input - snap past dates to today
 */
export const validateDate = (
  inputDate: string
): { isValid: boolean; correctedDate: string; error?: string } => {
  try {
    const date = new Date(inputDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (date < today) {
      return {
        isValid: false,
        correctedDate: getTodayISO(),
        error: 'Past slates are hidden. Showing **Today** instead.',
      };
    }

    return {
      isValid: true,
      correctedDate: inputDate,
    };
  } catch (error) {
    return {
      isValid: false,
      correctedDate: getTodayISO(),
      error: 'Invalid date format. Showing **Today** instead.',
    };
  }
};
