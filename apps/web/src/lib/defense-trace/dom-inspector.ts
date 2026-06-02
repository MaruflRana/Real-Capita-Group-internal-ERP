import type { DefenseTraceSelectedTarget } from './types';

const PANEL_SELECTOR = '[data-defense-trace-panel]';

const PREFERRED_INSPECTABLE_SELECTOR = [
  '[data-defense-trace]',
  'button',
  'a[href]',
  'label',
  'input',
  'select',
  'textarea',
  'th',
  '[role="button"]',
  '[role="columnheader"]',
  '[role="heading"]',
  '[role="link"]',
  '[role="menuitem"]',
  '[role="tab"]',
  '[aria-label]',
  '[placeholder]',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
].join(',');

const TEXT_INSPECTABLE_SELECTOR = [
  'p',
  'span',
  'strong',
  'em',
  'small',
  'dt',
  'dd',
  'td',
  'li',
  'div',
  'section',
  'article',
].join(',');

const normalizeText = (value: string, maxLength = 140): string => {
  const normalized = value
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[email]');

  return normalized.length > maxLength
    ? `${normalized.slice(0, maxLength - 1).trim()}...`
    : normalized;
};

const humanizeToken = (value: string): string =>
  normalizeText(
    value
      .replace(/[_-]+/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/\s+/g, ' '),
  );

const getDirectText = (element: Element): string =>
  Array.from(element.childNodes)
    .filter((node) => node.nodeType === 3)
    .map((node) => node.textContent ?? '')
    .join(' ');

const getFirstUsefulChildText = (element: Element): string => {
  const child = Array.from(
    element.querySelectorAll<HTMLElement>(
      'h1,h2,h3,h4,h5,h6,p,span,label,button,a,th,td',
    ),
  ).find((candidate) => candidate !== element && getDirectText(candidate));

  return child ? getElementText(child, 90) : '';
};

const getElementText = (element: Element, maxLength = 140): string => {
  if (
    element instanceof HTMLInputElement ||
    element instanceof HTMLSelectElement ||
    element instanceof HTMLTextAreaElement
  ) {
    return '';
  }

  const directText = normalizeText(getDirectText(element), maxLength);

  if (directText) {
    return directText;
  }

  const rawText =
    element instanceof HTMLElement ? element.innerText : element.textContent;
  const text = rawText ?? '';

  if (text.split(/\r?\n/).filter((line) => line.trim()).length > 1) {
    const childText = getFirstUsefulChildText(element);

    if (childText) {
      return childText;
    }
  }

  return normalizeText(text, maxLength);
};

const getAriaLabel = (element: Element): string =>
  normalizeText(element.getAttribute('aria-label') ?? '');

const getPlaceholder = (element: Element): string => {
  if (
    element instanceof HTMLInputElement ||
    element instanceof HTMLTextAreaElement
  ) {
    return normalizeText(element.placeholder);
  }

  return '';
};

const getControlLabel = (element: Element): string => {
  if (
    element instanceof HTMLInputElement ||
    element instanceof HTMLSelectElement ||
    element instanceof HTMLTextAreaElement
  ) {
    const labelText = Array.from(element.labels ?? [])
      .map((label) => getElementText(label))
      .find(Boolean);

    return (
      labelText ||
      getAriaLabel(element) ||
      getPlaceholder(element) ||
      humanizeToken(element.name || element.id)
    );
  }

  return '';
};

const getSafeHrefPath = (element: Element): string => {
  const link = element.closest<HTMLAnchorElement>('a[href]');

  if (!link) {
    return '';
  }

  try {
    const url = new URL(link.href, window.location.origin);

    if (url.origin === window.location.origin) {
      return url.pathname.replace(/\/+$/, '') || '/';
    }

    return url.hostname;
  } catch {
    return normalizeText(link.getAttribute('href') ?? '');
  }
};

const isVisible = (element: HTMLElement): boolean => {
  if (element.closest(PANEL_SELECTOR)) {
    return false;
  }

  const rect = element.getBoundingClientRect();
  const style = window.getComputedStyle(element);

  return (
    rect.width > 0 &&
    rect.height > 0 &&
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    Number(style.opacity) !== 0
  );
};

