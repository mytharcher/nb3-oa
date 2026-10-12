import { z } from 'zod';
export const Params = z.strictObject({ id: z.string().min(1).max(64) });
export const VehicleInput = z.strictObject({
  purpose: z.string().trim().min(1).max(5000),
  destination: z.string().trim().min(1).max(5000),
  startAt: z.iso.datetime({ offset: true }),
  endAt: z.iso.datetime({ offset: true }),
  passengers: z.number().int().min(1).max(100000),
  needsDriver: z.boolean(),
});
export const CreateInput = VehicleInput.extend({
  requestId: z.string().min(1).max(128).optional(),
});
export const Transition = z.discriminatedUnion('transition', [
  z.strictObject({
    transition: z.literal('edit'),
    version: z.number().int().nonnegative(),
    requestId: z.string().min(1).max(128),
    input: VehicleInput,
  }),
  ...(['submit', 'withdraw'] as const).map((transition) =>
    z.strictObject({
      transition: z.literal(transition),
      version: z.number().int().nonnegative(),
      requestId: z.string().min(1).max(128),
    }),
  ),
  z.strictObject({
    transition: z.literal('terminate'),
    version: z.number().int().nonnegative(),
    requestId: z.string().min(1).max(128),
    input: z.strictObject({ reason: z.string().trim().min(1).max(5000) }),
  }),
]);
const Base = {
  target: z.strictObject({ taskId: z.string().min(1).max(64) }),
  contentHash: z.string().min(1).max(128),
  requestId: z.string().min(1).max(128),
};
export const Action = z.discriminatedUnion('action', [
  z.strictObject({
    ...Base,
    action: z.literal('complete'),
    privateInput: z.strictObject({
      vehicleId: z.string().min(1).max(64),
      driverId: z.string().min(1).max(64).nullable(),
    }),
  }),
  z.strictObject({
    ...Base,
    action: z.literal('registerUsage'),
    privateInput: z.strictObject({
      mileage: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
      fuelCents: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
      exception: z.string().max(5000),
    }),
  }),
  ...(
    [
      'approve',
      'reject',
      'return',
      'claim',
      'release',
      'comment',
      'unable',
    ] as const
  ).map((action) =>
    z.strictObject({
      ...Base,
      action: z.literal(action),
      comment: z.string().max(5000).optional(),
      input: z.strictObject({ to: z.literal('revision') }).optional(),
    }),
  ),
]);
export const Query = z.strictObject({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export const Vehicle = z.strictObject({
  plateNumber: z.string().trim().min(1).max(64),
  name: z.string().trim().min(1).max(200),
  vehicleType: z.string().min(1).max(64),
  capacity: z.number().int().min(1).max(100000),
  status: z.enum(['active', 'inactive', 'maintenance']),
  reason: z.string().trim().min(1).max(5000),
});
export const VehicleUpdate = Vehicle.extend({
  version: z.number().int().min(1),
});
export const Driver = z.strictObject({
  version: z.number().int().min(0).optional(),
  employeeId: z.string().min(1).max(64),
  active: z.boolean(),
  reason: z.string().trim().min(1).max(5000),
});
export const Record = VehicleInput.extend({
  id: z.string(),
  applicantId: z.string(),
  createdById: z.string(),
  number: z.string().nullable(),
  approvedFingerprint: z.string().nullable(),
  approvedAt: z.string().nullable(),
  ruleSnapshot: z.record(z.string(), z.json()).nullable(),
  managerApproverId: z.string().nullable(),
  status: z.string(),
  lifecycleVersion: z.number(),
  statusChangedAt: z.string(),
  createdAt: z.string(),
});
export const Json = z.record(z.string(), z.json());
export const VehicleRecord = Vehicle.omit({ reason: true }).extend({
  id: z.string(),
  version: z.number().int(),
});
export const DriverRecord = Driver.omit({ reason: true, version: true }).extend(
  {
    id: z.string(),
    version: z.number().int(),
  },
);
export const List = z.strictObject({
  items: z.array(Record.partial()),
  total: z.number().int(),
});
export const GarageList = z.strictObject({
  items: z.array(VehicleRecord.partial()),
});
export const Candidates = z.strictObject({
  vehicles: z.array(VehicleRecord),
  drivers: z.array(DriverRecord),
});
export const Cost = z.strictObject({
  id: z.string(),
  fuelCents: z.number().int().nonnegative(),
});
export const Result = z.strictObject({
  record: Record,
  entry: z.json(),
  effectRuns: z.array(z.json()),
  replayed: z.boolean().optional(),
});
export const Detail = z.strictObject({
  record: Record,
  users: z.array(z.strictObject({ id: z.string(), name: z.string() })),
  timeZone: z.string(),
  view: z.json(),
  runs: z.array(z.json()),
  taskActions: z.array(z.json()),
  runActions: z.json(),
  timeline: z.json(),
});
export const ActionResult = z.json();
