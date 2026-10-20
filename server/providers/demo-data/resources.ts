import {
  notificationServiceToken,
  type NotificationConfig,
} from '@nocobase/app-plugin-notification/server';
import {
  announcementServiceToken,
  type Announcement,
} from '../announcements/contract.js';
import {
  approvalDirectoryServiceToken,
  type ApprovalDelegation,
} from '../approval-directory/contract.js';
import {
  employeeServiceToken,
  employeeModuleService,
} from '../employees/index.js';
import { personalScheduleServiceToken } from '../personal-schedules/contract.js';
import {
  attendanceManagementServiceToken,
  type ShiftPointer,
  type ShiftRevision,
} from '../attendance-management/contract.js';
import { attendanceEvaluationServiceToken } from '../attendance/evaluation-contract.js';
import type { Application } from '@nocobase/app-server/application';
import { databaseManagerToken } from '@nocobase/db';
import {
  knowledgeServiceToken,
  type KnowledgeFolder,
} from '../knowledge/contract.js';
import { workItemServiceToken, type WorkItem } from '../work-items/contract.js';
import {
  attendanceServiceToken,
  type AttendanceIngestInput,
} from '../attendance/contract.js';
import { vendorServiceToken } from '../vendors/contract.js';
import { assetServiceToken, type Asset } from '../assets/contract.js';
import { getTrialAccounts } from '../../../cli/commands/lib/trial-data/accounts.js';
import {
  addDays,
  trustedPolicy,
  type TrialFacts,
} from '../../../cli/commands/lib/trial-data/bootstrap.js';
import type { ScenarioResult } from '../../../cli/commands/lib/trial-data/engine.js';
import { currentDemo } from './context.js';

const topics = [
  ['新员工第一周指南', 'Your first week at Northstar'],
  ['差旅与费用报销指引', 'Travel and expense handbook'],
  ['信息安全与设备使用', 'Information security and device care'],
  ['采购比价与供应商选择', 'Purchasing and supplier selection'],
  ['客户交付检查清单', 'Customer delivery checklist'],
  ['会议与跨部门协作', 'Meetings and cross-team collaboration'],
  ['合同签署与用印规范', 'Contract signing and seal procedures'],
  ['休假与工作交接', 'Leave planning and handovers'],
  ['发票与付款资料要求', 'Invoice and payment documentation'],
  ['办公场地与设施指南', 'Workplace facilities guide'],
  ['项目复盘与知识沉淀', 'Project retrospectives and lessons learned'],
  ['员工成长与学习计划', 'Learning and career development'],
] as const;
const vendors = [
  ['青杉办公设备有限公司', 'Cedar Office Supply'],
  ['海湾商务服务有限公司', 'Harbor Business Services'],
  ['远桥信息技术有限公司', 'Bridgepoint Technology'],
  ['晨光培训咨询有限公司', 'Brightpath Learning'],
  ['云帆差旅服务有限公司', 'Skyline Travel Partners'],
  ['润禾办公家具有限公司', 'Meadow Workplace Furniture'],
  ['尚景会务服务有限公司', 'Summit Events'],
  ['澄明法律服务有限公司', 'Clearwater Legal Services'],
  ['星悦物业管理有限公司', 'Westbrook Facilities'],
  ['蓝溪印务有限公司', 'Bluebrook Printworks'],
  ['致远物流有限公司', 'Horizon Logistics'],
  ['原点设计咨询有限公司', 'Origin Design Studio'],
] as const;
const devices = [
  ['研发工作站', 'Engineering Workstation'],
  ['商务笔记本', 'Business Laptop'],
  ['会议显示屏', 'Conference Display'],
  ['便携投影仪', 'Portable Projector'],
  ['办公打印机', 'Office Printer'],
  ['视频会议终端', 'Video Conference Kit'],
] as const;

