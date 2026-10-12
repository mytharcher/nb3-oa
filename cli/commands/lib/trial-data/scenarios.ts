import { randomUUID } from 'node:crypto';
import { addDays, type TrialFacts } from './bootstrap.js';
import { trialPrefix, type TrialRole } from './accounts.js';

export interface TrialScenario {
  key: string;
  title: string;
  path: string;
  collection: string;
  markerField: string;
  actor: TrialRole;
  body: Record<string, unknown>;
  mode?:
    | 'contracts'
    | 'qualification'
    | 'asset'
    | 'command'
    | 'versioned'
    | 'plural';
  draft?: boolean;
  stopAt?: TrialRole;
  complete?: boolean;
  attachment?:
    | 'reimbursement'
    | 'payment'
    | 'contracts'
    | 'qualification'
    | 'seals'
    | 'asset';
}

export const trialWorkflowNames = [
  '请假',
  '销假',
  '加班',
  '补卡／考勤更正',
  '外出',
  '办公用品领用',
  '通用申请',
  '证明开具',
  '培训',
  '费用事前申请',
  '出差',
  '出差撤销',
  '报销',
  '借款／还款',
  '采购',
  '付款',
  '预算调整',
  '转正',
  '合同',
  '合同变更／续签／终止',
  '用印',
  '供应商准入',
  '资产领用／借用／报废',
  '车辆',
  '招聘',
  '入职办理',
  '离职交接',
  '转岗／调薪／晋升',
] as const;

