import { z } from 'zod';
import type { DatabaseConnection } from '@nocobase/db';
import type { EmployeeService } from '../employees/contract.js';
import type { DictionaryService, CalendarService } from '../platform/index.js';
import type { AssetService } from '../assets/contract.js';
import type { OaApprovalDirectory } from '../approval-directory/contract.js';
import { AssetError } from '../assets/errors.js';
import type { AssetRequestRecord } from './contract.js';
export const assetRequestInputSchema = z
  .object({
    operation: z.enum(['use', 'borrow', 'scrap']),
    category: z.string().min(1).max(64).nullable(),
    assetIds: z.array(z.string().min(1).max(64)).max(100),
    quantity: z.number().int().min(1).max(100),
    purpose: z.string().trim().max(2000),
    borrowDueDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .nullable(),
    scrapReason: z.string().trim().max(2000),
    photos: z.array(z.string().min(1).max(64)).max(10),
  })
  .strict();
export const assetUnitsSchema = z
  .array(
    z
      .object({
        assetId: z.string().min(1).max(64),
        serialNumber: z.string().trim().min(1).max(200),
      })
      .strict(),
  )
  .min(1)
  .max(100);
export async function validateAssetSubmission(
  record: AssetRequestRecord,
  d: {
    employees: EmployeeService;
    dictionaries: DictionaryService;
    calendar: CalendarService;
    assets: AssetService;
  },
  directory: OaApprovalDirectory,
  tx: DatabaseConnection,
  now: Date,
) {
  const input = assetRequestInputSchema.parse(
    Object.fromEntries(
      Object.keys(assetRequestInputSchema.shape).map((key) => [
        key,
        record[key],
      ]),
    ),
  );
  const employee = await d.employees.getByUserId(record.applicantId, tx);
  if (!employee?.active || !['probation', 'regular'].includes(employee.status))
    throw new AssetError(
      'ASSET_EMPLOYEE_INACTIVE',
      'An active employee archive is required.',
    );
  if (
    !input.purpose ||
    new Set(input.assetIds).size !== input.assetIds.length ||
    (input.assetIds.length && input.assetIds.length !== input.quantity) ||
    new Set(input.photos).size !== input.photos.length
  )
    throw new AssetError(
      'ASSET_REQUIRED_FIELDS',
      'Provide a purpose and distinct actual assets matching the quantity.',
    );
  let administrativeScrap = false;
  if (input.operation === 'scrap') {
    if (
      input.quantity !== 1 ||
      input.assetIds.length !== 1 ||
      !input.scrapReason ||
      !input.photos.length
    )
      throw new AssetError(
        'ASSET_SCRAP_REQUIRED',
        'Choose one actual asset, explain its condition and attach a photo.',
      );
    const asset = await d.assets.get(input.assetIds[0], tx);
    administrativeScrap = directory.hasRole(record.applicantId, 'admin');
    if (
      !asset ||
      !['available', 'assigned'].includes(asset.status) ||
      (asset.status === 'assigned' && asset.holderEmployeeId !== employee.id) ||
      (asset.status === 'available' && !administrativeScrap)
    )
      throw new AssetError(
        'ASSET_SCRAP_INELIGIBLE',
        'Choose an eligible asset in your custody or administrative inventory.',
      );
  } else {
    if (
      !input.category ||
      !(await d.dictionaries.get('assetCategory', input.category, tx))?.active
    )
      throw new AssetError(
        'ASSET_CATEGORY_INACTIVE',
        'Choose an active asset category.',
      );
  }
  if (input.operation === 'borrow') {
    const date = input.borrowDueDate;
    if (
      !date ||
      !Number.isFinite(Date.parse(`${date}T00:00:00Z`)) ||
      new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) !== date ||
      date <= d.calendar.localDate(now)
    )
      throw new AssetError(
        'ASSET_BORROW_DATE_INVALID',
        'Choose a valid future company-local return date.',
      );
  } else if (input.borrowDueDate !== null)
    throw new AssetError(
      'ASSET_BORROW_DATE_INVALID',
      'A return date belongs only to a borrowing request.',
    );
  return { employee, administrativeScrap };
}