/** Business-owned resource writers, with deterministic request keys and no global seeds. */
export async function richResources(
  app: Application,
  f: TrialFacts,
  checkpoint: (row: ScenarioResult) => Promise<void>,
) {
  const scope = currentDemo()!,
    en = scope.locale === 'en-US',
    db = app.container.resolve(databaseManagerToken);
  const text = (pair: readonly [string, string]) => pair[en ? 1 : 0];
  const inbox =
    app.config.get<NotificationConfig>('notification')?.channels['demo-inbox'];
  if (inbox?.provider === 'in-app' && inbox.enabled !== false) {
    const recipients = Object.values(f.users).filter(
      (id) => id !== f.users.system,
    );
    if (recipients.some((id) => !scope.users.has(id)))
      throw new Error('DEMO_NOTIFICATION_RECIPIENT_INVALID');
    await app.container.resolve(notificationServiceToken).send({
      idempotencyKey: `${scope.id}-welcome-inbox`,
      source: { type: 'oa.demoData', referenceId: scope.id },
      messages: {
        'demo-inbox': {
          to: recipients,
          title: en ? 'Welcome to Northstar Systems' : '欢迎加入星澜科技',
          body: en
            ? 'Your team handbook, assigned work and approval requests are ready. Open the knowledge center for office, travel and finance guidance, then check the task center for your responsibilities.'
            : '团队手册、协作任务和审批事项已准备就绪。请先在知识库了解办公、差旅与财务规范，再到任务中心查看当前角色的职责和待办。',
          target: { type: 'route', path: '/knowledge' },
        },
      },
    });
  }

  for (let i = 0; i < 7; i++) {
    const title = `${text(topics[i])} · ${scope.baseDate}`;
    const row = await db.transaction(async (tx) => {
      const existing = await tx
        .repository<Announcement>('announcements')
        .findOne({ filter: { title, publisherUserId: f.users.admin } });
      if (existing) return existing;
      const service = app.container.resolve(announcementServiceToken);
      let notice = await service.save(
        {
          actorId: f.users.admin,
          requestId: `${scope.id}-notice-${i}`,
          title,
          body: en
            ? `Please review the ${topics[i][1].toLowerCase()} handbook in the knowledge center. Department coordinators will answer questions during the weekly office session. Confirm receipt after reading and arrange any team handovers before the next review.`
            : `请阅读知识库中的《${topics[i][0]}》。各部门协调人将在每周办公答疑时统一解答问题。阅读后请确认收到，并在下次评审前完成涉及的团队交接。`,
          audience: {
            all: false,
            departmentIds: Object.values(f.departments),
            dutyRoleCodes: [],
          },
          requiresConfirmation: i < 3,
          pinned: i === 0,
          attachments: [],
          validFrom: f.instant(
            addDays(scope.baseDate, i === 6 ? 3 : -14 + i),
            '00:00',
          ),
          validUntil: f.instant(addDays(scope.baseDate, 60 + i), '23:59'),
        },
        tx,
        trustedPolicy,
        trustedPolicy,
      );
      notice = await service.act(
        {
          actorId: f.users.admin,
          requestId: `${scope.id}-notice-publish-${i}`,
          id: notice.id,
          expectedVersion: notice.version,
          action: 'publish',
        },
        tx,
        trustedPolicy,
        trustedPolicy,
      );
      if (i === 0)
        await service.confirm(
          {
            actorId: f.users.employee,
            requestId: `${scope.id}-notice-received`,
            id: notice.id,
          },
          tx,
          trustedPolicy,
        );
      if (i === 5)
        notice = await service.act(
          {
            actorId: f.users.admin,
            requestId: `${scope.id}-notice-revoke`,
            id: notice.id,
            expectedVersion: notice.version,
            action: 'revoke',
          },
          tx,
          trustedPolicy,
          trustedPolicy,
        );
      return notice;
    });
    await checkpoint({
      key: `notice-${i}`,
      title,
      path: '/announcements',
      id: String(row.id),
      status: String(row.status),
      actor: 'admin',
    });
  }
  const delegation = await db.transaction(async (tx) => {
    const previous = await tx
      .repository<ApprovalDelegation>('approvalDelegations')
      .findOne({ filter: { principalId: f.users.manager } });
    return (
      previous ??
      app.container
        .resolve(approvalDirectoryServiceToken)
        .createManualDelegation(
          {
            principalId: f.users.manager,
            delegateId: f.users.head,
            scope: 'all',
            from: f.instant(addDays(scope.baseDate, 14), '09:00'),
            to: f.instant(addDays(scope.baseDate, 21), '18:00'),
          },
          { actorId: f.users.system, connection: tx },
        )
    );
  });
  await checkpoint({
    key: 'planned-delegation',
    title: en
      ? 'Planned manager cover during the delivery workshop'
      : '交付研讨期间的主管审批代理安排',
    path: '/approvalDelegations',
    id: String(delegation.id),
    status: 'active',
    actor: 'manager',
  });

  await db.transaction(async (tx) => {
    const service = app.container.resolve(vendorServiceToken);
    for (let i = 1; i < vendors.length; i++) {
      const code = `${scope.id}-vendor-${i}`;
      if (!(await tx.repository('vendors').exists({ filter: { code } })))
        await service.create(
          {
            actorId: f.users.purchasing,
            reason: en ? 'Approved supplier master data' : '供应商基础资料',
            code,
            name: text(vendors[i]),
            category: f.dictionary.supplierCategory,
            contactName: (en
              ? ['Alex Morgan', 'Jamie Lee', 'Robin Ellis']
              : ['顾晓宁', '沈嘉禾', '邵文清'])[i % 3],
            contactPhone: '00000000000',
            contactEmail: `supplier${i}.${scope.id.slice(-8)}@example.test`,
            bankName: en ? 'Demo Bank — no payments' : '演示银行（不可支付）',
            bankAccount: '0000000000000000',
            bankAccountName: en
              ? 'Fictional demonstration account'
              : '虚构演示账户',
          },
          tx,
        );
    }
    for (let i = 8; i < 30; i++) {
      const code = `${scope.id}-asset-${i + 1}`;
      const existing = await tx
        .repository<Asset>('assets')
        .findOne({ filter: { code } });
      const row =
        existing ??
        (await app.container.resolve(assetServiceToken).create(
          {
            actorId: f.users.admin,
            reason: en ? 'Workplace equipment register' : '办公设备入库',
            code,
            category: f.dictionary.assetCategory,
            name: `${text(devices[i % devices.length])} ${String(i + 1).padStart(2, '0')}`,
            serialNumber: `DEMO-${scope.id.slice(-8)}-${i + 1}`,
            originalValueCents: [
              680000, 920000, 240000, 360000, 480000, 1250000,
            ][i % 6],
          },
          tx,
        ));
      if (!f.assetIds.includes(String(row.id))) f.assetIds.push(String(row.id));
    }
  });
  const people = employeeModuleService(
    app.container.resolve(employeeServiceToken),
  );
  for (const person of getTrialAccounts().filter((p) => p.key !== 'system')) {
    const employee = await people.getByUserId(f.users[person.key]);
    if (!employee?.careerStartDate) throw new Error('DEMO_CAREER_DATE_MISSING');
    const profile = await people.getProfile(employee.id, true);
    if (!profile?.education)
      await people.updateProfile(
        employee.id,
        {
          birthDate: addDays(employee.careerStartDate, -22 * 365),
          address: en ? 'Northstar Campus, Building 2' : '星澜科技园区2号楼',
          education: en ? "Bachelor's degree" : '本科',
          school: en
            ? 'Northstar Institute (fictional)'
            : '星澜理工学院（虚构）',
          major: en ? 'Business Administration' : '工商管理',
          bankName: en ? 'Demo Bank — no payments' : '演示银行（不可支付）',
          bankAccount: '0000000000000000',
          bankAccountName: person.name,
        },
        trustedPolicy,
        f.users.hr,
      );
  }
  const calendar = app.container.resolve(personalScheduleServiceToken);
  for (const person of getTrialAccounts().filter((p) => p.key !== 'system')) {
    await db.transaction(async (tx) => {
      for (const [offset, hour, title] of [
        [0, '10:00', en ? 'Daily delivery check-in' : '每日交付进展沟通'],
        [1, '15:00', en ? 'Customer workshop preparation' : '客户研讨准备'],
        [-3, '14:00', en ? 'Team retrospective' : '团队阶段复盘'],
      ] as const) {
        const day = addDays(scope.baseDate, offset);
        const name = `${title} · ${person.name}`;
        if (
          !(await tx.repository('personalSchedules').exists({
            filter: { ownerUserId: f.users[person.key], title: name },
          }))
        )
          await calendar.create(
            {
              title: name,
              description: en
                ? 'Review the milestone, outstanding questions and agreed next steps.'
                : '回顾本期里程碑、未决事项和已约定的后续工作。',
              startAt: f.instant(day, hour),
              endAt: f.instant(day, hour.slice(0, 2) + ':30'),
            },
            f.users[person.key],
            tx,
            trustedPolicy,
          );
      }
    });
  }
  const knowledge = app.container.resolve(knowledgeServiceToken);
  const folder = await db.transaction(async (tx) => {
    const title = en ? 'Company handbook' : '公司手册';
    const existing = await tx
      .repository<KnowledgeFolder>('knowledgeFolders')
      .findOne({ filter: { title } });
    // Never adopt an unrelated folder with the same readable title.
    const own =
      existing &&
      (await tx.repository('demoDataRecords').exists({
        filter: {
          datasetId: scope.id,
          collection: 'knowledgeFolders',
          keyHash: (await import('./ownership.js')).hashKey({
            id: existing.id,
          }),
        },
      }));
    if (own) return { id: String(existing.id) };
    return knowledge.saveFolder(
      {
        actorId: f.users.hr,
        requestKey: `${scope.id}-handbook`,
        parentId: null,
        title,
      },
      tx,
      trustedPolicy,
    );
  });
  for (let i = 0; i < topics.length; i++) {
    const doc = await db.transaction((tx) =>
      knowledge.save(
        {
          actorId: f.users.hr,
          requestKey: `${scope.id}-handbook-${i}`,
          title: text(topics[i]),
          folderId: folder.id,
          departmentIds: Object.values(f.departments),
          dutyRoleCodes: [],
          kind: 'markdown',
          markdown: en
            ? `# ${text(topics[i])}\n\nA practical guide for the Northstar Systems team.\n\n## Before you begin\nCheck the project owner, budget and planned dates. Keep supporting documents with the request.\n\n## How work moves forward\n1. Prepare the request and explain the business purpose.\n2. Ask your manager to review its impact on the team.\n3. Finance and workplace specialists complete their assigned steps.\n4. Record the outcome and share lessons with the project team.\n\n## Need help?\nContact your department coordinator. All identities and transactions in this dataset are fictional.`
            : `# ${text(topics[i])}\n\n适用于星澜科技各部门的日常工作。\n\n## 开始前\n确认项目负责人、预算和计划日期，将依据材料与申请一起保存。\n\n## 办理步骤\n1. 准备申请并说明具体业务目的。\n2. 由直属主管评估对团队安排的影响。\n3. 财务或行政按职责完成各自的核对与办理。\n4. 登记办理结果，将经验补充到项目复盘。\n\n## 获取帮助\n请联系部门协调人。本数据集中的人员、公司与交易均为虚构。`,
        },
        tx,
        trustedPolicy,
        trustedPolicy,
        trustedPolicy,
      ),
    );
    await checkpoint({
      key: `handbook-${i}`,
      title: text(topics[i]),
      path: '/knowledge',
      id: doc.id,
      status: 'active',
      actor: 'hr',
    });
  }
  const work = app.container.resolve(workItemServiceToken);
  let index = 0;
  for (const person of getTrialAccounts().filter((p) => p.key !== 'system')) {
    const i = index++;
    const item = await db.transaction(async (tx) => {
      const old = await tx.repository<WorkItem>('workItems').findOne({
        filter: {
          creatorUserId: f.users.manager,
          title: `${text(topics[i % topics.length])} · ${person.name}`,
        },
      });
      if (old) return old;
      let task = await work.save(
        {
          actorId: f.users.manager,
          requestId: `${scope.id}-delivery-${i}`,
          title: `${text(topics[i % topics.length])} · ${person.name}`,
          description: en
            ? 'Review the supporting documents and record the readiness of your part of the Riverside delivery.'
            : '核对依据材料，登记本人负责的海川客户交付准备情况。',
          targetUserId: f.users[person.key],
          dutyRoleCode: null,
          dueAt: f.instant(addDays(scope.baseDate, 3 + (i % 14)), '17:00'),
          requiresConfirmation: true,
          attachments: [],
        },
        tx,
        trustedPolicy,
      );
      const act = async (
        action: 'dispatch' | 'complete' | 'confirm' | 'block',
        actorId: string,
      ) => {
        task = await work.act(
          {
            id: task.id,
            expectedVersion: task.version,
            actorId,
            requestId: `${scope.id}-delivery-${i}-${action}`,
            action,
            result: en
              ? 'Checklist reviewed and supporting documents filed.'
              : '检查清单已核对，依据材料已归档。',
            reason: en
              ? 'Waiting for the updated supplier document.'
              : '等待供应商补充更新后的资料。',
          },
          tx,
          trustedPolicy,
        );
      };
      if (i % 5 !== 0) await act('dispatch', f.users.manager);
      if (i % 5 === 2 || i % 5 === 3)
        await act('complete', f.users[person.key]);
      if (i % 5 === 3) await act('confirm', f.users.manager);
      if (i % 5 === 4) await act('block', f.users[person.key]);
      return task;
    });
    await checkpoint({
      key: `delivery-${i}`,
      title: en ? 'Delivery readiness' : '交付准备',
      path: '/workItems',
      id: String(item.id),
      status: String(item.status),
      actor: person.key,
    });
  }
  const inputs: AttendanceIngestInput[] = [];
  for (const role of [
    'employee',
    'employee2',
    'sales',
    'manager',
    'head',
    'finance',
  ] as const) {
    let days = 0;
    for (let offset = 1; days < 60; offset++) {
      const date = addDays(scope.baseDate, -offset),
        weekday = new Date(`${date}T12:00:00Z`).getUTCDay();
      if (weekday === 0 || weekday === 6) continue;
      days++;
      for (const punchKind of ['in', 'out'] as const) {
        const time =
          punchKind === 'out' ? '18:05' : days % 17 === 0 ? '09:26' : '08:53';
        inputs.push({
          userId: f.users[role],
          date,
          punchKind,
          punchedAt:
            days % 29 === 0 && punchKind === 'out'
              ? null
              : f.instant(date, time),
          source: scope.id,
          sourceKey: `${scope.id}-${role}-${date}-${punchKind}`,
          sourceData: {
            fictional: true,
            device: en ? 'Reception card reader' : '前台考勤机',
          },
        });
      }
    }
  }
  const shift = await db
    .repository<ShiftPointer>('attendanceShifts')
    .findOne({ filter: { code: `${scope.id}-shift` } });
  const revision =
    shift &&
    (await db.repository<ShiftRevision>('attendanceShiftRevisions').findOne({
      filter: {
        shiftId: String(shift.id),
        revision: Number(shift.currentRevision),
      },
    }));
  if (!revision) throw new Error('DEMO_SHIFT_MISSING');
  const dates = [...new Set(inputs.map((p) => p.date))];
  const schedule = app.container.resolve(attendanceManagementServiceToken);
  for (const date of dates)
    await db.transaction(async (tx) => {
      for (const key of ['engineering', 'sales', 'finance']) {
        const departmentId = f.departments[key];
        if (
          !(await tx.repository('attendanceSchedules').exists({
            filter: (f) =>
              f.and([
                f.string('departmentId').eq(departmentId),
                f.date('date').on(date),
              ]),
          }))
        )
          await schedule.saveSchedule(
            {
              departmentId,
              date,
              shiftRevisionId: String(revision.id),
              restDay: false,
              expectedVersion: null,
              actorId: f.users.hr,
              reason: en ? 'Standard weekday team roster' : '工作日团队排班',
            },
            tx,
          );
      }
    });
  for (let i = 0; i < inputs.length; i += 60)
    await app.container
      .resolve(attendanceServiceToken)
      .ingestBatch(inputs.slice(i, i + 60), { actorId: f.users.hr });
  const evaluation = app.container.resolve(attendanceEvaluationServiceToken);
  for (const input of inputs.filter((p) => p.punchKind === 'in'))
    await evaluation.evaluate({
      userId: input.userId,
      date: input.date,
      actorId: f.users.hr,
      requestKey: `${scope.id}-evaluation-${input.userId}-${input.date}`,
      reason: en ? 'Daily attendance reconciliation' : '每日考勤核对',
    });
}
