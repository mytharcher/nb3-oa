import { defineSeed } from '@nocobase/db';
import { encodeAuthorizationTitle } from '@nocobase/authorization/core';
import { definePermissionSet } from '@nocobase/authorization/permission-sets';
export default defineSeed({name:'202610250602_wecom_attendance_permissions',async run({query}){
 const key='oa-wecom-attendance-hr';
 if(await query.selectFrom('authorizationPermissionSets').select('id').where('key','=',key).executeTakeFirst())return;
 const set=definePermissionSet(key).title({key:'wecomAttendance.title',ns:'nb3-oa'}).grant({resource:{type:'settings',id:'oa.wecomAttendance'},actions:[{action:'view'},{action:'sync'}]}).build();
 const now=new Date();
 await query.insertInto('authorizationPermissionSets').values({id:key,key,title:encodeAuthorizationTitle(set.title??key),grants:JSON.stringify(set.grants),createdAt:now,updatedAt:now}).execute();
 await query.insertInto('authorizationPermissionSetAssignments').values({id:`org.dutyRole:hr:${key}`,permissionSetKey:key,subjectType:'org.dutyRole',subjectId:'hr',createdAt:now,updatedAt:now}).execute();
}});
