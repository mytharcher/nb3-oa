// @vitest-environment node
import { it, expect, vi } from 'vitest';
vi.mock('../../../shared/external-integrations.js', () => ({
  externalIntegrationsEnabled: true,
}));
import { startOrgTestApp,json } from '../org/helpers.js';
it('protects source status and synchronization independently and exposes no credentials or identity mappings',async()=>{
 const app=await startOrgTestApp();
 try{
 const employee=await app.createUser('SourceEmployee'),hr=await app.createUser('SourceHR');
 await app.organization.addDutyRoleMember('hr',hr.user.id,{actorId:hr.user.id});
 const url='/attendanceManagement/wecomSource';
 expect((await app.testApp.request(url)).status).toBe(401);
 expect((await employee.fetch(url)).status).toBe(403);
 expect((await employee.fetch(`${url}/sync`,json({startDate:'2026-10-12',endDate:'2026-10-13',reason:'Synthetic',requestKey:'denied'}))).status).toBe(403);
 const response=await hr.fetch(url);expect(response.status).toBe(200);
 const data=(await response.json()).data;expect(data).toEqual({enabled:false,configured:false,mappedUsers:0,runs:[]});
 expect(JSON.stringify(data)).not.toMatch(/secret|corpId|wecomUserId|leaseToken/);
 const sync=await hr.fetch(`${url}/sync`,json({startDate:'2026-10-12',endDate:'2026-10-13',reason:'Synthetic',requestKey:'disabled'}));
 expect(sync.status).toBe(400);expect(JSON.stringify(await sync.json())).toContain('WECOM_DISABLED');
 const admin=await app.admin();const schedules=await admin.fetch('/scheduler/schedules');expect(schedules.status).toBe(200);expect(JSON.stringify(await schedules.json())).toContain('oa.attendance.wecom-source');
 }finally{await app.close();}
},120000);
