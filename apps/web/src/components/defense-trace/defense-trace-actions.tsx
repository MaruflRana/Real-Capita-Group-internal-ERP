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
  variant = 'default',
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
  title?: string;
  variant?: 'default' | 'primary';
}) => (
  <button
    className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-semibold shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${
      variant === 'primary'
        ? 'border-brand-green/50 bg-brand-green text-white hover:bg-brand-green/90'
        : 'border-border bg-background text-foreground hover:border-brand-sky/60 hover:bg-brand-skySoft/60'
    }`}
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

export const DefenseTraceWorkspaceSetupCard = ({
  onWorkspaceRootChange,
  workspaceRoot,
}: {
  onWorkspaceRootChange: (value: string) => void;
  workspaceRoot: string;
}) => (
  <section className="rounded-xl border border-brand-sky/30 bg-brand-skySoft/50 p-4 space-y-3">
    <p className="text-sm font-semibold text-foreground">
      Set project root first.
    </p>
    <p className="text-xs leading-relaxed text-muted-foreground">
      In VS Code terminal, run:
    </p>
    <code className="block rounded bg-background/80 px-3 py-2 font-mono text-[11px] text-foreground">
      (Get-Location).Path
    </code>
    <p className="text-xs leading-relaxed text-muted-foreground">
      Or copy the helper command that sets clipboard automatically:
    </p>
    <DefenseTraceCopyCommandButton
      command="(Get-Location).Path | Set-Clipboard"
      label="Copy helper command"
    />
    <p className="text-xs leading-relaxed text-muted-foreground">
      Then paste the result below.
    </p>
    <input
      className="w-full rounded-lg border border-input bg-background px-3 py-2 font-mono text-xs text-foreground shadow-sm outline-none transition placeholder:text-muted-foreground focus:border-brand-sky focus:ring-2 focus:ring-brand-sky/25"
      onChange={(event) => onWorkspaceRootChange(event.target.value)}
      placeholder="e.g. C:/Users/wadud/Documents/New project"
      type="text"
      value={workspaceRoot}
    />
  </section>
);

export const DefenseTraceOpenFirstFile = ({
  file,
  workspaceRoot,
  onWorkspaceRootChange,
  primaryActionLabel = 'Open primary',
}: {
  file: DefenseTraceFileReference;
  workspaceRoot: string;
  onWorkspaceRootChange: (value: string) => void;
  primaryActionLabel?: string;
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
    updateStatus('Opening requested. If browser asks permission, choose Open Visual Studio Code.', 3200);
  };

  if (!hasWorkspaceRoot) {
    return (
      <div className="space-y-3">
        <p className="text-sm font-semibold text-foreground">
          Open this first: <code className="rounded bg-muted/50 px-1 py-0.5 font-mono text-[11px]">{file.relativePath}</code>
        </p>
        {file.rolePurpose ? (
          <p className="text-[11px] text-muted-foreground">
            Purpose: <span className="font-semibold">{file.rolePurpose}</span>
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <DefenseTraceCopyCommandButton
            command={file.relativePath}
            label="Copy path"
          />
        </div>
        <DefenseTraceWorkspaceSetupCard
          onWorkspaceRootChange={onWorkspaceRootChange}
          workspaceRoot={workspaceRoot}
        />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-foreground">
        Open this first: <code className="rounded bg-muted/5 px-1 py-0.5 font-mono text-[11px]">{file.relativePath}</code>
      </p>
      {file.symbolName ? (
        <p className="text-[11px] text-muted-foreground">
          Component: <span className="font-semibold">{file.symbolName}</span>
        </p>
      ) : null}
      {file.rolePurpose ? (
        <p className="text-[11px] text-muted-foreground">
          Purpose: <span className="font-semibold">{file.rolePurpose}</span>
        </p>
      ) : null}
      {file.line ? (
        <p className="text-[11px] text-muted-foreground">
          Line: <span className="font-semibold">{file.line}</span>
        </p>
      ) : null}

      {/* Large primary button */}
      <button
        className="inline-flex items-center justify-center gap-2 rounded-xl border-brand-green/50 bg-brand-green px-5 py-3 text-sm font-bold text-white shadow-md transition hover:bg-brand-green/90 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={!hasWorkspaceRoot}
        onClick={openInVscode}
        type="button"
      >
        <ExternalLink className="h-4 w-4" />
        {primaryActionLabel}
      </button>

      {/* Secondary buttons */}
      <div className="flex flex-wrap gap-2">
        <ActionButton onClick={() => void copyValue(file.relativePath, 'Relative path copied')}>
          <Clipboard className="h-3 w-3" />
          Copy path
        </ActionButton>
        <ActionButton onClick={() => void copyValue(resolvedTarget!.absolutePath, 'Absolute path copied')}>
          <Clipboard className="h-3 w-3" />
          Copy absolute path
        </ActionButton>
        <ActionButton onClick={() => void copyValue(resolvedTarget!.vscodeCliCommand, 'Command copied')}>
          <Clipboard className="h-3 w-3" />
          Copy code command
        </ActionButton>
        <ActionButton onClick={() => void copyValue(resolvedTarget!.gitGrepCommand, 'Search command copied')}>
          <Clipboard className="h-3 w-3" />
          Copy search
        </ActionButton>
      </div>
      {status ? (
        <p className="text-[11px] font-semibold text-brand-navy dark:text-brand-sky">
          {status}
        </p>
      ) : null}
      <p className="text-[11px] text-muted-foreground">
        If browser asks permission, choose Open Visual Studio Code. If open fails, use Copy code command or Copy path as fallback.
      </p>
    </div>
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
    updateStatus('Opening requested. If browser asks permission, choose Open Visual Studio Code.', 3200);
  };

  return (
    <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-2">
      <div className="min-w-0">
        <p className="text-xs font-semibold text-foreground">
          {file.rolePurpose ?? 'Source file'}
        </p>
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
          Copy path
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
          Copy absolute
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
          Copy command
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
        <ActionButton
          onClick={() => {
            const fileName =
              file.relativePath.split('/').pop()?.replace(/\.[^.]+$/, '') ??
              file.relativePath;
            const command =
              resolvedTarget?.gitGrepCommand ??
              `git grep -n "${file.symbolName ?? fileName}" -- apps/web/src apps/api/src prisma`;
            void copyValue(command, 'git grep copied');
          }}
          title="Copy git grep search command"
        >
          <Clipboard className="h-3 w-3" />
          Copy search
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
