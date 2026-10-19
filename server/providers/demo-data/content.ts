import { currentDemo } from './context.js';
const english: Record<string, string> = {
  OA虚构试用数据初始化: 'Initialize fictional demo business data',
  '示例·管理中心': 'Executive Office',
  '示例·研发部': 'Engineering',
  '示例·销售部': 'Sales',
  '示例·人事部': 'People Operations',
  '示例·财务部': 'Finance',
  '示例·行政部': 'Workplace Operations',
  '示例·业务专员': 'Business Specialist',
  '示例·专业级': 'Professional II',
  '示例·高级专业级': 'Senior Professional',
  示例园区一楼: 'Northstar Campus, Level 1',
  示例园区: 'Northstar Campus',
  '示例·标准工作班次': 'Standard Office Hours',
  '示例·办公设备供应商（虚构）': 'Cedar Office Supply',
  示例联系人: 'Alex Morgan',
  '示例银行（不可支付）': 'Demo Bank — no payments',
  虚构试用账户: 'Fictional demonstration account',
  '示例·公务车': 'Client Services Shuttle',
  '示例·公章': 'Corporate Seal',
  '示例·董事会议室': 'Boardroom',
  '示例·团队会议室': 'Cedar Meeting Room',
  '投影、白板': 'Projector, whiteboard',
  '虚构试用数据：登录并查看待办。':
    'Review your assignments and upcoming appointments.',
  虚构试用薪资: 'Demonstration compensation record',
  请假: 'Leave',
  销假: 'Leave cancellation',
  加班: 'Overtime',
  '补卡／考勤更正': 'Attendance correction',
  外出: 'Off-site work',
  办公用品领用: 'Office supplies',
  通用申请: 'General request',
  证明开具: 'Employment certificates',
  培训: 'Training',
  费用事前申请: 'Expense authorization',
  出差: 'Business travel',
  出差撤销: 'Travel cancellation',
  报销: 'Reimbursement',
  '借款／还款': 'Loans and repayments',
  采购: 'Purchasing',
  付款: 'Payment',
  预算调整: 'Budget adjustment',
  转正: 'Probation review',
  合同: 'Contract',
  '合同变更／续签／终止': 'Contract changes, renewals and termination',
  用印: 'Seal request',
  供应商准入: 'Supplier qualification',
  '资产领用／借用／报废': 'Asset issue, loan and retirement',
  车辆: 'Vehicle booking',
  招聘: 'Recruitment',
  入职办理: 'Onboarding',
  离职交接: 'Departure handover',
  '转岗／调薪／晋升': 'Transfer, salary review and promotion',
  借款: 'Employee loan',
  '示例·客户公司（虚构）': 'Harbor Analytics',
  '示例付款条款，不发生实际支付':
    '30% on signing, 70% on acceptance. Demonstration only.',
  补卡: 'Attendance correction',
  虚构考勤说明: 'Card reader unavailable at the reception desk.',
  示例客户办公室: 'Harbor Analytics — Riverside office',
  '虚构示例：申请跨部门协作支持。':
    'Request engineering and sales support for the customer onboarding workshop.',
  在职证明: 'Employment verification',
  '示例·项目管理培训': 'Practical Project Delivery Workshop',
  示例培训机构: 'Brightpath Learning',
  示例城市: 'Singapore',
  示例独立报销: 'Customer workshop travel expenses',
  示例办公设备: 'Latitude Business Laptop',
  试用型号: 'Business 14',
  台: 'unit',
  '虚构试用付款：无事前审批示例':
    'Workshop venue deposit — independent payment request',
  虚构供应商合作案例:
    'Delivered 24 workstations for the Riverside office refurbishment.',
  '示例故障设备，上传照片后可提交':
    'Screen damage beyond economical repair; assessment photo attached.',
  示例客户园区: 'Harbor Analytics Campus',
  离职: 'Departure',
  '示例岗位：业务与技术协作':
    'Coordinate customer requirements and technical delivery.',
  虚构试用流程准备: 'Prepare demonstration workflow',
  '迁移旧示例职责，恢复当前试用单据负责人':
    'Restore the assigned demonstration reviewer',
  '旧示例唯一职责迁移后，为尚未初始化完成的试用节点指定当前负责人':
    'Assign the current role holder to the demonstration stage',
  '虚构示例：准备下一角色的试用待办':
    'Reviewed for the customer delivery milestone.',
  示例试用期评价:
    'Consistently meets delivery commitments and collaborates well with the team.',
  虚构示例银行资料: 'Fictional payment details for demonstration only',
  虚构入职试用数据: 'Onboarding for the customer success team',
  '示例·待入职员工': 'Taylor Parker',
  示例工位及电脑: 'Desk C12 and a business laptop',
  '虚构试用现金还款，等待借款人确认':
    'Cash repayment received; awaiting borrower confirmation.',
  还款待确认: 'Repayment awaiting confirmation',
  知识库: 'Knowledge base',
  '虚构试用通知：请登录各角色账号，查看待办、申请、台账及知识库，并确认收到本通知。':
    'The Riverside office opens this month. Review the facilities guide and acknowledge this announcement.',
  '公告／回执': 'Announcements and acknowledgements',
  '虚构任务：查看当前角色菜单和待办，完成一次操作后填写试用结果。':
    'Review the customer delivery checklist, confirm your responsibilities and record the outcome.',
  协同任务: 'Team work',
  打印模板: 'Print template',
  OA虚构试用编制数据补充: 'Initialize demonstration workforce capacity',
  '示例·待初始化岗位': 'Customer Success Associate',
  '·团队试用说明会': ' · Customer delivery kickoff',
  '·试用操作指南': ' · Workplace and delivery handbook',
  '·OA试用通知（需回执）': ' · Riverside office opening',
  操作练习: ' — Delivery readiness review',
  试用日程: ' — Project coordination',
  '示例·办公设备': 'Workplace equipment ',
  资产use: 'Asset issue',
  资产borrow: 'Asset loan',
  资产scrap: 'Asset retirement',
  '·标准': ' · Standard',
  '·': ' · ',
  示例员工: 'Demo employee',
  'OA虚构试用模板，仅用于功能演示。编号：':
    'Demonstration business document. Number: ',
  '# OA试用指南\\n\\n所有记录均为虚构数据。\\n\\n1. 普通员工在任务中心发起申请。\\n2. 主管、负责人和职能角色分别处理各自待办。\\n3. 财务金额和人事受控字段按已有权限显示。\\n4. 反复执行初始化会保留已经试用过的记录。':
    '# Workplace handbook\n\nWelcome to Northstar Systems.\n\n1. Prepare requests in the task center.\n2. Managers review delivery impact and team availability.\n3. Finance checks supporting documents before payment.\n4. Use team views to follow shared commitments.',
};
// Legacy guides stored escaped newlines; accept the equivalent real multiline text.
for (const [key, value] of Object.entries(english)) {
  if (key.includes('\\n')) english[key.replaceAll('\\n', '\n')] = value;
}
export const demoChineseNames = [
  '系统服务',
  '林致远',
  '周予安',
  '陈明远',
  '许知衡',
  '苏雨桐',
  '唐可欣',
  '陆晨曦',
  '顾子言',
  '沈清和',
  '梁若宁',
  '程思齐',
  '叶舒雅',
  '贺景行',
  '许书瑶',
  '温以宁',
  '宋嘉言',
  '何语晴',
  '邵亦辰',
  '方予彤',
  '郑南乔',
  '傅思源',
  '孟星河',
  '谢宛宁',
  '邱承泽',
  '夏梓萱',
  '罗启航',
] as const;
export const demoEnglishNames = [
  'Demo Operations',
  'James Whitmore',
  'Amelia Hayes',
  'Ethan Carter',
  'Daniel Brooks',
  'Sophie Turner',
  'Lucas Mitchell',
  'Chloe Foster',
  'Ryan Morgan',
  'Olivia Bennett',
  'Emma Wilson',
  'Noah Clarke',
  'Charlotte Evans',
  'Benjamin Scott',
  'Grace Collins',
  'Hannah Reed',
  'William Parker',
  'Lily Anderson',
  'Henry Walker',
  'Isabella Green',
  'Jack Robinson',
  'Ava Thompson',
  'Samuel Wright',
  'Mia Edwards',
  'Oliver Hughes',
  'Ella Cooper',
  'Leo Richardson',
] as const;
/** Content localization is independent of the viewer's interface language. */
export function demoText(text: string): string {
  const scope = currentDemo();
  if (!scope) return text;
  if (scope.locale === 'zh-CN') {
    return text
      .replaceAll(scope.id, '星澜科技')
      .replaceAll('示例·办公设备供应商（虚构）', '青杉办公设备有限公司')
      .replaceAll('示例·客户公司（虚构）', '海川数据科技有限公司')
      .replaceAll('示例·待入职员工', '江思远')
      .replaceAll('示例·', '')
      .replaceAll('示例园区', '星澜科技园区');
  }
  if (english[text]) return english[text];
  let result = text.replaceAll(scope.id, 'Northstar Systems');
  for (const [source, target] of Object.entries(english).sort(
    ([a], [b]) => b.length - a.length,
  ))
    result = result.replaceAll(source, target);
  if (/[\u3400-\u9fff]/u.test(result))
    throw new Error(`DEMO_CONTENT_TRANSLATION_MISSING:${text.slice(0, 140)}`);
  return result;
}