export const findDefenseTraceInspectableElement = (
  target: EventTarget | null,
): HTMLElement | null => {
  if (!(target instanceof Element)) {
    return null;
  }

  if (target.closest(PANEL_SELECTOR)) {
    return null;
  }

  const preferred = target.closest<HTMLElement>(
    PREFERRED_INSPECTABLE_SELECTOR,
  );
  const candidate =
    preferred ??
    target.closest<HTMLElement>(TEXT_INSPECTABLE_SELECTOR) ??
    (target instanceof HTMLElement ? target : null);

  if (
    !candidate ||
    candidate === document.body ||
    candidate === document.documentElement ||
    !isVisible(candidate)
  ) {
    return null;
  }

  return candidate;
};

const getNearestHeadingText = (element: Element): string => {
  const ownHeading = element.closest<HTMLElement>(
    'h1,h2,h3,h4,h5,h6,[role="heading"]',
  );

  if (ownHeading) {
    return getElementText(ownHeading);
  }

  const region = element.closest<HTMLElement>(
    'form,section,article,main,[role="region"],[aria-labelledby]',
  );
  const heading = region?.querySelector<HTMLElement>(
    'h1,h2,h3,h4,h5,h6,[role="heading"]',
  );

  return heading ? getElementText(heading) : '';
};

const getTextLines = (element: Element): string[] =>
  (element instanceof HTMLElement ? element.innerText : element.textContent ?? '')
    .split(/\r?\n/)
    .map((line) => normalizeText(line, 80))
    .filter(Boolean);

const isLikelyNumericValue = (value: string): boolean => {
  const normalized = value.replace(/\s+/g, '');

  return (
    /[৳$€£%]/.test(normalized) ||
    /^[+-]?\(?\d[\d,]*(?:\.\d+)?\)?$/.test(normalized)
  );
};

const findNearbyMetricLabel = (
  element: Element,
  clickedText: string,
): string => {
  let current = element.parentElement;
  let depth = 0;

  while (current && current !== document.body && depth < 6) {
    const lines = getTextLines(current);

    if (lines.length > 1) {
      const clickedIndex = lines.findIndex((line) => line === clickedText);
      const beforeClicked =
        clickedIndex > 0 ? lines.slice(0, clickedIndex).reverse() : lines;
      const label = beforeClicked.find(
        (line) =>
          line !== clickedText &&
          line.length <= 70 &&
          !isLikelyNumericValue(line),
      );

      if (label) {
        return label;
      }
    }

    current = current.parentElement;
    depth += 1;
  }

  return '';
};

const hasNearbyMetricValue = (
  element: Element,
  clickedText: string,
): boolean => {
  let current = element.parentElement;
  let depth = 0;

  while (current && current !== document.body && depth < 5) {
    const lines = getTextLines(current);

    if (
      lines.some((line) => line !== clickedText && isLikelyNumericValue(line))
    ) {
      return true;
    }

    current = current.parentElement;
    depth += 1;
  }

  return false;
};

const getSectionContext = (element: Element): string => {
  const form = element.closest('form');

  if (form) {
    return 'form';
  }

  const table = element.closest('table,[role="table"],[role="grid"]');

  if (table) {
    return 'table';
  }

  const navigation = element.closest('nav,aside,[role="navigation"]');

  if (navigation) {
    return 'navigation';
  }

  const section = element.closest('section,article,[role="region"]');

  if (section) {
    return getNearestHeadingText(section) || 'section';
  }

  return '';
};

