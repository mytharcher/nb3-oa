import { demoText } from '../../../../server/providers/demo-data/content.js';
import type { Application } from '@nocobase/app-server/application';
import { databaseManagerToken } from '@nocobase/db';
import { userAdministrationServiceToken } from '@nocobase/app-plugin-authentication';
import { auditServiceToken } from '../../../../server/providers/audit/index.js';
import {
  getTrialAccounts,
  trialEmail,
  trialUsername,
  type TrialRole,
} from './accounts.js';

// Fixed fictional names: full lowercase, toneless pinyin, including 示例;
// punctuation is omitted and the Latin IT label stays lowercase.
const pinyin: Record<TrialRole | 'newhire', string> = {
  system: 'shilixitongguanliyuan',
  gm: 'shilizongjingli',
  executive: 'shilifenguanlingdao',
  head: 'shiliyanfafuzeren',
  manager: 'shilizhishuzhuguan',
  employee: 'shiliputongyuangong',
  employee2: 'shilixiezuoyuangong',
  probation: 'shilishiyongyuangong',
  departing: 'shililizhishenqingren',
  sales: 'shilixiaoshoufuzeren',
  hr: 'shilirenshizhuanyuan',
  hrbp: 'shilirenshihuoban',
  hrDirector: 'shilirenshizongjian',
  finance: 'shiliduikoukuaiji',
  finance2: 'shilifuhekuaiji',
  financeManager: 'shilicaiwujingli',
  cfo: 'shilicaiwuzongjian',
  cashier: 'shilichuna',
  admin: 'shilixingzhengzhuanyuan',
  admin2: 'shilixingzhengfuhe',
  sealKeeper: 'shiliyinzhangbaoguanren',
  legal: 'shilifawu',
  purchasing: 'shilicaigouzhuanyuan',
  purchasing2: 'shilicaigoupingwei',
  it: 'shiliitzhuanyuan',
  committeeTech: 'shilijishupingwei',
  driver: 'shilijiashiyuan',
  newhire: 'shilidairuzhiyuangong',
};
export type TrialPasswords = Record<TrialRole | 'newhire', string>;
export const defaultTrialPasswords = (): TrialPasswords =>
  Object.fromEntries(
    Object.entries(pinyin).map(([key, value]) => [key, `${value}123456`]),
  ) as TrialPasswords;
export function passwordFor(
  passwords: string | TrialPasswords,
  role: TrialRole | 'newhire',
): string {
  return typeof passwords === 'string' ? passwords : passwords[role];
}

export async function resetTrialPasswords(
  app: Application,
  actorId: string,
  passwords: TrialPasswords,
): Promise<void> {
  const db = app.container.resolve(databaseManagerToken);
  const users = app.container.resolve(userAdministrationServiceToken);
  const audit = app.container.resolve(auditServiceToken);
  await db.transaction(async (tx) => {
    // Validate every identity first; never reset an unrelated account sharing an email.
    const targets = [];
    for (const role of Object.keys(passwords) as (TrialRole | 'newhire')[]) {
      const user = await tx
        .repository('user')
        .findOne({ filter: { email: trialEmail(role) } });
      if (!user) {
        if (role === 'newhire') continue;
        throw new Error(`Missing trial identity for ${role}.`);
      }
      const name =
        role === 'newhire'
          ? demoText('示例·待入职员工')
          : getTrialAccounts().find((p) => p.key === role)!.name;
      if (user.username !== trialUsername(role) || user.name !== name)
        throw new Error(
          `Trial identity collision for ${role}; password reset refused.`,
        );
      targets.push({ id: String(user.id), role });
    }
    for (const target of targets) {
      await users
        .withConnection(tx)
        .resetPassword(target.id, passwords[target.role]);
      await audit.record(
        {
          actorId,
          action: 'trialUser.resetPassword',
          targetType: 'user',
          targetId: target.id,
          reason: demoText('用户要求将示例账号密码改为完整姓名拼音规则'),
        },
        tx,
      );
    }
  });
}
