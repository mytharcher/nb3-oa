import { defineMigration, type MigrationDefinition } from '@nocobase/db';

/**
 * Creates the employee archive of the `employees` OA module:
 *
 * - `employees`: one archive per authentication user (`userId` unique), with the HR-maintained reporting line
 *   (`managerId` is the employee id of the direct manager). There is deliberately no department column: the primary
 *   department lives only in `departmentMembers` and is read through the organisation service.
 * - `employeeProfiles`: the controlled data (identity document, address, education, bank account), one row per
 *   employee, readable only by HR, the employee and, for the bank fields, finance.
 * - `employeeCompensation`: append-only salary rows, one per regularisation or salary change.
 * - `employeeHistory`: append-only change records written by the approval flows' exits and by data corrections.
 */
const migration: MigrationDefinition = defineMigration({
  name: '202610100401_create_employees',

  async up({ builder }) {
    await builder.createCollection('employees', (collection) => {
      collection.string('id', { length: 64, nullable: false });
      collection.string('userId', { length: 64, nullable: false });
      collection.string('code', { length: 64, nullable: false });
      collection.string('name', { length: 128, nullable: false });
      collection.string('managerId', { length: 64, nullable: true });
      collection.string('positionId', { length: 64, nullable: true });
      collection.string('gradeId', { length: 64, nullable: true });
      collection.date('hireDate', { nullable: true });
      collection.date('probationEndDate', { nullable: true });
      collection.string('status', {
        length: 16,
        nullable: false,
        defaultValue: 'probation',
      });
      collection.date('lastWorkingDay', { nullable: true });
      collection.string('phone', { length: 32, nullable: true });
      collection.string('email', { length: 255, nullable: true });
      collection.string('workLocation', { length: 128, nullable: true });
      collection.string('emergencyContact', { length: 255, nullable: true });
      collection.boolean('active', { nullable: false, defaultValue: true });
      collection.datetimeTz('createdAt', { nullable: false });
      collection.datetimeTz('updatedAt', { nullable: false });
      collection.primary('id');
      collection.unique('userId', { name: 'uq_employees_user' });
      collection.unique('code', { name: 'uq_employees_code' });
      collection.index('managerId', { name: 'idx_employees_manager' });
      collection.index('positionId', { name: 'idx_employees_position' });
      collection.index('status', { name: 'idx_employees_status' });
    });

    await builder.createCollection('employeeProfiles', (collection) => {
      collection.string('employeeId', { length: 64, nullable: false });
      collection.string('idType', { length: 32, nullable: true });
      collection.string('idNumber', { length: 64, nullable: true });
      collection.date('birthDate', { nullable: true });
      collection.text('address', { nullable: true });
      collection.string('education', { length: 32, nullable: true });
      collection.string('school', { length: 128, nullable: true });
      collection.string('major', { length: 128, nullable: true });
      collection.string('bankName', { length: 128, nullable: true });
      collection.string('bankAccount', { length: 64, nullable: true });
      collection.string('bankAccountName', { length: 128, nullable: true });
      collection.datetimeTz('updatedAt', { nullable: false });
      collection.primary('employeeId');
    });

    await builder.createCollection('employeeCompensation', (collection) => {
      collection.increments('id');
      collection.string('employeeId', { length: 64, nullable: false });
      collection.string('gradeId', { length: 64, nullable: true });
      collection.decimal('baseSalary', {
        precision: 14,
        scale: 2,
        nullable: false,
      });
      collection.date('effectiveFrom', { nullable: false });
      collection.string('sourceApplication', { length: 128, nullable: true });
      collection.text('note', { nullable: true });
      collection.string('createdById', { length: 64, nullable: true });
      collection.datetimeTz('createdAt', { nullable: false });
      collection.index(['employeeId', 'effectiveFrom'], {
        name: 'idx_employee_compensation_employee',
      });
    });

    await builder.createCollection('employeeHistory', (collection) => {
      collection.increments('id');
      collection.string('employeeId', { length: 64, nullable: false });
      collection.string('kind', { length: 32, nullable: false });
      collection.json('before', { nullable: true });
      collection.json('after', { nullable: true });
      collection.date('effectiveAt', { nullable: false });
      collection.string('sourceApplication', { length: 128, nullable: true });
      collection.text('note', { nullable: true });
      collection.string('createdById', { length: 64, nullable: true });
      collection.datetimeTz('createdAt', { nullable: false });
      collection.index(['employeeId', 'effectiveAt'], {
        name: 'idx_employee_history_employee',
      });
    });
  },

  async down({ builder }) {
    await builder.dropCollection('employeeHistory');
    await builder.dropCollection('employeeCompensation');
    await builder.dropCollection('employeeProfiles');
    await builder.dropCollection('employees');
  },
});

export default migration;