export function scenarios(f: TrialFacts): TrialScenario[] {
  const marker = (key: string) => `${trialPrefix}·${key}`;
  const at = (offset: number, time: string) =>
    f.instant(addDays(f.date, offset), time);
  const make = (
    key: string,
    title: string,
    path: string,
    body: Record<string, unknown>,
    extra: Partial<TrialScenario> = {},
  ): TrialScenario => ({
    key,
    title,
    path: `/${path}`,
    collection: path,
    markerField: 'reason',
    actor: 'employee',
    body: { ...body, reason: marker(key) },
    ...extra,
  });
  const leave = (
    key: string,
    offset: number,
    extra: Partial<TrialScenario> = {},
  ) =>
    make(
      key,
      '请假',
      'leaveRequests',
      {
        leaveType: 'personal',
        startDate: addDays(f.date, offset),
        endDate: addDays(f.date, offset),
        startHalf: 'am',
        endHalf: 'pm',
        attachments: [],
        handoverUserId: f.users.employee2,
        enableDelegation: false,
      },
      extra,
    );
  const loan = (key: string, extra: Partial<TrialScenario> = {}) =>
    make(
      key,
      '借款',
      'loanRequests',
      {
        amountCents: 200000,
        dueDate: addDays(f.date, 30),
        travelId: null,
      },
      extra,
    );
  const baseContract = {
    operation: 'new',
    contractId: null,
    baseVersion: 0,
    proposal: {
      contractType: f.dictionary.contractType,
      counterparty: { kind: 'customer', name: '示例·客户公司（虚构）' },
      amountCents: 1000000,
      startsOn: f.date,
      endsOn: addDays(f.date, 300),
      paymentTerms: '示例付款条款，不发生实际支付',
      standardTemplate: false,
      textVersionId: null,
      attachments: [],
      reason: marker('contract-review'),
    },
  };
  return [
    leave('leave-draft', 0, { draft: true }),
    leave('leave-manager', 1),
    leave('leave-approved', 2, { complete: true }),
    make('overtime-manager', '加班', 'overtimeRequests', {
      date: addDays(f.date, 3),
      minutes: 120,
      settlement: 'compensatory',
    }),
    make('attendance-change', '补卡', 'attendanceChangeRequests', {
      date: f.attendanceDate,
      originalAttendanceId: f.attendanceId,
      originalVersion: f.attendanceVersion,
      correctionAt: f.instant(f.attendanceDate, '09:00'),
      proof: '虚构考勤说明',
      attachments: [],
    }),
    make('outing-manager', '外出', 'outingRequests', {
      startAt: at(4, '09:00'),
      endAt: at(4, '12:00'),
      location: '示例客户办公室',
    }),
    make(
      'supply-head',
      '办公用品领用',
      'supplyRequests',
      {
        items: [{ code: f.dictionary.officeItem, quantity: 2 }],
        purpose: marker('supply-head'),
      },
      {
        markerField: 'purpose',
        body: {
          items: [{ code: f.dictionary.officeItem, quantity: 2 }],
          purpose: marker('supply-head'),
        },
      },
    ),
    make(
      'general-approval',
      '通用申请',
      'generalRequests',
      {},
      {
        markerField: 'title',
        body: {
          title: marker('general-approval'),
          body: '虚构示例：申请跨部门协作支持。',
          attachments: [],
          extraApproverIds: [f.users.legal, f.users.hr],
        },
      },
    ),
    make(
      'certificate-head',
      '在职证明',
      'certificateRequests',
      {},
      {
        mode: 'versioned',
        markerField: 'purpose',
        body: {
          certificateType: 'employment',
          purpose: marker('certificate-head'),
          copies: 1,
          deliveryMethod: 'digital',
          requestKey: `${trialPrefix}-certificate-head`,
        },
      },
    ),
    make(
      'seal-head',
      '用印',
      'sealRequests',
      {},
      {
        mode: 'versioned',
        attachment: 'seals',
        markerField: 'purpose',
        body: {
          contractId: null,
          fileIds: [],
          sealType: f.dictionary.sealType,
          copies: 2,
          external: false,
          returnDueAt: null,
          purpose: marker('seal-head'),
          contact: '示例联系人',
          requestKey: `${trialPrefix}-seal-head`,
        },
      },
    ),
    make('training-review', '培训', 'trainingRequests', {
      name: '示例·项目管理培训',
      institution: '示例培训机构',
      startAt: at(5, '09:00'),
      endAt: at(5, '17:00'),
      usesWorkingTime: true,
      amountCents: 100000,
    }),
    make('expense-plan-head', '费用事前申请', 'expensePlans', {
      matterType: f.dictionary.expensePlanType,
      amountCents: 500000,
      subject: 'entertainment',
      participants: 10,
      eventDate: addDays(f.date, 6),
    }),
    make('travel-head', '出差', 'travelRequests', {
      destination: '示例城市',
      international: false,
      startAt: at(7, '09:00'),
      endAt: at(8, '18:00'),
      companionIds: [],
      attachments: [],
      transportCents: 100000,
      lodgingCents: 50000,
      allowanceCents: 20000,
      needsLoan: false,
      needsBooking: true,
    }),
    loan('loan-head'),
    loan('loan-finance', { stopAt: 'finance' }),
    loan('loan-cashier', { stopAt: 'cashier' }),
    make(
      'reimbursement-head',
      '报销',
      'reimbursementRequests',
      {
        authorizationId: null,
        loanId: null,
        offsetCents: 0,
        overrunReason: '示例独立报销',
        lines: [],
      },
      { attachment: 'reimbursement' },
    ),
    make(
      'purchase-head',
      '采购',
      'purchaseRequests',
      {},
      {
        markerField: 'purpose',
        body: {
          items: [
            {
              id: randomUUID(),
              name: '示例办公设备',
              specification: '试用型号',
              quantity: '2',
              unit: '台',
            },
          ],
          subject: 'equipment',
          estimatedCents: 1000000,
          expectedDate: addDays(f.date, 14),
          suggestedVendorId: f.vendorId,
          purpose: marker('purchase-head'),
        },
      },
    ),
    make(
      'payment-head',
      '付款',
      'paymentRequests',
      {
        sourceMode: 'none',
        purchaseOrderId: null,
        contractId: null,
        noPriorApprovalReason: '虚构试用付款：无事前审批示例',
        vendorId: f.vendorId,
        amountCents: 100000,
        invoiceNumber: `${trialPrefix}-PAY-001`,
        attachments: [],
        paymentMethod: f.dictionary.paymentMethod,
      },
      { attachment: 'payment' },
    ),
    make('budget-head', '预算调整', 'budgetAdjustments', {
      departmentId: f.departments.engineering,
      year: f.year,
      subject: 'travel',
      adjustmentType: 'transfer',
      sourceSubject: 'office',
      amountCents: 100000,
    }),
    make(
      'probation-manager',
      '转正',
      'probationRequests',
      {},
      {
        actor: 'hr',
        markerField: 'selfEvaluation',
        body: {
          employeeId: f.employees.probation,
          selfEvaluation: marker('probation-manager'),
        },
      },
    ),
    make(
      'contract-review',
      '合同',
      'contractRequests',
      {},
      {
        mode: 'contracts',
        attachment: 'contracts',
        actor: 'employee2',
        body: {
          requestId: `${trialPrefix}-contract-review`,
          input: baseContract,
        },
      },
    ),
    make(
      'qualification-review',
      '供应商准入',
      'vendorQualifications',
      {},
      {
        mode: 'qualification',
        attachment: 'qualification',
        actor: 'purchasing',
        body: {
          requestId: `${trialPrefix}-qualification-review`,
          input: {
            operation: 'qualify',
            vendorId: f.vendorId,
            name: '示例·办公设备供应商（虚构）',
            category: f.dictionary.supplierCategory,
            reason: marker('qualification-review'),
            quoteCents: 1000000,
            cases: '虚构供应商合作案例',
            contactName: '示例联系人',
            contactPhone: '00000000000',
            contactEmail: 'vendor@oa-trial.example.test',
            attachments: [],
            qualificationExpiry: addDays(f.date, 300),
          },
        },
      },
    ),
    ...(['use', 'borrow', 'scrap'] as const).map((operation) =>
      make(
        `asset-${operation}`,
        `资产${operation}`,
        'assetRequests',
        {},
        {
          mode: 'asset',
          actor: operation === 'scrap' ? 'admin' : 'employee',
          markerField: 'purpose',
          attachment: operation === 'scrap' ? 'asset' : undefined,
          body: {
            operation,
            category: f.dictionary.assetCategory,
            assetIds: operation === 'scrap' ? [f.assetIds[7]] : [],
            quantity: 1,
            purpose: marker(`asset-${operation}`),
            borrowDueDate: operation === 'borrow' ? addDays(f.date, 30) : null,
            scrapReason:
              operation === 'scrap' ? '示例故障设备，上传照片后可提交' : '',
            photos: [],
            requestId: `${trialPrefix}-asset-${operation}`,
          },
        },
      ),
    ),
    make(
      'vehicle-head',
      '车辆',
      'vehicleRequests',
      {},
      {
        markerField: 'purpose',
        mode: 'plural',
        body: {
          purpose: marker('vehicle-head'),
          destination: '示例客户园区',
          startAt: at(10, '09:00'),
          endAt: at(10, '17:00'),
          passengers: 3,
          needsDriver: true,
        },
      },
    ),
    make(
      'departure-review',
      '离职',
      'departureRequests',
      {
        departureType: f.dictionary.departureType,
        expectedLastWorkingDay: addDays(f.date, 30),
        handoverUserId: f.users.employee2,
      },
      { actor: 'departing', mode: 'plural' },
    ),
    make(
      'recruitment-review',
      '招聘',
      'recruitmentRequests',
      {},
      {
        actor: 'head',
        mode: 'command',
        body: {
          requestKey: `${trialPrefix}-recruitment-review`,
          reason: marker('recruitment-review'),
          proposal: {
            departmentId: f.departments.engineering,
            positionId: f.positionId,
            gradeId: f.gradeId,
            accountId: f.accountId,
            year: f.year,
            quantity: 3,
            kind: 'additional',
            replacementEmployeeIds: [],
            minimumCents: 800000,
            maximumCents: 1200000,
            expectedStartDate: addDays(f.date, 14),
            jobDescription: '示例岗位：业务与技术协作',
            reason: marker('recruitment-review'),
          },
        },
      },
    ),
    make(
      'transfer-review',
      '转岗／调薪／晋升',
      'transferRequests',
      {},
      {
        actor: 'hr',
        mode: 'command',
        body: {
          requestKey: `${trialPrefix}-transfer-review`,
          reason: marker('transfer-review'),
          proposal: {
            employeeId: f.employees.employee2,
            kinds: ['transfer', 'salaryChange', 'promotion'],
            targetDepartmentId: f.departments.sales,
            targetPositionId: f.positionId,
            targetGradeId: f.promotionGradeId,
            targetManagerId: f.employees.sales,
            sourceAccountId: f.accountId,
            targetAccountId: f.targetAccountId,
            effectiveDate: addDays(f.date, 30),
            targetSalary: '10000.00',
            reason: marker('transfer-review'),
          },
        },
      },
    ),
  ];
}
