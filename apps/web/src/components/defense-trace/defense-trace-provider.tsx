'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { usePathname } from 'next/navigation';

import {
  clearDefenseTraceBufferedApiActivities,
  DEFENSE_TRACE_API_ACTIVITY_EVENT,
  limitDefenseTraceApiActivities,
  readDefenseTraceBufferedApiActivities,
} from '../../lib/defense-trace/api-trace';
import {
  matchDefenseTraceEntry,
} from '../../lib/defense-trace/match-trace';
import {
  DEFAULT_DEFENSE_TRACE_PREFERENCES,
  readDefenseTracePreferences,
  writeDefenseTracePreferences,
  type DefenseTracePanelPosition,
} from '../../lib/defense-trace/preferences';
import { defenseTraceRegistry } from '../../lib/defense-trace/trace-registry';
import type {
  DefenseTraceApiActivity,
  DefenseTraceEntry,
} from '../../lib/defense-trace/types';
import {
  DEFENSE_TRACE_ENABLED_STORAGE_KEY,
  normalizeWorkspaceRoot,
  readDefenseTraceWorkspaceSettings,
  writeDefenseTraceWorkspaceSettings,
} from '../../lib/defense-trace/workspace-root';
import { DefenseTracePanel } from './defense-trace-panel';

const readTraceEnabled = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    return (
      window.localStorage.getItem(DEFENSE_TRACE_ENABLED_STORAGE_KEY) === 'true'
    );
  } catch {
    return false;
  }
};

const writeTraceEnabled = (enabled: boolean): void => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(
      DEFENSE_TRACE_ENABLED_STORAGE_KEY,
      String(enabled),
    );
  } catch {
    // Storage can be blocked by browser settings; the overlay still works in memory.
  }
};

