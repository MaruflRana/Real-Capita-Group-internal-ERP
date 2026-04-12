import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { BlocksController } from './blocks.controller';
import { CostCentersController } from './cost-centers.controller';
import { ProjectPhasesController } from './project-phases.controller';
import { ProjectHierarchyService } from './project-hierarchy.service';
import { ProjectMastersService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { UnitStatusesController } from './unit-statuses.controller';
import { UnitTypesController } from './unit-types.controller';
import { UnitsController } from './units.controller';
import { UnitsService } from './units.service';
import { ZonesController } from './zones.controller';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [
    ProjectsController,
    CostCentersController,
    ProjectPhasesController,
    BlocksController,
    ZonesController,
    UnitTypesController,
    UnitStatusesController,
    UnitsController,
  ],
  providers: [ProjectMastersService, ProjectHierarchyService, UnitsService],
})
export class ProjectPropertyModule {}
