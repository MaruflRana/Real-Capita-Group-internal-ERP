import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { AttendanceDevicesController } from './attendance-devices.controller';
import { AttendanceDevicesService } from './attendance-devices.service';
import { AttendanceLogsController } from './attendance-logs.controller';
import { AttendanceLogsService } from './attendance-logs.service';
import { DeviceUsersController } from './device-users.controller';
import { DeviceUsersService } from './device-users.service';
import { EmployeesController } from './employees.controller';
import { EmployeesService } from './employees.service';
import { HrReferencesController } from './hr-references.controller';
import { HrReferencesService } from './hr-references.service';
import { HrReferenceService } from './hr-reference.service';
import { LeaveRequestsController } from './leave-requests.controller';
import { LeaveRequestsService } from './leave-requests.service';
import { LeaveTypesController } from './leave-types.controller';
import { LeaveTypesService } from './leave-types.service';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [
    EmployeesController,
    HrReferencesController,
    AttendanceDevicesController,
    DeviceUsersController,
    AttendanceLogsController,
    LeaveTypesController,
    LeaveRequestsController,
  ],
  providers: [
    HrReferenceService,
    HrReferencesService,
    EmployeesService,
    AttendanceDevicesService,
    DeviceUsersService,
    AttendanceLogsService,
    LeaveTypesService,
    LeaveRequestsService,
  ],
})
export class HrModule {}