const scenarioDescriptions: Record<string, readonly [string, string]> = {
  'leave-draft': [
    '陪同家人就医的休假安排',
    'Leave for a family medical appointment',
  ],
  'leave-manager': ['参加孩子家长会', 'Leave for a school conference'],
  'leave-approved': [
    '年度休假与交接安排',
    'Annual leave and handover arrangements',
  ],
  'overtime-manager': [
    '海川项目发布前联调支持',
    'Riverside release integration support',
  ],
  'attendance-change': [
    '前台读卡器故障，申请补录上班记录',
    'Correct a missing punch after a card reader outage',
  ],
  'outing-head': [
    '赴海川客户现场核对交付需求',
    'Visit Harbor Analytics to review delivery requirements',
  ],
  'supply-head': [
    '新员工工位办公用品领用',
    'Office supplies for the new starter desks',
  ],
  'general-manager': [
    '申请跨部门客户交付支持',
    'Cross-team support for the customer delivery',
  ],
  'certificate-manager': [
    '租房办理所需在职证明',
    'Employment verification for a rental application',
  ],
  'seal-head': ['客户服务协议签署用印', 'Seal the customer service agreement'],
  'training-head': [
    '项目交付方法与风险管理培训',
    'Project delivery and risk management training',
  ],
  'expense-plan-head': [
    '客户工作坊会务费用事前申请',
    'Advance approval for the customer workshop',
  ],
  'expense-plan-gm': [
    '年度客户大会筹备预算',
    'Annual customer conference preparation budget',
  ],
  'travel-head': [
    '客户项目启动与现场调研',
    'Customer project kickoff and site discovery',
  ],
  'travel-approved': [
    '区域客户交付现场支持',
    'Regional customer delivery visit',
  ],
  'travel-cancellation': [
    '客户调整上线日期，取消原差旅安排',
    'Cancel travel after the customer reschedules the launch',
  ],
  'reimbursement-manager': [
    '客户工作坊交通与资料费报销',
    'Customer workshop transport and materials expenses',
  ],
  'purchase-head': [
    '研发及客户交付团队设备增购',
    'Additional equipment for engineering and delivery',
  ],
  'payment-finance': [
    '办公场地服务费付款申请',
    'Payment for workplace facility services',
  ],
  'budget-head': [
    '客户交付扩容所需预算调整',
    'Budget adjustment for customer delivery expansion',
  ],
  'budget-cfo': [
    '新增研发工位设备预算追加',
    'Additional equipment budget for engineering desks',
  ],
  'probation-manager': [
    '客户项目试用期工作成果评估',
    'Probation review based on customer delivery outcomes',
  ],
  'contract-review': [
    '海川数据平台年度服务协议',
    'Harbor Analytics annual platform services agreement',
  ],
  'contract-approved': [
    '企业客户交付及运维服务协议',
    'Enterprise delivery and managed services agreement',
  ],
  'qualification-review': [
    '办公设备采购供应商资质评审',
    'Qualification review for an office equipment supplier',
  ],
  'asset-use': [
    '新项目研发设备领用',
    'Equipment issue for the new engineering project',
  ],
  'asset-borrow': [
    '客户演示便携设备借用',
    'Portable equipment loan for a customer presentation',
  ],
  'asset-scrap': [
    '屏幕损坏设备报废评估',
    'Retirement assessment for a device with a damaged screen',
  ],
  'asset-issue': [
    '新员工工位设备发放',
    'Issue equipment for a new starter desk',
  ],
  'vehicle-head': [
    '客户园区现场沟通用车',
    'Transport for the customer campus visit',
  ],
  'vehicle-dispatch': [
    '客户交付团队接送安排',
    'Shuttle arrangements for the customer delivery team',
  ],
  'recruitment-review': [
    '客户交付团队增补岗位',
    'Additional capacity for the customer delivery team',
  ],
  'recruitment-approved': [
    '区域业务拓展岗位招聘',
    'Recruit a regional business development specialist',
  ],
  'departure-review': [
    '个人职业发展调整与工作交接',
    'Career change and responsibility handover',
  ],
  'transfer-review': [
    '客户交付骨干岗位晋升',
    'Promotion of a customer delivery specialist',
  ],
  'loan-head': [
    '客户现场工作差旅备用金',
    'Travel advance for work at the customer site',
  ],
  'loan-issued': ['项目交付现场支出备用金', 'Project delivery expense advance'],
};
export function demoMarker(key: string): string {
  const scope = currentDemo();
  if (!scope) return `oa-trial-v1·${key}`;
  const text = scenarioDescriptions[key] ?? [
    '项目交付相关业务安排',
    'Customer delivery coordination',
  ];
  // Short stable scene codes distinguish related examples without making internal
  // dataset UUIDs the visible titles of business records.
  let hash = 0;
  for (const char of key) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return `${text[scope.locale === 'en-US' ? 1 : 0]} (${hash.toString(36).slice(-4).toUpperCase()})`;
}
