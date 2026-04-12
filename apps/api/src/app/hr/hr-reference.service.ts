import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../database/prisma.service';

export type EmployeeRecord = Prisma.EmployeeGetPayload<{
  include: {
    department: true;
    location: true;
    user: true;
    manager: true;
  };
}>;

export type AttendanceDeviceRecord = Prisma.AttendanceDeviceGetPayload<{
  include: {
    location: true;
  };
}>;

export type DeviceUserRecord = Prisma.DeviceUserGetPayload<{
  include: {
    employee: {
      include: {
        department: true;
        location: true;
        user: true;
        manager: true;
      };
    };
    attendanceDevice: {
      include: {
        location: true;
      };
    };
  };
}>;

export type AttendanceLogRecord = Prisma.AttendanceLogGetPayload<{
  include: {
    deviceUser: {
      include: {
        employee: {
          include: {
            department: true;
            location: true;
            user: true;
            manager: true;
          };
        };
        attendanceDevice: {
          include: {
            location: true;
          };
        };
      };
    };
  };
}>;

export type LeaveTypeRecord = Prisma.LeaveTypeGetPayload<object>;

export type LeaveRequestRecord = Prisma.LeaveRequestGetPayload<{
  include: {
    employee: {
      include: {
        department: true;
        location: true;
        user: true;
        manager: true;
      };
    };
    leaveType: true;
  };
}>;

@Injectable()
export class HrReferenceService {
  constructor(private readonly prisma: PrismaService) {}

  async assertCompanyExists(companyId: string): Promise<void> {
    const company = await this.prisma.company.findUnique({
      where: {
        id: companyId,
      },
      select: {
        id: true,
      },
    });

    if (!company) {
      throw new NotFoundException('Company not found.');
    }
  }

  async getDepartmentRecord(companyId: string, departmentId: string) {
    const department = await this.prisma.department.findFirst({
      where: {
        id: departmentId,
        companyId,
      },
    });

    if (!department) {
      throw new NotFoundException('Department not found.');
    }

    return department;
  }

  async getLocationRecord(companyId: string, locationId: string) {
    const location = await this.prisma.location.findFirst({
      where: {
        id: locationId,
        companyId,
      },
    });

    if (!location) {
      throw new NotFoundException('Location not found.');
    }

    return location;
  }

  async getUserCompanyAccessRecord(companyId: string, userId: string) {
    const userRole = await this.prisma.userRole.findFirst({
      where: {
        companyId,
        userId,
        isActive: true,
        user: {
          isActive: true,
        },
        role: {
          isActive: true,
        },
      },
      include: {
        user: true,
        role: true,
      },
    });

    if (!userRole) {
      throw new NotFoundException('User was not found in the company.');
    }

    return userRole;
  }

  async getEmployeeRecord(companyId: string, employeeId: string) {
    const employee = await this.prisma.employee.findFirst({
      where: {
        id: employeeId,
        companyId,
      },
      include: {
        department: true,
        location: true,
        user: true,
        manager: true,
      },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found.');
    }

    return employee;
  }

  async getAttendanceDeviceRecord(companyId: string, attendanceDeviceId: string) {
    const attendanceDevice = await this.prisma.attendanceDevice.findFirst({
      where: {
        id: attendanceDeviceId,
        companyId,
      },
      include: {
        location: true,
      },
    });

    if (!attendanceDevice) {
      throw new NotFoundException('Attendance device not found.');
    }

    return attendanceDevice;
  }

  async getDeviceUserRecord(companyId: string, deviceUserId: string) {
    const deviceUser = await this.prisma.deviceUser.findFirst({
      where: {
        id: deviceUserId,
        companyId,
      },
      include: {
        employee: {
          include: {
            department: true,
            location: true,
            user: true,
            manager: true,
          },
        },
        attendanceDevice: {
          include: {
            location: true,
          },
        },
      },
    });

    if (!deviceUser) {
      throw new NotFoundException('Attendance device user mapping not found.');
    }

    return deviceUser;
  }

  async getLeaveTypeRecord(companyId: string, leaveTypeId: string) {
    const leaveType = await this.prisma.leaveType.findFirst({
      where: {
        id: leaveTypeId,
        companyId,
      },
    });

    if (!leaveType) {
      throw new NotFoundException('Leave type not found.');
    }

    return leaveType;
  }

  async getAttendanceLogRecord(companyId: string, attendanceLogId: string) {
    const attendanceLog = await this.prisma.attendanceLog.findFirst({
      where: {
        id: attendanceLogId,
        companyId,
      },
      include: {
        deviceUser: {
          include: {
            employee: {
              include: {
                department: true,
                location: true,
                user: true,
                manager: true,
              },
            },
            attendanceDevice: {
              include: {
                location: true,
              },
            },
          },
        },
      },
    });

    if (!attendanceLog) {
      throw new NotFoundException('Attendance log not found.');
    }

    return attendanceLog;
  }

  async getLeaveRequestRecord(companyId: string, leaveRequestId: string) {
    const leaveRequest = await this.prisma.leaveRequest.findFirst({
      where: {
        id: leaveRequestId,
        companyId,
      },
      include: {
        employee: {
          include: {
            department: true,
            location: true,
            user: true,
            manager: true,
          },
        },
        leaveType: true,
      },
    });

    if (!leaveRequest) {
      throw new NotFoundException('Leave request not found.');
    }

    return leaveRequest;
  }
}
