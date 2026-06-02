'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
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
  matchDefenseTraceSelectedTarget,
} from '../../lib/defense-trace/match-trace';
import {
  createDefenseTraceAnchorTarget,
  createDefenseTraceAutoTarget,
  findDefenseTraceInspectableElement,
} from '../../lib/defense-trace/dom-inspector';
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
  DefenseTraceQuestionAngle,
  DefenseTraceSelectedTarget,
  DefenseTraceSelectionSource,
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

const isEditableElement = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const tagName = target.tagName;

  if (
    tagName === 'INPUT' ||
    tagName === 'TEXTAREA' ||
    tagName === 'SELECT'
  ) {
    return true;
  }

  if (target.isContentEditable) {
    return true;
  }

  return false;
};

export const DefenseTraceProvider = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname() ?? '/';
  const [hasMounted, setHasMounted] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [panelVisible, setPanelVisible] = useState(true);
  const [minimized, setMinimized] = useState(
    DEFAULT_DEFENSE_TRACE_PREFERENCES.minimized,
  );
  const [inspectorMode, setInspectorMode] = useState(
    DEFAULT_DEFENSE_TRACE_PREFERENCES.inspectorMode,
  );
  const [panelPosition, setPanelPosition] = useState<DefenseTracePanelPosition>(
    DEFAULT_DEFENSE_TRACE_PREFERENCES.panelPosition,
  );
  const [workspaceRoot, setWorkspaceRoot] = useState('');
  const [selectedEntryId, setSelectedEntryId] = useState('');
  const [manualSelection, setManualSelection] = useState(false);
  const [selectionSource, setSelectionSource] =
    useState<DefenseTraceSelectionSource>('route');
  const [selectedTarget, setSelectedTarget] =
    useState<DefenseTraceSelectedTarget | null>(null);
  const [clickedLabel, setClickedLabel] = useState<string>('');
  const [clickedKind, setClickedKind] = useState<string>('');
  const [questionAngle, setQuestionAngle] = useState<DefenseTraceQuestionAngle>('ui-frontend');
  const [apiActivities, setApiActivities] = useState<
    readonly DefenseTraceApiActivity[]
  >([]);
  const routeMatch = useMemo(() => matchDefenseTraceEntry(pathname), [pathname]);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const hoveredElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setHasMounted(true);

    const searchParams = new URLSearchParams(window.location.search);
    const traceParam = searchParams.get('trace');

    if (traceParam === '1') {
      setEnabled(true);
      setPanelVisible(true);
      writeTraceEnabled(true);
    } else if (traceParam === '0' || traceParam === 'off') {
      setEnabled(false);
      setPanelVisible(false);
      writeTraceEnabled(false);
    } else {
      const shouldEnable = readTraceEnabled();
      setEnabled(shouldEnable);
    }

    if (enabled || readTraceEnabled()) {
      setApiActivities(readDefenseTraceBufferedApiActivities());
    }

    const settings = readDefenseTraceWorkspaceSettings();
    setWorkspaceRoot(settings?.workspaceRoot ?? '');

    const preferences = readDefenseTracePreferences();
    setMinimized(preferences.minimized);
    setInspectorMode(preferences.inspectorMode);
    setPanelPosition(preferences.panelPosition);
  }, []);

  useEffect(() => {
    if (!manualSelection) {
      setSelectedEntryId(routeMatch?.entry.id ?? '');
      setSelectionSource('route');
    }
  }, [manualSelection, routeMatch?.entry.id]);

  const persistPreferences = useCallback(
    ({
      nextMinimized = minimized,
      nextPanelPosition = panelPosition,
      nextInspectorMode = inspectorMode,
    }: {
      nextMinimized?: boolean;
      nextPanelPosition?: DefenseTracePanelPosition;
      nextInspectorMode?: boolean;
    }) => {
      writeDefenseTracePreferences({
        minimized: nextMinimized,
        panelPosition: nextPanelPosition,
        inspectorMode: nextInspectorMode,
      });
    },
    [minimized, panelPosition, inspectorMode],
  );

  const toggleEnabled = useCallback(() => {
    setEnabled((currentEnabled) => {
      const nextEnabled = !currentEnabled;
      writeTraceEnabled(nextEnabled);
      if (nextEnabled) {
        setPanelVisible(true);
      } else {
        setPanelVisible(false);
        setMinimized(false);
      }
      return nextEnabled;
    });
    setMinimized(false);
    persistPreferences({ nextMinimized: false });
  }, [persistPreferences]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isCtrlAltT =
        event.ctrlKey && event.altKey && event.key.toLowerCase() === 't';

      const isAltBackquote =
        event.altKey && !event.ctrlKey && !event.shiftKey && event.key === '`';

      if (!isCtrlAltT && !isAltBackquote) {
        return;
      }

      if (isEditableElement(event.target)) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      toggleEnabled();
    };

    window.addEventListener('keydown', handleKeyDown, true);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [toggleEnabled]);

  const closeOverlay = useCallback(() => {
    setPanelVisible(false);
    setMinimized(false);
    setEnabled(false);
    writeTraceEnabled(false);
    persistPreferences({ nextMinimized: false });
  }, [persistPreferences]);

  const closePanelKeepEnabled = useCallback(() => {
    setPanelVisible(false);
    setMinimized(false);
    persistPreferences({ nextMinimized: false });
  }, [persistPreferences]);

  const openPanel = useCallback(() => {
    setPanelVisible(true);
    setMinimized(false);
    persistPreferences({ nextMinimized: false });
  }, [persistPreferences]);

  const updateMinimized = useCallback(
    (nextMinimized: boolean) => {
      setMinimized(nextMinimized);
      persistPreferences({ nextMinimized });
    },
    [persistPreferences],
  );

  const updateInspectorMode = useCallback(
    (nextInspectorMode: boolean) => {
      setInspectorMode(nextInspectorMode);
      persistPreferences({ nextInspectorMode });
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

  const selectTraceEntry = useCallback((entryId: string, source: DefenseTraceSelectionSource = 'anchor', label?: string, kind?: string) => {
    setSelectedEntryId(entryId);
    setManualSelection(Boolean(entryId));
    setSelectionSource(source);
    setSelectedTarget(null);
    setClickedLabel(label ?? '');
    setClickedKind(kind ?? '');
    setQuestionAngle('ui-frontend');
    setMinimized(false);
    setPanelVisible(true);
    persistPreferences({ nextMinimized: false });
  }, [persistPreferences]);

  const selectCurrentRouteTrace = useCallback(() => {
    setManualSelection(false);
    setSelectedEntryId(routeMatch?.entry.id ?? '');
    setSelectionSource('route');
    setSelectedTarget(null);
    setClickedLabel('');
    setClickedKind('');
    setQuestionAngle('ui-frontend');
  }, [routeMatch?.entry.id]);

  const clearApiActivities = useCallback(() => {
    clearDefenseTraceBufferedApiActivities();
    setApiActivities([]);
  }, []);

  const selectTraceTarget = useCallback(
    (target: DefenseTraceSelectedTarget) => {
      const match = matchDefenseTraceSelectedTarget(target);
      const nextTarget: DefenseTraceSelectedTarget = {
        ...target,
        ...(match ? { traceEntryId: match.entry.id } : {}),
        ...(match ? { matchReason: match.reason } : {}),
        hasExactTraceMatch: match?.exact ?? false,
      };

      setSelectedEntryId(match?.entry.id ?? '');
      setManualSelection(true);
      setSelectionSource(nextTarget.selectedSource);
      setSelectedTarget(nextTarget);
      setClickedLabel(nextTarget.selectedLabel);
      setClickedKind(nextTarget.selectedKind);
      setQuestionAngle('ui-frontend');
      setMinimized(false);
      setPanelVisible(true);
      persistPreferences({ nextMinimized: false });
    },
    [persistPreferences],
  );

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

      if (target.closest('[data-defense-trace-panel]')) {
        return;
      }

      const inspectableElement = findDefenseTraceInspectableElement(target);

      if (!inspectableElement) {
        return;
      }

      const traceElement = target.closest<HTMLElement>('[data-defense-trace]');
      const traceEntryId = traceElement?.dataset.defenseTrace;
      const hasValidTraceEntry = Boolean(
        traceEntryId &&
          defenseTraceRegistry.some((entry) => entry.id === traceEntryId),
      );

      if (!hasValidTraceEntry && !inspectorMode) {
        return;
      }

      if (inspectorMode) {
        event.preventDefault();
        event.stopPropagation();
      }

      if (traceElement && hasValidTraceEntry) {
        selectTraceTarget(
          createDefenseTraceAnchorTarget({
            clickedElement: target,
            currentRoute: pathname,
            traceElement,
          }),
        );
        return;
      }

      selectTraceTarget(
        createDefenseTraceAutoTarget({
          currentRoute: pathname,
          element: inspectableElement,
        }),
      );
    };

    document.addEventListener('click', handleTraceAnchorClick, true);

    return () => {
      document.removeEventListener('click', handleTraceAnchorClick, true);
    };
  }, [enabled, inspectorMode, pathname, selectTraceTarget]);

  useEffect(() => {
    if (!enabled || !inspectorMode) {
      const existing = tooltipRef.current;

      if (existing && existing.parentNode) {
        existing.parentNode.removeChild(existing);
      }

      if (hoveredElementRef.current) {
        hoveredElementRef.current.classList.remove(
          'defense-trace-inspectable-hover',
        );
        hoveredElementRef.current = null;
      }

      return;
    }

    const handleMouseMove = (event: MouseEvent) => {
      const target = event.target;

      if (!(target instanceof Element)) {
        return;
      }

      const traceElement = findDefenseTraceInspectableElement(target);
      const existing = tooltipRef.current;

      if (!traceElement) {
        if (existing && existing.parentNode) {
          existing.parentNode.removeChild(existing);
          tooltipRef.current = null;
        }

        if (hoveredElementRef.current) {
          hoveredElementRef.current.classList.remove(
            'defense-trace-inspectable-hover',
          );
          hoveredElementRef.current = null;
        }

        return;
      }

      if (hoveredElementRef.current !== traceElement) {
        hoveredElementRef.current?.classList.remove(
          'defense-trace-inspectable-hover',
        );
        traceElement.classList.add('defense-trace-inspectable-hover');
        hoveredElementRef.current = traceElement;
      }

      if (!tooltipRef.current) {
        tooltipRef.current = document.createElement('div');
        tooltipRef.current.setAttribute('role', 'tooltip');
        tooltipRef.current.style.cssText =
          'position:fixed;z-index:91;padding:4px 10px;font-size:11px;font-weight:600;' +
          'background:hsl(var(--brand-navy));color:#fff;border-radius:6px;' +
          'pointer-events:none;white-space:nowrap;font-family:system-ui,sans-serif;' +
          'box-shadow:0 2px 8px rgba(0,0,0,0.18);';
        document.body.appendChild(tooltipRef.current);
      }

      tooltipRef.current.textContent = 'Click to trace code';

      const offset = 12;
      const tooltipWidth = tooltipRef.current.offsetWidth;
      const viewportWidth = window.innerWidth;

      let left = event.clientX + offset;

      if (left + tooltipWidth > viewportWidth - 8) {
        left = event.clientX - tooltipWidth - offset;
      }

      tooltipRef.current.style.left = `${left}px`;
      tooltipRef.current.style.top = `${event.clientY - 28}px`;
    };

    const handleMouseLeave = () => {
      const existing = tooltipRef.current;

      if (existing && existing.parentNode) {
        existing.parentNode.removeChild(existing);
        tooltipRef.current = null;
      }

      if (hoveredElementRef.current) {
        hoveredElementRef.current.classList.remove(
          'defense-trace-inspectable-hover',
        );
        hoveredElementRef.current = null;
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);

      const existing = tooltipRef.current;

      if (existing && existing.parentNode) {
        existing.parentNode.removeChild(existing);
        tooltipRef.current = null;
      }

      if (hoveredElementRef.current) {
        hoveredElementRef.current.classList.remove(
          'defense-trace-inspectable-hover',
        );
        hoveredElementRef.current = null;
      }
    };
  }, [enabled, inspectorMode]);

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
      (manualSelection ? null : routeMatch?.entry) ??
      null,
    [manualSelection, routeMatch?.entry, selectedEntryId],
  );

  const showPanel = hasMounted && enabled && panelVisible;
  const showLauncher =
    hasMounted && enabled && !panelVisible;
  const showInspectorStyles =
    hasMounted && enabled && inspectorMode;

  return (
    <>
      {children}
      {showPanel ? (
        <DefenseTracePanel
          currentPathname={pathname}
          apiActivities={apiActivities}
          clickedLabel={clickedLabel}
          clickedKind={clickedKind}
          questionAngle={questionAngle}
          onQuestionAngleChange={setQuestionAngle}
          entries={defenseTraceRegistry}
          isManualSelection={manualSelection}
          minimized={minimized}
          inspectorMode={inspectorMode}
          onClose={closeOverlay}
          onClosePanelKeepEnabled={closePanelKeepEnabled}
          onCurrentRouteSelect={selectCurrentRouteTrace}
          onApiActivitiesClear={clearApiActivities}
          onInspectorModeChange={updateInspectorMode}
          onMinimizedChange={updateMinimized}
          onPanelPositionChange={updatePanelPosition}
          onSelectedEntryIdChange={(entryId) => selectTraceEntry(entryId, 'search')}
          onWorkspaceRootChange={updateWorkspaceRoot}
          panelPosition={panelPosition}
          routeMatch={routeMatch}
          selectedEntry={selectedEntry}
          selectedEntryId={selectedEntryId}
          selectedTarget={selectedTarget}
          selectionSource={selectionSource}
          workspaceRoot={workspaceRoot}
        />
      ) : null}
      {showLauncher ? (
        <button
          className="fixed bottom-4 right-4 z-[89] flex items-center gap-2 rounded-lg border border-brand-sky/40 bg-card px-3 py-2 text-xs font-semibold text-foreground shadow-lg shadow-black/15 transition hover:border-brand-sky/70 hover:bg-brand-skySoft/40"
          data-defense-trace-panel="true"
          onClick={openPanel}
          title="Open Defense Trace"
          type="button"
        >
          <span className="inline-flex items-center justify-center rounded-md bg-brand-green px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
            Trace
          </span>
          <span className="text-muted-foreground">Trace mode enabled</span>
        </button>
      ) : null}
      {showInspectorStyles ? (
        <style>
          {`
            [data-defense-trace] {
              outline: 1px solid hsl(var(--brand-sky) / 0.35);
              outline-offset: 3px;
              cursor: pointer;
              transition: outline-color 0.15s ease;
            }

            .defense-trace-inspectable-hover {
              outline-color: hsl(var(--brand-green) / 0.8);
              outline-style: solid;
              outline-width: 2px;
              outline-offset: 3px;
              cursor: crosshair;
            }
          `}
        </style>
      ) : null}
      {hasMounted && enabled && !inspectorMode ? (
        <style>
          {`
            [data-defense-trace] {
              outline: 1px solid hsl(var(--brand-sky) / 0.25);
              outline-offset: 2px;
            }
          `}
        </style>
      ) : null}
    </>
  );
};
