'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@real-capita/ui';

import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select } from '../../components/ui/select';
import { Textarea } from '../../components/ui/textarea';
import { isApiError } from '../../lib/api/client';
import type {
  BlockRecord,
  LocationRecord,
  ProjectPhaseRecord,
  ProjectRecord,
  UnitRecord,
  UnitStatusRecord,
  UnitTypeRecord,
  ZoneRecord,
} from '../../lib/api/types';
import { applyApiFormErrors } from '../../lib/forms';
import {
  FormErrorText,
  HierarchyBadgeRow,
  ProjectPropertyQueryErrorBanner,
} from './shared';
import {
  getBlockLabel,
  getPhaseLabel,
  getProjectLabel,
  getZoneLabel,
} from './utils';

const optionalTextSchema = z
  .string()
  .trim()
  .max(500, 'Description must be 500 characters or fewer.')
  .optional()
  .or(z.literal(''));

const optionalIdSchema = z.string().optional().or(z.literal(''));

export const projectFormSchema = z.object({
  locationId: optionalIdSchema,
  code: z.string().trim().min(1, 'Code is required.').max(50),
  name: z.string().trim().min(1, 'Name is required.').max(120),
  description: optionalTextSchema,
});

export const costCenterFormSchema = z.object({
  projectId: optionalIdSchema,
  code: z.string().trim().min(1, 'Code is required.').max(50),
  name: z.string().trim().min(1, 'Name is required.').max(120),
  description: optionalTextSchema,
});

export const projectPhaseFormSchema = z.object({
  projectId: z.string().min(1, 'Project is required.'),
  code: z.string().trim().min(1, 'Code is required.').max(50),
  name: z.string().trim().min(1, 'Name is required.').max(120),
  description: optionalTextSchema,
});

export const blockFormSchema = z.object({
  projectId: z.string().min(1, 'Project is required.'),
  phaseId: optionalIdSchema,
  code: z.string().trim().min(1, 'Code is required.').max(50),
  name: z.string().trim().min(1, 'Name is required.').max(120),
  description: optionalTextSchema,
});

export const zoneFormSchema = z.object({
  projectId: z.string().min(1, 'Project is required.'),
  blockId: optionalIdSchema,
  code: z.string().trim().min(1, 'Code is required.').max(50),
  name: z.string().trim().min(1, 'Name is required.').max(120),
  description: optionalTextSchema,
});

export const unitTypeFormSchema = z.object({
  code: z.string().trim().min(1, 'Code is required.').max(50),
  name: z.string().trim().min(1, 'Name is required.').max(120),
  description: optionalTextSchema,
});

export const unitFormSchema = z.object({
  projectId: z.string().min(1, 'Project is required.'),
  phaseId: optionalIdSchema,
  blockId: optionalIdSchema,
  zoneId: optionalIdSchema,
  unitTypeId: z.string().min(1, 'Unit type is required.'),
  unitStatusId: z.string().min(1, 'Unit status is required.'),
  code: z.string().trim().min(1, 'Unit code is required.').max(50),
  name: z.string().trim().min(1, 'Unit name is required.').max(120),
  description: optionalTextSchema,
});

export type ProjectFormValues = z.infer<typeof projectFormSchema>;
export type CostCenterFormValues = z.infer<typeof costCenterFormSchema>;
export type ProjectPhaseFormValues = z.infer<typeof projectPhaseFormSchema>;
export type BlockFormValues = z.infer<typeof blockFormSchema>;
export type ZoneFormValues = z.infer<typeof zoneFormSchema>;
export type UnitTypeFormValues = z.infer<typeof unitTypeFormSchema>;
export type UnitFormValues = z.infer<typeof unitFormSchema>;

const ReadOnlyField = ({
  label,
  value,
}: {
  label: string;
  value: string;
}) => (
  <div className="space-y-2">
    <Label>{label}</Label>
    <div className="rounded-2xl border border-border/70 bg-muted/35 px-4 py-2 text-sm text-foreground">
      {value}
    </div>
  </div>
);

const FormActions = ({
  isPending,
  onClose,
  submitLabel,
}: {
  isPending: boolean;
  onClose: () => void;
  submitLabel: string;
}) => (
  <div className="flex items-center justify-end gap-3">
    <Button onClick={onClose} type="button" variant="outline">
      Cancel
    </Button>
    <Button disabled={isPending} type="submit">
      {isPending ? 'Saving...' : submitLabel}
    </Button>
  </div>
);

