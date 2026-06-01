'use client';

import { useState } from 'react';
import { Clipboard, ExternalLink } from 'lucide-react';

import type { DefenseTraceFileReference } from '../../lib/defense-trace/types';
import {
  resolveDefenseTraceFileTarget,
} from '../../lib/defense-trace/workspace-root';

const copyTextToClipboard = async (text: string): Promise<void> => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.setAttribute('readonly', 'true');
  textArea.style.position = 'fixed';
  textArea.style.left = '-9999px';
  document.body.append(textArea);
  textArea.select();
  document.execCommand('copy');
  textArea.remove();
};

const ActionButton = ({
  children,
  disabled = false,
  onClick,
  title,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
  title?: string;
}) => (
  <button
    className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-[11px] font-semibold text-foreground shadow-sm transition hover:border-brand-sky/60 hover:bg-brand-skySoft/60 disabled:cursor-not-allowed disabled:opacity-50"
    disabled={disabled}
    onClick={onClick}
    title={title}
    type="button"
  >
    {children}
  </button>
);

export const DefenseTraceCopyCommandButton = ({
  command,
  label = 'Copy command',
}: {
  command: string;
  label?: string;
}) => {
  const [status, setStatus] = useState<string | null>(null);

  const copyCommand = async () => {
    try {
      await copyTextToClipboard(command);
      setStatus('Copied');
      window.setTimeout(() => setStatus(null), 1800);
    } catch {
      setStatus('Copy unavailable');
      window.setTimeout(() => setStatus(null), 2200);
    }
  };

  return (
    <span className="inline-flex items-center gap-2">
      <ActionButton onClick={copyCommand}>
        <Clipboard className="h-3 w-3" />
        {label}
      </ActionButton>
      {status ? (
        <span className="text-[11px] font-semibold text-muted-foreground">
          {status}
        </span>
      ) : null}
    </span>
  );
};

export const DefenseTraceFileActions = ({
  file,
  workspaceRoot,
}: {
  file: DefenseTraceFileReference;
  workspaceRoot: string;
}) => {
  const [status, setStatus] = useState<string | null>(null);
  const resolvedTarget = resolveDefenseTraceFileTarget(file, workspaceRoot);
  const hasWorkspaceRoot = Boolean(resolvedTarget);

  const updateStatus = (message: string, timeout = 1800) => {
    setStatus(message);
    window.setTimeout(() => setStatus(null), timeout);
  };

  const copyValue = async (value: string, message = 'Copied') => {
    try {
      await copyTextToClipboard(value);
      updateStatus(message);
    } catch {
      updateStatus('Copy unavailable', 2200);
    }
  };

  const openInVscode = () => {
    if (!resolvedTarget) {
      updateStatus('Set workspace root first', 2200);
      return;
    }

    window.location.href = resolvedTarget.vscodeUri;
    updateStatus('Opening requested. Use copy command if blocked.', 3200);
  };

  return (
    <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-2">
      <div className="min-w-0">
        <code className="block break-all rounded bg-background/80 px-2 py-1 font-mono text-[11px] leading-relaxed text-foreground">
          {file.relativePath}
          {file.line ? `:${file.line}` : ''}
        </code>
        {file.symbolName ? (
          <p className="mt-1 text-[11px] text-muted-foreground">
            Symbol: <span className="font-semibold">{file.symbolName}</span>
          </p>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-1.5">
        <ActionButton
          onClick={() => copyValue(file.relativePath, 'Relative path copied')}
        >
          <Clipboard className="h-3 w-3" />
          Relative
        </ActionButton>
        <ActionButton
          disabled={!hasWorkspaceRoot}
          onClick={() => {
            if (resolvedTarget) {
              void copyValue(resolvedTarget.absolutePath, 'Absolute path copied');
            }
          }}
          title={
            hasWorkspaceRoot
              ? 'Copy absolute path'
              : 'Set workspace root first'
          }
        >
          <Clipboard className="h-3 w-3" />
          Absolute
        </ActionButton>
        <ActionButton
          disabled={!hasWorkspaceRoot}
          onClick={() => {
            if (resolvedTarget) {
              void copyValue(
                resolvedTarget.vscodeCliCommand,
                'VS Code command copied',
              );
            }
          }}
          title={
            hasWorkspaceRoot
              ? 'Copy VS Code CLI command'
              : 'Set workspace root first'
          }
        >
          <Clipboard className="h-3 w-3" />
          code -g
        </ActionButton>
        <ActionButton
          onClick={() => {
            const command =
              resolvedTarget?.ripgrepCommand ??
              `rg --files | rg "${file.relativePath}"`;
            void copyValue(command, 'Search command copied');
          }}
        >
          <Clipboard className="h-3 w-3" />
          rg
        </ActionButton>
        <ActionButton
          disabled={!hasWorkspaceRoot}
          onClick={openInVscode}
          title={
            hasWorkspaceRoot
              ? 'Open in VS Code'
              : 'Set workspace root first'
          }
        >
          <ExternalLink className="h-3 w-3" />
          Open
        </ActionButton>
      </div>
      {status ? (
        <p className="text-[11px] font-semibold text-brand-navy dark:text-brand-sky">
          {status}
        </p>
      ) : null}
    </div>
  );
};
