import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../database/prisma.service';

export type SalaryStructureRecord = Prisma.SalaryStructureGetPayload<object>;

export type PayrollRunRecord = Prisma.PayrollRunGetPayload<{
  include: {
    project: true;
    costCenter: true;
    postedVoucher: true;
    payrollRunLines: {
      select: {
        basicAmount: true;
        allowanceAmount: true;
        deductionAmount: true;
        netAmount: true;
      };
    };
  };
}>;

export type PayrollRunLineRecord = Prisma.PayrollRunLineGetPayload<{
  include: {
    employee: {
      include: {
        department: true;
        location: true;
      };
    };
  };
}>;

@Injectable()
export class PayrollReferenceService {
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

  async getProjectRecord(companyId: string, projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: {
        id: projectId,
        companyId,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found.');
    }

    return project;
  }

  async getCostCenterRecord(companyId: string, costCenterId: string) {
    const costCenter = await this.prisma.costCenter.findFirst({
      where: {
        id: costCenterId,
        companyId,
      },
      include: {
        project: true,
      },
    });

    if (!costCenter) {
      throw new NotFoundException('Cost center not found.');
    }

    return costCenter;
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
      },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found.');
    }

    return employee;
  }

  async getSalaryStructureRecord(companyId: string, salaryStructureId: string) {
    const salaryStructure = await this.prisma.salaryStructure.findFirst({
      where: {
        id: salaryStructureId,
        companyId,
      },
    });

    if (!salaryStructure) {
      throw new NotFoundException('Salary structure not found.');
    }

    return salaryStructure;
  }

  async getPayrollRunRecord(companyId: string, payrollRunId: string) {
    const payrollRun = await this.prisma.payrollRun.findFirst({
      where: {
        id: payrollRunId,
        companyId,
      },
      include: {
        project: true,
        costCenter: true,
        postedVoucher: true,
        payrollRunLines: {
          select: {
            basicAmount: true,
            allowanceAmount: true,
            deductionAmount: true,
            netAmount: true,
          },
        },
      },
    });

    if (!payrollRun) {
      throw new NotFoundException('Payroll run not found.');
    }

    return payrollRun;
  }

  async getPayrollRunLineRecord(
    companyId: string,
    payrollRunId: string,
    payrollRunLineId: string,
  ) {
    const payrollRunLine = await this.prisma.payrollRunLine.findFirst({
      where: {
        id: payrollRunLineId,
        payrollRunId,
        companyId,
      },
      include: {
        employee: {
          include: {
            department: true,
            location: true,
          },
        },
      },
    });

    if (!payrollRunLine) {
      throw new NotFoundException('Payroll run line not found.');
    }

    return payrollRunLine;
  }
}