const useSubmitErrorHandler = () => {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const clearSubmitError = useCallback(() => {
    setSubmitError(null);
  }, []);

  const handleError = useCallback(
    <TValues extends Record<string, unknown>>(
      setError: ReturnType<typeof useForm<TValues>>['setError'],
      error: unknown,
      fallbackMessage: string,
    ) => {
      if (applyApiFormErrors(setError, error)) {
        return;
      }

      if (isApiError(error)) {
        setSubmitError(error.apiError.message);
        return;
      }

      setSubmitError(fallbackMessage);
    },
    [],
  );

  return {
    submitError,
    clearSubmitError,
    handleError,
  };
};

export const ProjectFormPanel = ({
  project,
  locations,
  isPending,
  onClose,
  onSubmit,
}: {
  project: {
    locationId: string | null;
    code: string;
    name: string;
    description: string | null;
  } | null;
  locations: LocationRecord[];
  isPending: boolean;
  onClose: () => void;
  onSubmit: (values: ProjectFormValues) => Promise<unknown>;
}) => {
  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      locationId: project?.locationId ?? '',
      code: project?.code ?? '',
      name: project?.name ?? '',
      description: project?.description ?? '',
    },
  });
  const { submitError, clearSubmitError, handleError } = useSubmitErrorHandler();

  useEffect(() => {
    form.reset({
      locationId: project?.locationId ?? '',
      code: project?.code ?? '',
      name: project?.name ?? '',
      description: project?.description ?? '',
    });
    clearSubmitError();
  }, [clearSubmitError, form, project]);

  const currentLocationId = form.watch('locationId');

  const handleSubmit = form.handleSubmit(async (values) => {
    clearSubmitError();
    form.clearErrors();

    try {
      await onSubmit(values);
    } catch (error) {
      handleError(form.setError, error, 'Unable to save the project.');
    }
  });

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {submitError ? <ProjectPropertyQueryErrorBanner message={submitError} /> : null}
      <div className="space-y-2">
        <Label htmlFor="project-location">Location</Label>
        <Select id="project-location" {...form.register('locationId')}>
          <option value="">No location scope</option>
          {locations.map((location) => (
            <option
              disabled={!location.isActive && currentLocationId !== location.id}
              key={location.id}
              value={location.id}
            >
              {location.code} - {location.name}
              {!location.isActive && currentLocationId === location.id
                ? ' (inactive current)'
                : !location.isActive
                  ? ' (inactive)'
                  : ''}
            </option>
          ))}
        </Select>
        <FormErrorText message={form.formState.errors.locationId?.message} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="project-code">Project code</Label>
        <Input id="project-code" {...form.register('code')} />
        <FormErrorText message={form.formState.errors.code?.message} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="project-name">Project name</Label>
        <Input id="project-name" {...form.register('name')} />
        <FormErrorText message={form.formState.errors.name?.message} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="project-description">Description</Label>
        <Textarea id="project-description" {...form.register('description')} />
        <FormErrorText message={form.formState.errors.description?.message} />
      </div>
      <FormActions
        isPending={isPending}
        onClose={onClose}
        submitLabel={project ? 'Save changes' : 'Create project'}
      />
    </form>
  );
};

