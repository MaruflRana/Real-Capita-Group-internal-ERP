export type DefenseTracePanelPosition = 'bottom' | 'left' | 'right';

export interface DefenseTracePreferences {
  panelPosition: DefenseTracePanelPosition;
  minimized: boolean;
  inspectorMode: boolean;
}

export const DEFENSE_TRACE_PREFERENCES_STORAGE_KEY =
  'real-capita:defense-trace:preferences';

export const DEFAULT_DEFENSE_TRACE_PREFERENCES: DefenseTracePreferences = {
  panelPosition: 'right',
  minimized: false,
  inspectorMode: true,
};

const isPanelPosition = (value: unknown): value is DefenseTracePanelPosition =>
  value === 'right' || value === 'left' || value === 'bottom';

export const readDefenseTracePreferences = (): DefenseTracePreferences => {
  if (typeof window === 'undefined') {
    return DEFAULT_DEFENSE_TRACE_PREFERENCES;
  }

  try {
    const rawValue = window.localStorage.getItem(
      DEFENSE_TRACE_PREFERENCES_STORAGE_KEY,
    );

    if (!rawValue) {
      return DEFAULT_DEFENSE_TRACE_PREFERENCES;
    }

    const parsedValue = JSON.parse(rawValue) as Partial<DefenseTracePreferences>;

    return {
      panelPosition: isPanelPosition(parsedValue.panelPosition)
        ? parsedValue.panelPosition
        : DEFAULT_DEFENSE_TRACE_PREFERENCES.panelPosition,
      minimized:
        typeof parsedValue.minimized === 'boolean'
          ? parsedValue.minimized
          : DEFAULT_DEFENSE_TRACE_PREFERENCES.minimized,
      inspectorMode:
        typeof parsedValue.inspectorMode === 'boolean'
          ? parsedValue.inspectorMode
          : DEFAULT_DEFENSE_TRACE_PREFERENCES.inspectorMode,
    };
  } catch {
    return DEFAULT_DEFENSE_TRACE_PREFERENCES;
  }
};

export const writeDefenseTracePreferences = (
  preferences: DefenseTracePreferences,
): void => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(
      DEFENSE_TRACE_PREFERENCES_STORAGE_KEY,
      JSON.stringify(preferences),
    );
  } catch {
    // Browser storage can be unavailable; runtime state still remains usable.
  }
};