const classifyTarget = ({
  clickedText,
  element,
  href,
}: {
  clickedText: string;
  element: HTMLElement;
  href: string;
}): {
  selectedKind: string;
  selectedLabel: string;
} => {
  const ariaLabel = getAriaLabel(element);
  const controlLabel = getControlLabel(element);
  const labelText = controlLabel || ariaLabel || clickedText;
  const tagName = element.tagName.toLowerCase();

  if (href && element.closest('nav,aside,[role="navigation"]')) {
    return {
      selectedKind: 'navigation item',
      selectedLabel: `${labelText || href} navigation`,
    };
  }

  if (
    tagName === 'button' ||
    element.getAttribute('role') === 'button' ||
    element.closest('button,[role="button"]')
  ) {
    return {
      selectedKind: 'button',
      selectedLabel: labelText || 'Button',
    };
  }

  if (
    element instanceof HTMLInputElement ||
    element instanceof HTMLSelectElement ||
    element instanceof HTMLTextAreaElement ||
    element.closest('label')
  ) {
    return {
      selectedKind: 'form field',
      selectedLabel: labelText || 'Form field',
    };
  }

  if (
    tagName === 'th' ||
    element.getAttribute('role') === 'columnheader' ||
    element.closest('th,[role="columnheader"]')
  ) {
    return {
      selectedKind: 'table heading',
      selectedLabel: labelText || 'Table heading',
    };
  }

  if (
    /^h[1-6]$/.test(tagName) ||
    element.getAttribute('role') === 'heading'
  ) {
    return {
      selectedKind: 'heading',
      selectedLabel: labelText || 'Heading',
    };
  }

  if (isLikelyNumericValue(clickedText)) {
    const metricLabel = findNearbyMetricLabel(element, clickedText);

    if (metricLabel) {
      return {
        selectedKind: 'KPI value',
        selectedLabel: `${metricLabel} amount`,
      };
    }
  }

  if (
    clickedText &&
    clickedText.length <= 70 &&
    !isLikelyNumericValue(clickedText) &&
    hasNearbyMetricValue(element, clickedText)
  ) {
    return {
      selectedKind: 'KPI label',
      selectedLabel: clickedText,
    };
  }

  if (href) {
    return {
      selectedKind: 'link',
      selectedLabel: labelText || href,
    };
  }

  if (element.closest('table,[role="table"],[role="grid"]')) {
    return {
      selectedKind: 'table cell',
      selectedLabel: labelText || 'Table cell',
    };
  }

  if (element.closest('section,article,[role="region"]')) {
    return {
      selectedKind: 'card or section',
      selectedLabel: labelText || getNearestHeadingText(element) || 'Section',
    };
  }

  return {
    selectedKind: tagName,
    selectedLabel: labelText || humanizeToken(tagName),
  };
};

export const createDefenseTraceAnchorTarget = ({
  clickedElement,
  currentRoute,
  traceElement,
}: {
  clickedElement: Element;
  currentRoute: string;
  traceElement: HTMLElement;
}): DefenseTraceSelectedTarget => {
  const clickedText = getElementText(clickedElement);
  const selectedLabel =
    normalizeText(traceElement.dataset.defenseTraceLabel ?? '') ||
    clickedText ||
    getAriaLabel(traceElement) ||
    'Trace anchor';

  return {
    selectedLabel,
    selectedKind:
      normalizeText(traceElement.dataset.defenseTraceKind ?? '') || 'trace anchor',
    selectedSource: 'anchor',
    currentRoute,
    clickedText,
    traceEntryId: normalizeText(traceElement.dataset.defenseTrace ?? ''),
    tagName: traceElement.tagName.toLowerCase(),
    ariaLabel: getAriaLabel(traceElement),
    href: getSafeHrefPath(traceElement),
    nearestHeading: getNearestHeadingText(traceElement),
    nearestSection: getSectionContext(traceElement),
    matchReason: 'anchor',
    hasExactTraceMatch: true,
  };
};

export const createDefenseTraceAutoTarget = ({
  currentRoute,
  element,
}: {
  currentRoute: string;
  element: HTMLElement;
}): DefenseTraceSelectedTarget => {
  const ariaLabel = getAriaLabel(element);
  const controlLabel = getControlLabel(element);
  const clickedText =
    controlLabel || ariaLabel || getPlaceholder(element) || getElementText(element);
  const href = getSafeHrefPath(element);
  const classified = classifyTarget({
    clickedText,
    element,
    href,
  });

  return {
    selectedLabel: classified.selectedLabel,
    selectedKind: classified.selectedKind,
    selectedSource: 'auto',
    currentRoute,
    clickedText,
    tagName: element.tagName.toLowerCase(),
    ariaLabel,
    href,
    nearestHeading: getNearestHeadingText(element),
    nearestSection: getSectionContext(element),
    hasExactTraceMatch: false,
  };
};
