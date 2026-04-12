export interface ApiErrorResponse {
  statusCode: number;
  error: string;
  message: string;
  path: string;
  timestamp: string;
  requestId?: string | null;
  details?: unknown;
}

export interface ValidationErrorDetail {
  field: string;
  messages: string[];
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<TItem> {
  items: TItem[];
  meta: PaginationMeta;
}

export interface CompanyReference {
  id: string;
  name: string;
  slug: string;
}

export interface CompanyAssignment {
  company: CompanyReference;
  roles: string[];
}

export interface CurrentUser {
  id: string;
  email: string;
  isActive: boolean;
  lastLoginAt: string | null;
  currentCompany: CompanyReference;
  roles: string[];
  assignments: CompanyAssignment[];
}

export interface AuthSessionResponse {
  tokenType: string;
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
  user: CurrentUser;
}

export interface LogoutResponse {
  status: 'ok';
  message: string;
}

export interface LoginPayload {
  email: string;
  password: string;
  companyId?: string;
}

export interface LoginCompanyOption {
  id: string;
  name: string;
  slug: string;
  roles: string[];
}

export interface MultiCompanyLoginDetails {
  availableCompanies: LoginCompanyOption[];
}

export interface ListQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  isActive?: boolean;
}

export const ACCOUNTING_VOUCHER_TYPES = [
  'RECEIPT',
  'PAYMENT',
  'JOURNAL',
  'CONTRA',
] as const;

export const ACCOUNTING_VOUCHER_STATUSES = ['DRAFT', 'POSTED'] as const;

export const ACCOUNTING_NATURAL_BALANCES = ['DEBIT', 'CREDIT'] as const;

export type AccountingVoucherType = (typeof ACCOUNTING_VOUCHER_TYPES)[number];
export type AccountingVoucherStatus =
  (typeof ACCOUNTING_VOUCHER_STATUSES)[number];
export type AccountingNaturalBalance =
  (typeof ACCOUNTING_NATURAL_BALANCES)[number];

export type CompanyListQueryParams = ListQueryParams;

export type AccountClassListQueryParams = ListQueryParams;

export interface AccountGroupListQueryParams extends ListQueryParams {
  accountClassId?: string;
}

export interface LedgerAccountListQueryParams extends ListQueryParams {
  accountClassId?: string;
  accountGroupId?: string;
}

export interface ParticularAccountListQueryParams extends ListQueryParams {
  accountClassId?: string;
  accountGroupId?: string;
  ledgerAccountId?: string;
}

export interface VoucherListQueryParams extends ListQueryParams {
  voucherType?: AccountingVoucherType;
  status?: AccountingVoucherStatus;
  dateFrom?: string;
  dateTo?: string;
}

export interface CompanyRecord {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  currentUserRoles: string[];
  createdAt: string;
  updatedAt: string;
}