export const CostCenterFormPanel = ({
  costCenter,
  projects,
  isPending,
  onClose,
  onSubmit,
}: {
  costCenter: {
    projectId: string | null;
    code: string;
    name: string;
    description: string | null;
  } | null;
  projects: ProjectRecord[];
  isPending: boolean;
  onClose: () => void;
  onSubmit: (values: CostCenterFormValues) => Promise<unknown>;
}) => {
  const form = useForm<CostCenterFormValues>({
    resolver: zodResolver(costCenterFormSchema),
    defaultValues: {
      projectId: costCenter?.projectId ?? '',
      code: costCenter?.code ?? '',
      name: costCenter?.name ?? '',
      description: costCenter?.description ?? '',
    },
  });
  const { submitError, clearSubmitError, handleError } = useSubmitErrorHandler();

  useEffect(() => {
    form.reset({
      projectId: costCenter?.projectId ?? '',
      code: costCenter?.code ?? '',
      name: costCenter?.name ?? '',
      description: costCenter?.description ?? '',
    });
    clearSubmitError();
  }, [clearSubmitError, costCenter, form]);

  const currentProjectId = form.watch('projectId');

  const handleSubmit = form.handleSubmit(async (values) => {
    clearSubmitError();
    form.clearErrors();

    try {
      await onSubmit(values);
    } catch (error) {
      handleError(form.setError, error, 'Unable to save the cost center.');
    }
  });

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {submitError ? <ProjectPropertyQueryErrorBanner message={submitError} /> : null}
      <div className="space-y-2">
        <Label htmlFor="cost-center-project">Project</Label>
        <Select id="cost-center-project" {...form.register('projectId')}>
          <option value="">Company-level cost center</option>
          {projects.map((project) => (
            <option
              disabled={!project.isActive && currentProjectId !== project.id}
              key={project.id}
              value={project.id}
            >
              {getProjectLabel(project)}
              {!project.isActive && currentProjectId === project.id
                ? ' (inactive current)'
                : !project.isActive
                  ? ' (inactive)'
                  : ''}
            </option>
          ))}
        </Select>
        <FormErrorText message={form.formState.errors.projectId?.message} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="cost-center-code">Cost center code</Label>
        <Input id="cost-center-code" {...form.register('code')} />
        <FormErrorText message={form.formState.errors.code?.message} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="cost-center-name">Cost center name</Label>
        <Input id="cost-center-name" {...form.register('name')} />
        <FormErrorText message={form.formState.errors.name?.message} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="cost-center-description">Description</Label>
        <Textarea
          id="cost-center-description"
          {...form.register('description')}
        />
        <FormErrorText message={form.formState.errors.description?.message} />
      </div>
      <FormActions
        isPending={isPending}
        onClose={onClose}
        submitLabel={costCenter ? 'Save changes' : 'Create cost center'}
      />
    </form>
  );
};