export const DefenseTraceProvider = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname() ?? '/';
  const [hasMounted, setHasMounted] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [minimized, setMinimized] = useState(
    DEFAULT_DEFENSE_TRACE_PREFERENCES.minimized,
  );
  const [panelPosition, setPanelPosition] = useState<DefenseTracePanelPosition>(
    DEFAULT_DEFENSE_TRACE_PREFERENCES.panelPosition,
  );
  const [workspaceRoot, setWorkspaceRoot] = useState('');
  const [selectedEntryId, setSelectedEntryId] = useState('');
  const [manualSelection, setManualSelection] = useState(false);
  const [apiActivities, setApiActivities] = useState<
    readonly DefenseTraceApiActivity[]
  >([]);
  const routeMatch = useMemo(() => matchDefenseTraceEntry(pathname), [pathname]);

  useEffect(() => {
    setHasMounted(true);

    const searchParams = new URLSearchParams(window.location.search);
    const shouldEnableFromUrl = searchParams.get('trace') === '1';
    const shouldEnable = shouldEnableFromUrl || readTraceEnabled();

    setEnabled(shouldEnable);

    if (shouldEnableFromUrl) {
      writeTraceEnabled(true);
    }

    if (shouldEnable) {
      setApiActivities(readDefenseTraceBufferedApiActivities());
    }

    const settings = readDefenseTraceWorkspaceSettings();
    setWorkspaceRoot(settings?.workspaceRoot ?? '');

    const preferences = readDefenseTracePreferences();
    setMinimized(preferences.minimized);
    setPanelPosition(preferences.panelPosition);
  }, []);

  useEffect(() => {
    if (!manualSelection) {
      setSelectedEntryId(routeMatch?.entry.id ?? '');
    }
  }, [manualSelection, routeMatch?.entry.id]);

  const persistPreferences = useCallback(
    ({
      nextMinimized = minimized,
      nextPanelPosition = panelPosition,
    }: {
      nextMinimized?: boolean;
      nextPanelPosition?: DefenseTracePanelPosition;
    }) => {
      writeDefenseTracePreferences({
        minimized: nextMinimized,
        panelPosition: nextPanelPosition,
      });
    },
    [minimized, panelPosition],
  );

  const toggleEnabled = useCallback(() => {
    setEnabled((currentEnabled) => {
      const nextEnabled = !currentEnabled;
      writeTraceEnabled(nextEnabled);
      return nextEnabled;
    });
    setMinimized(false);
    persistPreferences({ nextMinimized: false });
  }, [persistPreferences]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.ctrlKey &&
        event.shiftKey &&
        event.key.toLowerCase() === 'd'
      ) {
        event.preventDefault();
        toggleEnabled();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [toggleEnabled]);

  const closeOverlay = useCallback(() => {
    setEnabled(false);
    setMinimized(false);
    writeTraceEnabled(false);
    persistPreferences({ nextMinimized: false });
  }, [persistPreferences]);

  const updateMinimized = useCallback(
    (nextMinimized: boolean) => {
      setMinimized(nextMinimized);
      persistPreferences({ nextMinimized });
    },
    [persistPreferences],
  );

  const updatePanelPosition = useCallback(
    (nextPanelPosition: DefenseTracePanelPosition) => {
      setPanelPosition(nextPanelPosition);
      persistPreferences({ nextPanelPosition });
    },
    [persistPreferences],
  );

  const updateWorkspaceRoot = useCallback((value: string) => {
    const normalizedRoot = normalizeWorkspaceRoot(value);
    setWorkspaceRoot(value);
    writeDefenseTraceWorkspaceSettings(normalizedRoot);
  }, []);

  const selectTraceEntry = useCallback((entryId: string) => {
    setSelectedEntryId(entryId);
    setManualSelection(Boolean(entryId));
    setMinimized(false);
    persistPreferences({ nextMinimized: false });
  }, [persistPreferences]);

  const selectCurrentRouteTrace = useCallback(() => {
    setManualSelection(false);
    setSelectedEntryId(routeMatch?.entry.id ?? '');
  }, [routeMatch?.entry.id]);

  const clearApiActivities = useCallback(() => {
    clearDefenseTraceBufferedApiActivities();
    setApiActivities([]);
  }, []);

  useEffect(() => {
    if (!enabled) {
      clearDefenseTraceBufferedApiActivities();
      setApiActivities([]);
      return;
    }

    const handleTraceAnchorClick = (event: MouseEvent) => {
      const target = event.target;

      if (!(target instanceof Element)) {
        return;
      }

      const traceElement = target.closest<HTMLElement>('[data-defense-trace]');
      const traceEntryId = traceElement?.dataset.defenseTrace;

      if (
        !traceEntryId ||
        !defenseTraceRegistry.some((entry) => entry.id === traceEntryId)
      ) {
        return;
      }

      setSelectedEntryId(traceEntryId);
      setManualSelection(true);
      setMinimized(false);
      persistPreferences({ nextMinimized: false });
    };

    document.addEventListener('click', handleTraceAnchorClick, true);

    return () => {
      document.removeEventListener('click', handleTraceAnchorClick, true);
    };
  }, [enabled, persistPreferences]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    setApiActivities(readDefenseTraceBufferedApiActivities());

    const handleApiActivity = (event: Event) => {
      const apiActivityEvent = event as CustomEvent<DefenseTraceApiActivity>;
      const activity = apiActivityEvent.detail;

      if (!activity) {
        return;
      }

      setApiActivities((currentActivities) =>
        limitDefenseTraceApiActivities([activity, ...currentActivities]),
      );
    };

    window.addEventListener(
      DEFENSE_TRACE_API_ACTIVITY_EVENT,
      handleApiActivity,
    );

    return () => {
      window.removeEventListener(
        DEFENSE_TRACE_API_ACTIVITY_EVENT,
        handleApiActivity,
      );
    };
  }, [enabled]);

  const selectedEntry = useMemo<DefenseTraceEntry | null>(
    () =>
      defenseTraceRegistry.find((entry) => entry.id === selectedEntryId) ??
      routeMatch?.entry ??
      null,
    [routeMatch?.entry, selectedEntryId],
  );

  return (
    <>
      {children}
      {hasMounted && enabled ? (
        <DefenseTracePanel
          currentPathname={pathname}
          apiActivities={apiActivities}
          entries={defenseTraceRegistry}
          isManualSelection={manualSelection}
          minimized={minimized}
          onClose={closeOverlay}
          onCurrentRouteSelect={selectCurrentRouteTrace}
          onApiActivitiesClear={clearApiActivities}
          onMinimizedChange={updateMinimized}
          onPanelPositionChange={updatePanelPosition}
          onSelectedEntryIdChange={selectTraceEntry}
          onWorkspaceRootChange={updateWorkspaceRoot}
          panelPosition={panelPosition}
          routeMatch={routeMatch}
          selectedEntry={selectedEntry}
          selectedEntryId={selectedEntryId}
          workspaceRoot={workspaceRoot}
        />
      ) : null}
      {hasMounted && enabled ? (
        <style>
          {`
            [data-defense-trace] {
              outline: 1px solid hsl(var(--brand-sky) / 0.45);
              outline-offset: 3px;
            }

            [data-defense-trace]:hover {
              outline-color: hsl(var(--brand-green) / 0.75);
            }
          `}
        </style>
      ) : null}
    </>
  );
};