export interface LocationRecord {
  id: string;
  companyId: string;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DepartmentRecord {
  id: string;
  companyId: string;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyUserRecord {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  identityIsActive: boolean;
  companyAccessIsActive: boolean;
  roles: string[];
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RoleRecord {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RoleAssignmentRecord {
  id: string;
  companyId: string;
  userId: string;
  roleId: string;
  roleCode: string;
  roleName: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyUsersListQueryParams extends ListQueryParams {
  roleCode?: string;
}

export type RoleListQueryParams = ListQueryParams;

export interface CreateCompanyPayload {
  name: string;
  slug: string;
}

export interface UpdateCompanyPayload {
  name?: string;
  slug?: string;
}

export interface CreateLocationPayload {
  code: string;
  name: string;
  description?: string;
}

export interface UpdateLocationPayload {
  code?: string;
  name?: string;
  description?: string;
}

export interface CreateDepartmentPayload {
  code: string;
  name: string;
  description?: string;
}

export interface UpdateDepartmentPayload {
  code?: string;
  name?: string;
  description?: string;
}

export interface CreateCompanyUserPayload {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  roleCodes: string[];
}

export interface UpdateCompanyUserPayload {
  firstName?: string;
  lastName?: string;
}

export interface AssignRolePayload {
  roleCode: string;
}

export interface AccountClassRecord {
  id: string;
  code: string;
  name: string;
  naturalBalance: AccountingNaturalBalance;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AccountGroupRecord {
  id: string;
  companyId: string;
  accountClassId: string;
  accountClassCode: string;
  accountClassName: string;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LedgerAccountRecord {
  id: string;
  companyId: string;
  accountClassId: string;
  accountClassCode: string;
  accountClassName: string;
  accountGroupId: string;
  accountGroupCode: string;
  accountGroupName: string;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ParticularAccountRecord {
  id: string;
  companyId: string;
  accountClassId: string;
  accountClassCode: string;
  accountClassName: string;
  accountGroupId: string;
  accountGroupCode: string;
  accountGroupName: string;
  ledgerAccountId: string;
  ledgerAccountCode: string;
  ledgerAccountName: string;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAccountGroupPayload {
  accountClassId: string;
  code: string;
  name: string;
  description?: string;
}

export interface UpdateAccountGroupPayload {
  accountClassId?: string;
  code?: string;
  name?: string;
  description?: string;
}

export interface CreateLedgerAccountPayload {
  accountGroupId: string;
  code: string;
  name: string;
  description?: string;
}

export interface UpdateLedgerAccountPayload {
  accountGroupId?: string;
  code?: string;
  name?: string;
  description?: string;
}

export interface CreateParticularAccountPayload {
  ledgerAccountId: string;
  code: string;
  name: string;
  description?: string;
}

export interface UpdateParticularAccountPayload {
  ledgerAccountId?: string;
  code?: string;
  name?: string;
  description?: string;
}

export interface VoucherRecord {
  id: string;
  companyId: string;
  voucherType: AccountingVoucherType;
  status: AccountingVoucherStatus;
  voucherDate: string;
  description: string | null;
  reference: string | null;
  createdById: string;
  postedById: string | null;
  postedAt: string | null;
  lineCount: number;
  totalDebit: string;
  totalCredit: string;
  createdAt: string;
  updatedAt: string;
}

export interface VoucherLineRecord {
  id: string;
  voucherId: string;
  lineNumber: number;
  particularAccountId: string;
  particularAccountCode: string;
  particularAccountName: string;
  ledgerAccountId: string;
  ledgerAccountCode: string;
  ledgerAccountName: string;
  description: string | null;
  debitAmount: string;
  creditAmount: string;
  createdAt: string;
  updatedAt: string;
}

export interface VoucherDetailRecord extends VoucherRecord {
  lines: VoucherLineRecord[];
}

export interface CreateVoucherDraftPayload {
  voucherType: AccountingVoucherType;
  voucherDate: string;
  description?: string;
  reference?: string;
}

export interface UpdateVoucherDraftPayload {
  voucherType?: AccountingVoucherType;
  voucherDate?: string;
  description?: string;
  reference?: string;
}

export interface CreateVoucherLinePayload {
  particularAccountId: string;
  description?: string;
  debitAmount: string;
  creditAmount: string;
}

export interface UpdateVoucherLinePayload {
  particularAccountId?: string;
  description?: string;
  debitAmount?: string;
  creditAmount?: string;
}

export interface TrialBalanceQueryParams {
  dateFrom: string;
  dateTo: string;
  voucherType?: AccountingVoucherType;
  ledgerAccountId?: string;
  particularAccountId?: string;
}

export interface GeneralLedgerQueryParams {
  particularAccountId: string;
  dateFrom: string;
  dateTo: string;
  voucherType?: AccountingVoucherType;
}

export interface ProfitAndLossQueryParams {
  dateFrom: string;
  dateTo: string;
}

export interface BalanceSheetQueryParams {
  asOfDate: string;
}

export interface TrialBalanceAmountsRecord {
  openingDebit: string;
  openingCredit: string;
  movementDebit: string;
  movementCredit: string;
  closingDebit: string;
  closingCredit: string;
}

export interface TrialBalancePostingAccountRecord extends TrialBalanceAmountsRecord {
  particularAccountId: string;
  particularAccountCode: string;
  particularAccountName: string;
}

export interface TrialBalanceLedgerAccountRecord extends TrialBalanceAmountsRecord {
  ledgerAccountId: string;
  ledgerAccountCode: string;
  ledgerAccountName: string;
  postingAccounts: TrialBalancePostingAccountRecord[];
}

export interface TrialBalanceAccountGroupRecord extends TrialBalanceAmountsRecord {
  accountGroupId: string;
  accountGroupCode: string;
  accountGroupName: string;
  ledgerAccounts: TrialBalanceLedgerAccountRecord[];
}

export interface TrialBalanceSectionRecord extends TrialBalanceAmountsRecord {
  accountClassId: string;
  accountClassCode: string;
  accountClassName: string;
  accountClassNaturalBalance: AccountingNaturalBalance;
  accountClassSortOrder: number;
  accountGroups: TrialBalanceAccountGroupRecord[];
}

export interface TrialBalanceResponseRecord {
  companyId: string;
  dateFrom: string;
  dateTo: string;
  voucherType: AccountingVoucherType | null;
  ledgerAccountId: string | null;
  particularAccountId: string | null;
  totals: TrialBalanceAmountsRecord;
  sections: TrialBalanceSectionRecord[];
}

export interface GeneralLedgerAccountRecord {
  accountClassId: string;
  accountClassCode: string;
  accountClassName: string;
  accountClassNaturalBalance: AccountingNaturalBalance;
  accountGroupId: string;
  accountGroupCode: string;
  accountGroupName: string;
  ledgerAccountId: string;
  ledgerAccountCode: string;
  ledgerAccountName: string;
  particularAccountId: string;
  particularAccountCode: string;
  particularAccountName: string;
  isActive: boolean;
}

export interface GeneralLedgerBalanceRecord {
  debit: string;
  credit: string;
}

export interface GeneralLedgerLineRecord extends GeneralLedgerBalanceRecord {
  voucherId: string;
  voucherLineId: string;
  voucherDate: string;
  voucherType: AccountingVoucherType;
  voucherReference: string | null;
  voucherDescription: string | null;
  lineNumber: number;
  lineDescription: string | null;
  runningDebit: string;
  runningCredit: string;
}

export interface GeneralLedgerTotalsRecord extends GeneralLedgerBalanceRecord {
  closingDebit: string;
  closingCredit: string;
}

export interface GeneralLedgerResponseRecord {
  companyId: string;
  dateFrom: string;
  dateTo: string;
  voucherType: AccountingVoucherType | null;
  account: GeneralLedgerAccountRecord;
  openingBalance: GeneralLedgerBalanceRecord;
  totals: GeneralLedgerTotalsRecord;
  lines: GeneralLedgerLineRecord[];
}

export interface FinancialStatementPostingAccountRecord {
  particularAccountId: string;
  particularAccountCode: string;
  particularAccountName: string;
  amount: string;
}

export interface FinancialStatementLedgerAccountRecord {
  ledgerAccountId: string;
  ledgerAccountCode: string;
  ledgerAccountName: string;
  amount: string;
  postingAccounts: FinancialStatementPostingAccountRecord[];
}

export interface FinancialStatementAccountGroupRecord {
  accountGroupId: string;
  accountGroupCode: string;
  accountGroupName: string;
  amount: string;
  ledgerAccounts: FinancialStatementLedgerAccountRecord[];
}

export interface FinancialStatementSectionRecord {
  accountClassId: string;
  accountClassCode: string;
  accountClassName: string;
  accountClassNaturalBalance: AccountingNaturalBalance;
  accountClassSortOrder: number;
  amount: string;
  accountGroups: FinancialStatementAccountGroupRecord[];
}

export interface ProfitAndLossTotalsRecord {
  totalRevenue: string;
  totalExpense: string;
  netProfitLoss: string;
}

export interface ProfitAndLossResponseRecord {
  companyId: string;
  dateFrom: string;
  dateTo: string;
  totals: ProfitAndLossTotalsRecord;
  sections: FinancialStatementSectionRecord[];
}

export interface BalanceSheetDerivedLineRecord {
  code: string;
  name: string;
  amount: string;
}

export interface BalanceSheetTotalsRecord {
  totalAssets: string;
  totalLiabilities: string;
  totalEquity: string;
  unclosedEarnings: string;
  totalLiabilitiesAndEquity: string;
}

export interface BalanceSheetResponseRecord {
  companyId: string;
  asOfDate: string;
  isBalanced: boolean;
  totals: BalanceSheetTotalsRecord;
  sections: FinancialStatementSectionRecord[];
  equityAdjustments: BalanceSheetDerivedLineRecord[];
}

export interface ProjectListQueryParams extends ListQueryParams {
  locationId?: string;
}

export interface CostCenterListQueryParams extends ListQueryParams {
  projectId?: string;
}

export interface ProjectPhaseListQueryParams extends ListQueryParams {
  projectId?: string;
}

export interface BlockListQueryParams extends ListQueryParams {
  projectId?: string;
  phaseId?: string;
}

export interface ZoneListQueryParams extends ListQueryParams {
  projectId?: string;
  blockId?: string;
}

export type UnitTypeListQueryParams = ListQueryParams;

export type UnitStatusListQueryParams = ListQueryParams;

export interface UnitListQueryParams extends ListQueryParams {
  projectId?: string;
  phaseId?: string;
  blockId?: string;
  zoneId?: string;
  unitTypeId?: string;
  unitStatusId?: string;
}

export interface ProjectRecord {
  id: string;
  companyId: string;
  locationId: string | null;
  locationCode: string | null;
  locationName: string | null;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CostCenterRecord {
  id: string;
  companyId: string;
  projectId: string | null;
  projectCode: string | null;
  projectName: string | null;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectPhaseRecord {
  id: string;
  companyId: string;
  projectId: string;
  projectCode: string;
  projectName: string;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BlockRecord {
  id: string;
  companyId: string;
  projectId: string;
  projectCode: string;
  projectName: string;
  phaseId: string | null;
  phaseCode: string | null;
  phaseName: string | null;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ZoneRecord {
  id: string;
  companyId: string;
  projectId: string;
  projectCode: string;
  projectName: string;
  blockId: string | null;
  blockCode: string | null;
  blockName: string | null;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UnitTypeRecord {
  id: string;
  companyId: string;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UnitStatusRecord {
  id: string;
  code: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UnitRecord {
  id: string;
  companyId: string;
  projectId: string;
  projectCode: string;
  projectName: string;
  phaseId: string | null;
  phaseCode: string | null;
  phaseName: string | null;
  blockId: string | null;
  blockCode: string | null;
  blockName: string | null;
  zoneId: string | null;
  zoneCode: string | null;
  zoneName: string | null;
  unitTypeId: string;
  unitTypeCode: string;
  unitTypeName: string;
  unitStatusId: string;
  unitStatusCode: string;
  unitStatusName: string;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectPayload {
  locationId?: string | null;
  code: string;
  name: string;
  description?: string | null;
}

export interface UpdateProjectPayload {
  locationId?: string | null;
  code?: string;
  name?: string;
  description?: string | null;
}

export interface CreateCostCenterPayload {
  projectId?: string | null;
  code: string;
  name: string;
  description?: string | null;
}

export interface UpdateCostCenterPayload {
  projectId?: string | null;
  code?: string;
  name?: string;
  description?: string | null;
}

export interface CreateProjectPhasePayload {
  projectId: string;
  code: string;
  name: string;
  description?: string | null;
}

export interface UpdateProjectPhasePayload {
  code?: string;
  name?: string;
  description?: string | null;
}

export interface CreateBlockPayload {
  projectId: string;
  phaseId?: string | null;
  code: string;
  name: string;
  description?: string | null;
}

export interface UpdateBlockPayload {
  phaseId?: string | null;
  code?: string;
  name?: string;
  description?: string | null;
}

export interface CreateZonePayload {
  projectId: string;
  blockId?: string | null;
  code: string;
  name: string;
  description?: string | null;
}

export interface UpdateZonePayload {
  blockId?: string | null;
  code?: string;
  name?: string;
  description?: string | null;
}

export interface CreateUnitTypePayload {
  code: string;
  name: string;
  description?: string | null;
}

export interface UpdateUnitTypePayload {
  code?: string;
  name?: string;
  description?: string | null;
}

export interface CreateUnitPayload {
  projectId: string;
  phaseId?: string | null;
  blockId?: string | null;
  zoneId?: string | null;
  unitTypeId: string;
  unitStatusId: string;
  code: string;
  name: string;
  description?: string | null;
}

export interface UpdateUnitPayload {
  phaseId?: string | null;
  blockId?: string | null;
  zoneId?: string | null;
  unitTypeId?: string;
  unitStatusId?: string;
  code?: string;
  name?: string;
  description?: string | null;
}

export const PROPERTY_DESK_LEAD_STATUSES = [
  'NEW',
  'CONTACTED',
  'QUALIFIED',
  'CLOSED',
] as const;

export const PROPERTY_DESK_BOOKING_STATUSES = ['ACTIVE', 'CONTRACTED'] as const;

export const PROPERTY_DESK_DUE_STATES = ['due', 'overdue'] as const;

export type PropertyDeskLeadStatus =
  (typeof PROPERTY_DESK_LEAD_STATUSES)[number];
export type PropertyDeskBookingStatus =
  (typeof PROPERTY_DESK_BOOKING_STATUSES)[number];
export type PropertyDeskDueState = (typeof PROPERTY_DESK_DUE_STATES)[number];

export type CustomerListQueryParams = ListQueryParams;

export interface LeadListQueryParams extends ListQueryParams {
  projectId?: string;
  status?: PropertyDeskLeadStatus;
}

export interface BookingListQueryParams extends ListQueryParams {
  customerId?: string;
  projectId?: string;
  unitId?: string;
  status?: PropertyDeskBookingStatus;
  dateFrom?: string;
  dateTo?: string;
}

export interface SaleContractListQueryParams extends ListQueryParams {
  customerId?: string;
  projectId?: string;
  unitId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface InstallmentScheduleListQueryParams extends ListQueryParams {
  saleContractId?: string;
  dueState?: PropertyDeskDueState;
}

export interface CollectionListQueryParams extends ListQueryParams {
  customerId?: string;
  bookingId?: string;
  saleContractId?: string;
  installmentScheduleId?: string;
  voucherId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface CustomerRecord {
  id: string;
  companyId: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LeadRecord {
  id: string;
  companyId: string;
  projectId: string | null;
  projectCode: string | null;
  projectName: string | null;
  fullName: string;
  email: string | null;
  phone: string | null;
  source: string | null;
  status: PropertyDeskLeadStatus;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BookingRecord {
  id: string;
  companyId: string;
  projectId: string;
  projectCode: string;
  projectName: string;
  customerId: string;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  unitId: string;
  unitCode: string;
  unitName: string;
  unitStatusId: string;
  unitStatusCode: string;
  unitStatusName: string;
  bookingDate: string;
  bookingAmount: string;
  status: PropertyDeskBookingStatus;
  notes: string | null;
  saleContractId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SaleContractRecord {
  id: string;
  companyId: string;
  bookingId: string;
  customerId: string;
  customerName: string;
  projectId: string;
  projectCode: string;
  projectName: string;
  unitId: string;
  unitCode: string;
  unitName: string;
  bookingDate: string;
  bookingAmount: string;
  contractDate: string;
  contractAmount: string;
  reference: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InstallmentScheduleRecord {
  id: string;
  companyId: string;
  saleContractId: string;
  bookingId: string;
  customerId: string;
  customerName: string;
  projectId: string;
  projectCode: string;
  projectName: string;
  unitId: string;
  unitCode: string;
  unitName: string;
  sequenceNumber: number;
  dueDate: string;
  amount: string;
  collectedAmount: string;
  balanceAmount: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CollectionRecord {
  id: string;
  companyId: string;
  customerId: string;
  customerName: string;
  voucherId: string;
  voucherStatus: string;
  voucherDate: string;
  voucherReference: string | null;
  bookingId: string | null;
  saleContractId: string | null;
  installmentScheduleId: string | null;
  collectionDate: string;
  amount: string;
  reference: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerPayload {
  fullName: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  notes?: string | null;
}

export interface UpdateCustomerPayload {
  fullName?: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  notes?: string | null;
}

export interface CreateLeadPayload {
  projectId?: string | null;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  source?: string | null;
  status?: PropertyDeskLeadStatus;
  notes?: string | null;
}

export interface UpdateLeadPayload {
  projectId?: string | null;
  fullName?: string;
  email?: string | null;
  phone?: string | null;
  source?: string | null;
  status?: PropertyDeskLeadStatus;
  notes?: string | null;
}

export interface CreateBookingPayload {
  customerId: string;
  unitId: string;
  bookingDate: string;
  bookingAmount: string;
  notes?: string | null;
}

export interface UpdateBookingPayload {
  notes?: string | null;
}

export interface CreateSaleContractPayload {
  bookingId: string;
  contractDate: string;
  contractAmount: string;
  reference?: string | null;
  notes?: string | null;
}

export interface UpdateSaleContractPayload {
  reference?: string | null;
  notes?: string | null;
}

export interface CreateInstallmentScheduleRowPayload {
  sequenceNumber: number;
  dueDate: string;
  amount: string;
  description?: string | null;
}

export interface CreateInstallmentSchedulesPayload {
  saleContractId: string;
  rows: CreateInstallmentScheduleRowPayload[];
}

export interface UpdateInstallmentSchedulePayload {
  sequenceNumber?: number;
  dueDate?: string;
  amount?: string;
  description?: string | null;
}

export interface CreateCollectionPayload {
  customerId: string;
  voucherId: string;
  bookingId?: string | null;
  saleContractId?: string | null;
  installmentScheduleId?: string | null;
  collectionDate: string;
  amount: string;
  reference?: string | null;
  notes?: string | null;
}

export const HR_ATTENDANCE_LOG_DIRECTIONS = ['IN', 'OUT', 'UNKNOWN'] as const;

export const HR_LEAVE_REQUEST_STATUSES = [
  'DRAFT',
  'SUBMITTED',
  'APPROVED',
  'REJECTED',
  'CANCELLED',
] as const;

export type AttendanceLogDirection =
  (typeof HR_ATTENDANCE_LOG_DIRECTIONS)[number];
export type LeaveRequestStatus = (typeof HR_LEAVE_REQUEST_STATUSES)[number];

export interface EmployeeListQueryParams extends ListQueryParams {
  departmentId?: string;
  locationId?: string;
  managerEmployeeId?: string;
}

export interface AttendanceDeviceListQueryParams extends ListQueryParams {
  locationId?: string;
}

export interface DeviceUserListQueryParams extends ListQueryParams {
  employeeId?: string;
  attendanceDeviceId?: string;
  locationId?: string;
}

export interface AttendanceLogListQueryParams extends ListQueryParams {
  employeeId?: string;
  attendanceDeviceId?: string;
  deviceUserId?: string;
  locationId?: string;
  direction?: AttendanceLogDirection;
  dateFrom?: string;
  dateTo?: string;
}

export type LeaveTypeListQueryParams = ListQueryParams;

export interface LeaveRequestListQueryParams extends ListQueryParams {
  employeeId?: string;
  leaveTypeId?: string;
  departmentId?: string;
  locationId?: string;
  status?: LeaveRequestStatus;
  dateFrom?: string;
  dateTo?: string;
}

export interface EmployeeRecord {
  id: string;
  companyId: string;
  employeeCode: string;
  fullName: string;
  departmentId: string | null;
  departmentCode: string | null;
  departmentName: string | null;
  locationId: string | null;
  locationCode: string | null;
  locationName: string | null;
  userId: string | null;
  userEmail: string | null;
  userFirstName: string | null;
  userLastName: string | null;
  managerEmployeeId: string | null;
  managerEmployeeCode: string | null;
  managerFullName: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceDeviceRecord {
  id: string;
  companyId: string;
  code: string;
  name: string;
  description: string | null;
  locationId: string | null;
  locationCode: string | null;
  locationName: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DeviceUserRecord {
  id: string;
  companyId: string;
  employeeId: string;
  employeeCode: string;
  employeeFullName: string;
  attendanceDeviceId: string;
  attendanceDeviceCode: string;
  attendanceDeviceName: string;
  locationId: string | null;
  locationCode: string | null;
  locationName: string | null;
  deviceEmployeeCode: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceLogRecord {
  id: string;
  companyId: string;
  deviceUserId: string;
  employeeId: string;
  employeeCode: string;
  employeeFullName: string;
  attendanceDeviceId: string;
  attendanceDeviceCode: string;
  attendanceDeviceName: string;
  locationId: string | null;
  locationCode: string | null;
  locationName: string | null;
  deviceEmployeeCode: string;
  loggedAt: string;
  direction: AttendanceLogDirection;
  externalLogId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BulkAttendanceLogsResult {
  createdCount: number;
  skippedCount: number;
}

export interface LeaveTypeRecord {
  id: string;
  companyId: string;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LeaveRequestRecord {
  id: string;
  companyId: string;
  employeeId: string;
  employeeCode: string;
  employeeFullName: string;
  departmentId: string | null;
  departmentCode: string | null;
  departmentName: string | null;
  locationId: string | null;
  locationCode: string | null;
  locationName: string | null;
  leaveTypeId: string;
  leaveTypeCode: string;
  leaveTypeName: string;
  startDate: string;
  endDate: string;
  reason: string | null;
  decisionNote: string | null;
  status: LeaveRequestStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEmployeePayload {
  employeeCode: string;
  fullName: string;
  departmentId?: string | null;
  locationId?: string | null;
  userId?: string | null;
  managerEmployeeId?: string | null;
}

export interface UpdateEmployeePayload {
  employeeCode?: string;
  fullName?: string;
  departmentId?: string | null;
  locationId?: string | null;
  userId?: string | null;
  managerEmployeeId?: string | null;
}

export interface CreateAttendanceDevicePayload {
  code: string;
  name: string;
  description?: string | null;
  locationId?: string | null;
}

export interface UpdateAttendanceDevicePayload {
  code?: string;
  name?: string;
  description?: string | null;
  locationId?: string | null;
}

export interface CreateDeviceUserPayload {
  employeeId: string;
  attendanceDeviceId: string;
  deviceEmployeeCode: string;
}

export interface UpdateDeviceUserPayload {
  employeeId?: string;
  attendanceDeviceId?: string;
  deviceEmployeeCode?: string;
}

export interface CreateAttendanceLogPayload {
  deviceUserId: string;
  loggedAt: string;
  direction?: AttendanceLogDirection;
  externalLogId?: string | null;
}

export interface BulkCreateAttendanceLogsPayload {
  entries: CreateAttendanceLogPayload[];
}

export interface CreateLeaveTypePayload {
  code: string;
  name: string;
  description?: string | null;
}

export interface UpdateLeaveTypePayload {
  code?: string;
  name?: string;
  description?: string | null;
}

export interface CreateLeaveRequestPayload {
  employeeId: string;
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  reason?: string | null;
}

export interface UpdateLeaveRequestPayload {
  employeeId?: string;
  leaveTypeId?: string;
  startDate?: string;
  endDate?: string;
  reason?: string | null;
}

export interface LeaveRequestActionPayload {
  decisionNote?: string | null;
}

export const PAYROLL_RUN_STATUSES = [
  'DRAFT',
  'FINALIZED',
  'CANCELLED',
  'POSTED',
] as const;

export type PayrollRunStatus = (typeof PAYROLL_RUN_STATUSES)[number];

export type SalaryStructureListQueryParams = ListQueryParams;

export interface PayrollRunListQueryParams extends ListQueryParams {
  payrollYear?: number;
  payrollMonth?: number;
  status?: PayrollRunStatus;
  projectId?: string;
  costCenterId?: string;
}

export interface PayrollRunLineListQueryParams extends ListQueryParams {
  employeeId?: string;
}

export interface SalaryStructureRecord {
  id: string;
  companyId: string;
  code: string;
  name: string;
  description: string | null;
  basicAmount: string;
  allowanceAmount: string;
  deductionAmount: string;
  netAmount: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PayrollRunRecord {
  id: string;
  companyId: string;
  payrollYear: number;
  payrollMonth: number;
  projectId: string | null;
  projectCode: string | null;
  projectName: string | null;
  costCenterId: string | null;
  costCenterCode: string | null;
  costCenterName: string | null;
  description: string | null;
  status: PayrollRunStatus;
  postedVoucherId: string | null;
  postedVoucherReference: string | null;
  postedVoucherDate: string | null;
  finalizedAt: string | null;
  cancelledAt: string | null;
  postedAt: string | null;
  lineCount: number;
  totalBasicAmount: string;
  totalAllowanceAmount: string;
  totalDeductionAmount: string;
  totalNetAmount: string;
  createdAt: string;
  updatedAt: string;
}

export interface PayrollRunLineRecord {
  id: string;
  companyId: string;
  payrollRunId: string;
  employeeId: string;
  employeeCode: string;
  employeeFullName: string;
  departmentId: string | null;
  departmentCode: string | null;
  departmentName: string | null;
  locationId: string | null;
  locationCode: string | null;
  locationName: string | null;
  basicAmount: string;
  allowanceAmount: string;
  deductionAmount: string;
  netAmount: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSalaryStructurePayload {
  code: string;
  name: string;
  description?: string | null;
  basicAmount: string;
  allowanceAmount: string;
  deductionAmount: string;
  netAmount: string;
}

export interface UpdateSalaryStructurePayload {
  code?: string;
  name?: string;
  description?: string | null;
  basicAmount?: string;
  allowanceAmount?: string;
  deductionAmount?: string;
  netAmount?: string;
}

export interface CreatePayrollRunPayload {
  payrollYear: number;
  payrollMonth: number;
  projectId?: string | null;
  costCenterId?: string | null;
  description?: string | null;
}

export interface UpdatePayrollRunPayload {
  payrollYear?: number;
  payrollMonth?: number;
  projectId?: string | null;
  costCenterId?: string | null;
  description?: string | null;
}

export interface CreatePayrollRunLinePayload {
  employeeId: string;
  basicAmount: string;
  allowanceAmount: string;
  deductionAmount: string;
  netAmount: string;
}

export interface UpdatePayrollRunLinePayload {
  basicAmount?: string;
  allowanceAmount?: string;
  deductionAmount?: string;
  netAmount?: string;
}

export interface PostPayrollRunPayload {
  voucherDate: string;
  expenseParticularAccountId: string;
  payableParticularAccountId: string;
  deductionParticularAccountId?: string | null;
}

export const ATTACHMENT_STATUSES = [
  'PENDING_UPLOAD',
  'AVAILABLE',
  'ARCHIVED',
] as const;

export const ATTACHMENT_ENTITY_TYPES = [
  'COMPANY',
  'USER',
  'EMPLOYEE',
  'PROJECT',
  'UNIT',
  'CUSTOMER',
  'BOOKING',
  'SALE_CONTRACT',
  'VOUCHER',
  'PAYROLL_RUN',
] as const;

export const AUDIT_EVENT_CATEGORIES = [
  'AUTH',
  'ADMIN',
  'ACCOUNTING',
  'CRM_PROPERTY_DESK',
  'PAYROLL',
  'ATTACHMENT',
] as const;

export const AUDIT_ENTITY_TYPES = [
  'COMPANY',
  'LOCATION',
  'DEPARTMENT',
  'USER',
  'USER_ROLE',
  'EMPLOYEE',
  'PROJECT',
  'UNIT',
  'CUSTOMER',
  'BOOKING',
  'SALE_CONTRACT',
  'VOUCHER',
  'PAYROLL_RUN',
  'ATTACHMENT',
  'ATTACHMENT_LINK',
] as const;

export type AttachmentStatus = (typeof ATTACHMENT_STATUSES)[number];
export type AttachmentEntityType = (typeof ATTACHMENT_ENTITY_TYPES)[number];
export type AuditEventCategory = (typeof AUDIT_EVENT_CATEGORIES)[number];
export type AuditEntityType = (typeof AUDIT_ENTITY_TYPES)[number];

export interface AttachmentLinkRecord {
  id: string;
  companyId: string;
  attachmentId: string;
  entityType: AttachmentEntityType;
  entityId: string;
  createdById: string;
  createdByEmail: string | null;
  removedById: string | null;
  removedByEmail: string | null;
  isActive: boolean;
  removedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AttachmentRecord {
  id: string;
  companyId: string;
  storageBucket: string;
  storageKey: string;
  originalFileName: string;
  mimeType: string;
  sizeBytes: string;
  checksumSha256: string | null;
  objectEtag: string | null;
  uploadedById: string;
  uploadedByEmail: string | null;
  archivedById: string | null;
  archivedByEmail: string | null;
  status: AttachmentStatus;
  activeLinkCount: number;
  links: AttachmentLinkRecord[];
  uploadCompletedAt: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type AttachmentDetailRecord = AttachmentRecord;

export interface AttachmentListQueryParams extends ListQueryParams {
  status?: AttachmentStatus;
  entityType?: AttachmentEntityType;
  entityId?: string;
  mimeType?: string;
  uploadedByUserId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface CreateAttachmentUploadIntentPayload {
  originalFileName: string;
  mimeType: string;
  sizeBytes: string;
  checksumSha256?: string | null;
}

export interface AttachmentUploadIntentResponse {
  attachment: AttachmentDetailRecord;
  uploadMethod: string;
  uploadUrl: string;
  requiredHeaders: Record<string, string>;
  expiresAt: string;
}

export interface CreateAttachmentLinkPayload {
  entityType: AttachmentEntityType;
  entityId: string;
}

export interface AttachmentDownloadAccessRecord {
  attachmentId: string;
  fileName: string;
  mimeType: string;
  downloadUrl: string;
  expiresAt: string;
}

export interface AttachmentEntityTypeOptionRecord {
  entityType: AttachmentEntityType;
  label: string;
}

export interface AttachmentEntityReferenceListQueryParams extends ListQueryParams {
  entityType: AttachmentEntityType;
  isActive?: boolean;
}

export interface AttachmentEntityReferenceRecord {
  id: string;
  entityType: AttachmentEntityType;
  primaryLabel: string;
  secondaryLabel: string | null;
  contextLabel: string | null;
  isActive: boolean | null;
}

export interface AuditEventRecord {
  id: string;
  companyId: string;
  category: AuditEventCategory;
  eventType: string;
  actorUserId: string | null;
  actorEmail: string | null;
  targetEntityType: AuditEntityType | null;
  targetEntityId: string | null;
  requestId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface AuditEventListQueryParams extends ListQueryParams {
  category?: AuditEventCategory;
  eventType?: string;
  actorUserId?: string;
  targetEntityType?: AuditEntityType;
  targetEntityId?: string;
  dateFrom?: string;
  dateTo?: string;
  requestId?: string;
}