export const ProjectPhaseFormPanel = ({
  projectPhase,
  projects,
  isPending,
  onClose,
  onSubmit,
  lockedProjectLabel,
}: {
  projectPhase: {
    projectId: string;
    code: string;
    name: string;
    description: string | null;
  } | null;
  projects: ProjectRecord[];
  isPending: boolean;
  onClose: () => void;
  onSubmit: (values: ProjectPhaseFormValues) => Promise<unknown>;
  lockedProjectLabel?: string;
}) => {
  const form = useForm<ProjectPhaseFormValues>({
    resolver: zodResolver(projectPhaseFormSchema),
    defaultValues: {
      projectId: projectPhase?.projectId ?? '',
      code: projectPhase?.code ?? '',
      name: projectPhase?.name ?? '',
      description: projectPhase?.description ?? '',
    },
  });
  const { submitError, clearSubmitError, handleError } = useSubmitErrorHandler();

  useEffect(() => {
    form.reset({
      projectId: projectPhase?.projectId ?? '',
      code: projectPhase?.code ?? '',
      name: projectPhase?.name ?? '',
      description: projectPhase?.description ?? '',
    });
    clearSubmitError();
  }, [clearSubmitError, form, projectPhase]);

  const currentProjectId = form.watch('projectId');

  const handleSubmit = form.handleSubmit(async (values) => {
    clearSubmitError();
    form.clearErrors();

    try {
      await onSubmit(values);
    } catch (error) {
      handleError(form.setError, error, 'Unable to save the project phase.');
    }
  });

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {submitError ? <ProjectPropertyQueryErrorBanner message={submitError} /> : null}
      {lockedProjectLabel ? (
        <>
          <input type="hidden" {...form.register('projectId')} />
          <ReadOnlyField label="Project" value={lockedProjectLabel} />
        </>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="phase-project">Project</Label>
          <Select id="phase-project" {...form.register('projectId')}>
            <option value="">Select project</option>
            {projects.map((project) => (
              <option
                disabled={!project.isActive && currentProjectId !== project.id}
                key={project.id}
                value={project.id}
              >
                {getProjectLabel(project)}
                {!project.isActive && currentProjectId === project.id
                  ? ' (inactive current)'
                  : !project.isActive
                    ? ' (inactive)'
                    : ''}
              </option>
            ))}
          </Select>
          <FormErrorText message={form.formState.errors.projectId?.message} />
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="phase-code">Phase code</Label>
        <Input id="phase-code" {...form.register('code')} />
        <FormErrorText message={form.formState.errors.code?.message} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phase-name">Phase name</Label>
        <Input id="phase-name" {...form.register('name')} />
        <FormErrorText message={form.formState.errors.name?.message} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phase-description">Description</Label>
        <Textarea id="phase-description" {...form.register('description')} />
        <FormErrorText message={form.formState.errors.description?.message} />
      </div>
      <FormActions
        isPending={isPending}
        onClose={onClose}
        submitLabel={projectPhase ? 'Save changes' : 'Create phase'}
      />
    </form>
  );
};

export const BlockFormPanel = ({
  block,
  projects,
  phases,
  isPending,
  onClose,
  onSubmit,
  lockedProjectLabel,
}: {
  block: {
    projectId: string;
    phaseId: string | null;
    code: string;
    name: string;
    description: string | null;
  } | null;
  projects: ProjectRecord[];
  phases: ProjectPhaseRecord[];
  isPending: boolean;
  onClose: () => void;
  onSubmit: (values: BlockFormValues) => Promise<unknown>;
  lockedProjectLabel?: string;
}) => {
  const form = useForm<BlockFormValues>({
    resolver: zodResolver(blockFormSchema),
    defaultValues: {
      projectId: block?.projectId ?? '',
      phaseId: block?.phaseId ?? '',
      code: block?.code ?? '',
      name: block?.name ?? '',
      description: block?.description ?? '',
    },
  });
  const { submitError, clearSubmitError, handleError } = useSubmitErrorHandler();
  const projectId = form.watch('projectId');
  const currentPhaseId = form.watch('phaseId');

  useEffect(() => {
    form.reset({
      projectId: block?.projectId ?? '',
      phaseId: block?.phaseId ?? '',
      code: block?.code ?? '',
      name: block?.name ?? '',
      description: block?.description ?? '',
    });
    clearSubmitError();
  }, [block, clearSubmitError, form]);

  const availablePhases = useMemo(
    () => phases.filter((phase) => phase.projectId === projectId),
    [phases, projectId],
  );

  useEffect(() => {
    if (!currentPhaseId) {
      return;
    }

    if (!availablePhases.some((phase) => phase.id === currentPhaseId)) {
      form.setValue('phaseId', '');
    }
  }, [availablePhases, currentPhaseId, form]);

  const handleSubmit = form.handleSubmit(async (values) => {
    clearSubmitError();
    form.clearErrors();

    try {
      await onSubmit(values);
    } catch (error) {
      handleError(form.setError, error, 'Unable to save the block.');
    }
  });

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {submitError ? <ProjectPropertyQueryErrorBanner message={submitError} /> : null}
      {lockedProjectLabel ? (
        <>
          <input type="hidden" {...form.register('projectId')} />
          <ReadOnlyField label="Project" value={lockedProjectLabel} />
        </>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="block-project">Project</Label>
          <Select id="block-project" {...form.register('projectId')}>
            <option value="">Select project</option>
            {projects.map((project) => (
              <option
                disabled={!project.isActive && projectId !== project.id}
                key={project.id}
                value={project.id}
              >
                {getProjectLabel(project)}
                {!project.isActive && projectId === project.id
                  ? ' (inactive current)'
                  : !project.isActive
                    ? ' (inactive)'
                    : ''}
              </option>
            ))}
          </Select>
          <FormErrorText message={form.formState.errors.projectId?.message} />
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="block-phase">Phase</Label>
        <Select id="block-phase" {...form.register('phaseId')}>
          <option value="">No phase</option>
          {availablePhases.map((phase) => (
            <option
              disabled={!phase.isActive && currentPhaseId !== phase.id}
              key={phase.id}
              value={phase.id}
            >
              {phase.code} - {phase.name}
              {!phase.isActive && currentPhaseId === phase.id
                ? ' (inactive current)'
                : !phase.isActive
                  ? ' (inactive)'
                  : ''}
            </option>
          ))}
        </Select>
        <FormErrorText message={form.formState.errors.phaseId?.message} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="block-code">Block code</Label>
        <Input id="block-code" {...form.register('code')} />
        <FormErrorText message={form.formState.errors.code?.message} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="block-name">Block name</Label>
        <Input id="block-name" {...form.register('name')} />
        <FormErrorText message={form.formState.errors.name?.message} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="block-description">Description</Label>
        <Textarea id="block-description" {...form.register('description')} />
        <FormErrorText message={form.formState.errors.description?.message} />
      </div>
      <FormActions
        isPending={isPending}
        onClose={onClose}
        submitLabel={block ? 'Save changes' : 'Create block'}
      />
    </form>
  );
};

export const ZoneFormPanel = ({
  zone,
  projects,
  blocks,
  isPending,
  onClose,
  onSubmit,
  lockedProjectLabel,
}: {
  zone: {
    projectId: string;
    blockId: string | null;
    code: string;
    name: string;
    description: string | null;
  } | null;
  projects: ProjectRecord[];
  blocks: BlockRecord[];
  isPending: boolean;
  onClose: () => void;
  onSubmit: (values: ZoneFormValues) => Promise<unknown>;
  lockedProjectLabel?: string;
}) => {
  const form = useForm<ZoneFormValues>({
    resolver: zodResolver(zoneFormSchema),
    defaultValues: {
      projectId: zone?.projectId ?? '',
      blockId: zone?.blockId ?? '',
      code: zone?.code ?? '',
      name: zone?.name ?? '',
      description: zone?.description ?? '',
    },
  });
  const { submitError, clearSubmitError, handleError } = useSubmitErrorHandler();
  const projectId = form.watch('projectId');
  const currentBlockId = form.watch('blockId');

  useEffect(() => {
    form.reset({
      projectId: zone?.projectId ?? '',
      blockId: zone?.blockId ?? '',
      code: zone?.code ?? '',
      name: zone?.name ?? '',
      description: zone?.description ?? '',
    });
    clearSubmitError();
  }, [clearSubmitError, form, zone]);

  const availableBlocks = useMemo(
    () => blocks.filter((block) => block.projectId === projectId),
    [blocks, projectId],
  );

  useEffect(() => {
    if (!currentBlockId) {
      return;
    }

    if (!availableBlocks.some((block) => block.id === currentBlockId)) {
      form.setValue('blockId', '');
    }
  }, [availableBlocks, currentBlockId, form]);

  const handleSubmit = form.handleSubmit(async (values) => {
    clearSubmitError();
    form.clearErrors();

    try {
      await onSubmit(values);
    } catch (error) {
      handleError(form.setError, error, 'Unable to save the zone.');
    }
  });

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {submitError ? <ProjectPropertyQueryErrorBanner message={submitError} /> : null}
      {lockedProjectLabel ? (
        <>
          <input type="hidden" {...form.register('projectId')} />
          <ReadOnlyField label="Project" value={lockedProjectLabel} />
        </>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="zone-project">Project</Label>
          <Select id="zone-project" {...form.register('projectId')}>
            <option value="">Select project</option>
            {projects.map((project) => (
              <option
                disabled={!project.isActive && projectId !== project.id}
                key={project.id}
                value={project.id}
              >
                {getProjectLabel(project)}
                {!project.isActive && projectId === project.id
                  ? ' (inactive current)'
                  : !project.isActive
                    ? ' (inactive)'
                    : ''}
              </option>
            ))}
          </Select>
          <FormErrorText message={form.formState.errors.projectId?.message} />
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="zone-block">Block</Label>
        <Select id="zone-block" {...form.register('blockId')}>
          <option value="">No block</option>
          {availableBlocks.map((block) => (
            <option
              disabled={!block.isActive && currentBlockId !== block.id}
              key={block.id}
              value={block.id}
            >
              {block.code} - {block.name}
              {!block.isActive && currentBlockId === block.id
                ? ' (inactive current)'
                : !block.isActive
                  ? ' (inactive)'
                  : ''}
            </option>
          ))}
        </Select>
        <FormErrorText message={form.formState.errors.blockId?.message} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="zone-code">Zone code</Label>
        <Input id="zone-code" {...form.register('code')} />
        <FormErrorText message={form.formState.errors.code?.message} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="zone-name">Zone name</Label>
        <Input id="zone-name" {...form.register('name')} />
        <FormErrorText message={form.formState.errors.name?.message} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="zone-description">Description</Label>
        <Textarea id="zone-description" {...form.register('description')} />
        <FormErrorText message={form.formState.errors.description?.message} />
      </div>
      <FormActions
        isPending={isPending}
        onClose={onClose}
        submitLabel={zone ? 'Save changes' : 'Create zone'}
      />
    </form>
  );
};

export const UnitTypeFormPanel = ({
  unitType,
  isPending,
  onClose,
  onSubmit,
}: {
  unitType: {
    code: string;
    name: string;
    description: string | null;
  } | null;
  isPending: boolean;
  onClose: () => void;
  onSubmit: (values: UnitTypeFormValues) => Promise<unknown>;
}) => {
  const form = useForm<UnitTypeFormValues>({
    resolver: zodResolver(unitTypeFormSchema),
    defaultValues: {
      code: unitType?.code ?? '',
      name: unitType?.name ?? '',
      description: unitType?.description ?? '',
    },
  });
  const { submitError, clearSubmitError, handleError } = useSubmitErrorHandler();

  useEffect(() => {
    form.reset({
      code: unitType?.code ?? '',
      name: unitType?.name ?? '',
      description: unitType?.description ?? '',
    });
    clearSubmitError();
  }, [clearSubmitError, form, unitType]);

  const handleSubmit = form.handleSubmit(async (values) => {
    clearSubmitError();
    form.clearErrors();

    try {
      await onSubmit(values);
    } catch (error) {
      handleError(form.setError, error, 'Unable to save the unit type.');
    }
  });

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {submitError ? <ProjectPropertyQueryErrorBanner message={submitError} /> : null}
      <div className="space-y-2">
        <Label htmlFor="unit-type-code">Unit type code</Label>
        <Input id="unit-type-code" {...form.register('code')} />
        <FormErrorText message={form.formState.errors.code?.message} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="unit-type-name">Unit type name</Label>
        <Input id="unit-type-name" {...form.register('name')} />
        <FormErrorText message={form.formState.errors.name?.message} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="unit-type-description">Description</Label>
        <Textarea
          id="unit-type-description"
          {...form.register('description')}
        />
        <FormErrorText message={form.formState.errors.description?.message} />
      </div>
      <FormActions
        isPending={isPending}
        onClose={onClose}
        submitLabel={unitType ? 'Save changes' : 'Create unit type'}
      />
    </form>
  );
};

export const UnitFormPanel = ({
  unit,
  projects,
  phases,
  blocks,
  zones,
  unitTypes,
  unitStatuses,
  isPending,
  onClose,
  onSubmit,
  lockedProjectLabel,
}: {
  unit: UnitRecord | null;
  projects: ProjectRecord[];
  phases: ProjectPhaseRecord[];
  blocks: BlockRecord[];
  zones: ZoneRecord[];
  unitTypes: UnitTypeRecord[];
  unitStatuses: UnitStatusRecord[];
  isPending: boolean;
  onClose: () => void;
  onSubmit: (values: UnitFormValues) => Promise<unknown>;
  lockedProjectLabel?: string;
}) => {
  const form = useForm<UnitFormValues>({
    resolver: zodResolver(unitFormSchema),
    defaultValues: {
      projectId: unit?.projectId ?? '',
      phaseId: unit?.phaseId ?? '',
      blockId: unit?.blockId ?? '',
      zoneId: unit?.zoneId ?? '',
      unitTypeId: unit?.unitTypeId ?? '',
      unitStatusId: unit?.unitStatusId ?? '',
      code: unit?.code ?? '',
      name: unit?.name ?? '',
      description: unit?.description ?? '',
    },
  });
  const { submitError, clearSubmitError, handleError } = useSubmitErrorHandler();
  const projectId = form.watch('projectId');
  const phaseId = form.watch('phaseId');
  const blockId = form.watch('blockId');
  const zoneId = form.watch('zoneId');
  const unitTypeId = form.watch('unitTypeId');
  const unitStatusId = form.watch('unitStatusId');

  useEffect(() => {
    form.reset({
      projectId: unit?.projectId ?? '',
      phaseId: unit?.phaseId ?? '',
      blockId: unit?.blockId ?? '',
      zoneId: unit?.zoneId ?? '',
      unitTypeId: unit?.unitTypeId ?? '',
      unitStatusId: unit?.unitStatusId ?? '',
      code: unit?.code ?? '',
      name: unit?.name ?? '',
      description: unit?.description ?? '',
    });
    clearSubmitError();
  }, [clearSubmitError, form, unit]);

  const availablePhases = useMemo(
    () => phases.filter((phase) => phase.projectId === projectId),
    [phases, projectId],
  );
  const availableBlocks = useMemo(
    () =>
      blocks.filter(
        (block) =>
          block.projectId === projectId &&
          (!phaseId || block.phaseId === phaseId),
      ),
    [blocks, phaseId, projectId],
  );
  const availableZones = useMemo(
    () =>
      zones.filter(
        (zone) =>
          zone.projectId === projectId &&
          (!blockId || zone.blockId === blockId),
      ),
    [blockId, projectId, zones],
  );

  useEffect(() => {
    if (phaseId && !availablePhases.some((phase) => phase.id === phaseId)) {
      form.setValue('phaseId', '');
    }
  }, [availablePhases, form, phaseId]);

  useEffect(() => {
    if (blockId && !availableBlocks.some((block) => block.id === blockId)) {
      form.setValue('blockId', '');
      form.setValue('zoneId', '');
    }
  }, [availableBlocks, blockId, form]);

  useEffect(() => {
    if (zoneId && !availableZones.some((zone) => zone.id === zoneId)) {
      form.setValue('zoneId', '');
    }
  }, [availableZones, form, zoneId]);

  useEffect(() => {
    if (!blockId) {
      return;
    }

    const block = blocks.find((item) => item.id === blockId);

    if (!block) {
      return;
    }

    if ((block.phaseId ?? '') !== phaseId) {
      form.setValue('phaseId', block.phaseId ?? '');
    }
  }, [blockId, blocks, form, phaseId]);

  useEffect(() => {
    if (!zoneId) {
      return;
    }

    const zone = zones.find((item) => item.id === zoneId);

    if (!zone) {
      return;
    }

    if ((zone.blockId ?? '') !== blockId) {
      form.setValue('blockId', zone.blockId ?? '');
    }

    const parentBlock = zone.blockId
      ? blocks.find((item) => item.id === zone.blockId)
      : null;

    if ((parentBlock?.phaseId ?? '') !== phaseId) {
      form.setValue('phaseId', parentBlock?.phaseId ?? '');
    }
  }, [blockId, blocks, form, phaseId, zoneId, zones]);

  const handleSubmit = form.handleSubmit(async (values) => {
    clearSubmitError();
    form.clearErrors();

    try {
      await onSubmit(values);
    } catch (error) {
      handleError(form.setError, error, 'Unable to save the unit.');
    }
  });

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {submitError ? <ProjectPropertyQueryErrorBanner message={submitError} /> : null}
      {lockedProjectLabel ? (
        <>
          <input type="hidden" {...form.register('projectId')} />
          <ReadOnlyField label="Project" value={lockedProjectLabel} />
        </>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="unit-project">Project</Label>
          <Select id="unit-project" {...form.register('projectId')}>
            <option value="">Select project</option>
            {projects.map((project) => (
              <option
                disabled={!project.isActive && projectId !== project.id}
                key={project.id}
                value={project.id}
              >
                {getProjectLabel(project)}
                {!project.isActive && projectId === project.id
                  ? ' (inactive current)'
                  : !project.isActive
                    ? ' (inactive)'
                    : ''}
              </option>
            ))}
          </Select>
          <FormErrorText message={form.formState.errors.projectId?.message} />
        </div>
      )}

      <div className="rounded-2xl border border-border/70 bg-muted/20 px-4 py-3">
        <p className="text-sm font-medium text-foreground">Hierarchy path</p>
        <div className="mt-2">
          <HierarchyBadgeRow
            items={[
              projects.find((project) => project.id === projectId)?.code,
              availablePhases.find((phase) => phase.id === phaseId)?.code,
              blocks.find((block) => block.id === blockId)?.code,
              zones.find((zone) => zone.id === zoneId)?.code,
            ]}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="unit-phase">Phase</Label>
        <Select id="unit-phase" {...form.register('phaseId')}>
          <option value="">No phase</option>
          {availablePhases.map((phase) => (
            <option
              disabled={!phase.isActive && phaseId !== phase.id}
              key={phase.id}
              value={phase.id}
            >
              {phase.code} - {phase.name}
              {!phase.isActive && phaseId === phase.id
                ? ' (inactive current)'
                : !phase.isActive
                  ? ' (inactive)'
                  : ''}
            </option>
          ))}
        </Select>
        <FormErrorText message={form.formState.errors.phaseId?.message} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="unit-block">Block</Label>
        <Select id="unit-block" {...form.register('blockId')}>
          <option value="">No block</option>
          {availableBlocks.map((block) => (
            <option
              disabled={!block.isActive && blockId !== block.id}
              key={block.id}
              value={block.id}
            >
              {block.code} - {block.name}
              {!block.isActive && blockId === block.id
                ? ' (inactive current)'
                : !block.isActive
                  ? ' (inactive)'
                  : ''}
            </option>
          ))}
        </Select>
        <FormErrorText message={form.formState.errors.blockId?.message} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="unit-zone">Zone</Label>
        <Select id="unit-zone" {...form.register('zoneId')}>
          <option value="">No zone</option>
          {availableZones.map((zone) => (
            <option
              disabled={!zone.isActive && zoneId !== zone.id}
              key={zone.id}
              value={zone.id}
            >
              {zone.code} - {zone.name}
              {!zone.isActive && zoneId === zone.id
                ? ' (inactive current)'
                : !zone.isActive
                  ? ' (inactive)'
                  : ''}
            </option>
          ))}
        </Select>
        <FormErrorText message={form.formState.errors.zoneId?.message} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="unit-type">Unit type</Label>
        <Select id="unit-type" {...form.register('unitTypeId')}>
          <option value="">Select unit type</option>
          {unitTypes.map((unitType) => (
            <option
              disabled={!unitType.isActive && unitTypeId !== unitType.id}
              key={unitType.id}
              value={unitType.id}
            >
              {unitType.code} - {unitType.name}
              {!unitType.isActive && unitTypeId === unitType.id
                ? ' (inactive current)'
                : !unitType.isActive
                  ? ' (inactive)'
                  : ''}
            </option>
          ))}
        </Select>
        <FormErrorText message={form.formState.errors.unitTypeId?.message} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="unit-status">Unit status</Label>
        <Select id="unit-status" {...form.register('unitStatusId')}>
          <option value="">Select unit status</option>
          {unitStatuses.map((unitStatus) => (
            <option
              disabled={!unitStatus.isActive && unitStatusId !== unitStatus.id}
              key={unitStatus.id}
              value={unitStatus.id}
            >
              {unitStatus.code} - {unitStatus.name}
              {!unitStatus.isActive && unitStatusId === unitStatus.id
                ? ' (inactive current)'
                : !unitStatus.isActive
                  ? ' (inactive)'
                  : ''}
            </option>
          ))}
        </Select>
        <FormErrorText message={form.formState.errors.unitStatusId?.message} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="unit-code">Unit code</Label>
        <Input id="unit-code" {...form.register('code')} />
        <FormErrorText message={form.formState.errors.code?.message} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="unit-name">Unit name</Label>
        <Input id="unit-name" {...form.register('name')} />
        <FormErrorText message={form.formState.errors.name?.message} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="unit-description">Description</Label>
        <Textarea id="unit-description" {...form.register('description')} />
        <FormErrorText message={form.formState.errors.description?.message} />
      </div>
      <FormActions
        isPending={isPending}
        onClose={onClose}
        submitLabel={unit ? 'Save changes' : 'Create unit'}
      />
    </form>
  );
};

export const ProjectPathPreview = ({
  project,
  phase,
  block,
  zone,
}: {
  project?: ProjectRecord | null;
  phase?: ProjectPhaseRecord | null;
  block?: BlockRecord | null;
  zone?: ZoneRecord | null;
}) => (
  <HierarchyBadgeRow
    items={[
      project ? getProjectLabel(project) : null,
      phase ? getPhaseLabel(phase) : null,
      block ? getBlockLabel(block) : null,
      zone ? getZoneLabel(zone) : null,
    ]}
  />
);
