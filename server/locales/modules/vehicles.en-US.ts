export default {
  vehicles: {
    authz: {
      requests: 'Vehicle requests',
      garage: 'Vehicle garage',
      manage: 'Manage vehicle roster',
      viewCost: 'View private fuel cost',
    },
    errors: {
      VEHICLE_SORT_LIMIT: 'Narrow the search before sorting this many records.',
      VEHICLE_ACCESS_DENIED: 'Driver update is outside its granted policy.',
      VEHICLE_ALREADY_DISPATCHED:
        'This source already has an immutable dispatch fact.',
      VEHICLE_APPROVAL_REFUSED:
        'The vehicle operation is unavailable; refresh the request and check your permission.',
      VEHICLE_CONTENT_CHANGED:
        'Dispatch requires unchanged approved content and its private action payload.',
      VEHICLE_COST_NOT_FOUND: 'Usage cost is not readable.',
      VEHICLE_DISPATCH_NOT_OFFERED:
        'An actual allowed dispatch task is required.',
      VEHICLE_DRIVER_INACTIVE: 'The driver is not currently eligible.',
      VEHICLE_DRIVER_REQUIRED:
        'Driver selection must match the approved request.',
      VEHICLE_EMPLOYEE_INACTIVE: 'An active employee archive is required.',
      VEHICLE_FIELDS_RESTRICTED:
        'Complete nonfinancial request fields are required for the approval facade.',
      VEHICLE_GARAGE_DENIED:
        'An active administrative duty member is required.',
      VEHICLE_INTERVAL_CONFLICT:
        'The vehicle or driver is already dispatched in this interval.',
      VEHICLE_INVALID_COMMAND: 'A source and stable request key are required.',
      VEHICLE_INVALID_INPUT:
        'Provide vehicle identification, positive capacity and a valid status.',
      VEHICLE_INVALID_INTERVAL:
        'Provide an ordered time interval and positive passenger count.',
      VEHICLE_INVALID_USAGE:
        'Mileage and fuel must be exact nonnegative integers.',
      VEHICLE_INVALID_VERSION: 'The stored version cannot advance.',
      VEHICLE_NOT_DISPATCHED: 'No real dispatch exists for this application.',
      VEHICLE_NOT_FOUND: 'Vehicle or driver not found.',
      VEHICLE_NO_AVAILABLE_CAPACITY:
        'No current vehicle has sufficient capacity in this interval. Submission does not reserve it.',
      VEHICLE_OUTSTANDING_USE:
        'Complete actual use before disabling this driver.',
      VEHICLE_PRIVATE_INPUT_REQUIRED:
        'Business execution payloads must use the private facade.',
      VEHICLE_REQUEST_KEY_REQUIRED: 'A stable request key is required.',
      VEHICLE_REQUEST_REUSED:
        'This request key is bound to another actor or payload.',
      VEHICLE_SLA_UNSUPPORTED:
        'This release requires the default working-hour approval clocks.',
      VEHICLE_SOURCE_DENIED:
        'A real allowed approval operation in its transaction is required.',
      VEHICLE_SOURCE_MISMATCH:
        'The command does not match its approval source.',
      VEHICLE_SOURCE_UNAVAILABLE:
        'The real approval source adapter is unavailable.',
      VEHICLE_TARGET_MISMATCH: 'The action target belongs to another request.',
      VEHICLE_TYPE_INACTIVE: 'Choose an active vehicle type.',
      VEHICLE_UNAVAILABLE: 'Choose an active vehicle with enough capacity.',
      VEHICLE_USAGE_OWNER: 'Only the actual applicant may register usage.',
      VEHICLE_VERSION_CONFLICT: 'Load the current vehicle version.',
    },
  },
};
