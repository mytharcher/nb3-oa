export default {
  meetingRooms: {
    authz: {
      title: 'Meeting rooms',
      bookings: 'Meeting bookings',
      view: 'View',
      manage: 'Manage meeting rooms',
      create: 'Book a room',
      edit: 'Edit bookings',
      cancel: 'Cancel bookings',
      confirm: 'Confirm administrative requests',
      reject: 'Reject administrative requests',
      checkIn: 'Check in',
      owned: 'Organized by me',
      participating: 'Meetings I attend',
      readable: 'Meetings I organize or attend',
    },
    notifications: {
      title: 'Meeting booking update',
      body: 'A meeting booking involving you has changed. Open your meeting bookings to review the details you can access.',
    },
    errors: {
      SORT_LIMIT_EXCEEDED:
        'Too many matching records. Narrow the search before sorting by name.',
      ACCESS_DENIED:
        'This operation or its fields are outside your permission.',
      ACTIVE_EMPLOYEE_REQUIRED: 'An active employee archive is required.',
      BOOKING_NOT_FOUND: 'The booking is unavailable.',
      CAPACITY_EXCEEDED: 'The organizer and attendees exceed room capacity.',
      COMMAND_CONFLICT:
        'This request identifier belongs to another operation or actor.',
      INVALID_BOOKING: 'Enter a title and distinct active attendees.',
      INVALID_INTERVAL: 'Choose a future interval ending after its start.',
      INVALID_PARTICIPANT: 'All attendees must be active employees.',
      INVALID_RECURRENCE:
        'Choose a daily or weekly series of 1 to 52 occurrences.',
      INVALID_REQUEST_ID: 'A request identifier is required.',
      INVALID_ROOM: 'Enter a room name, capacity and change reason.',
      INVALID_SERIES: 'Choose an existing series.',
      INVALID_STATE:
        'This booking cannot perform this operation in its current state or time interval.',
      REASON_REQUIRED: 'Enter a reason for this administrative decision.',
      ROOM_INACTIVE: 'This room is inactive.',
      ROOM_NOT_FOUND: 'This room is unavailable.',
      TIME_CONFLICT:
        'One or more requested intervals conflict with an occupied interval.',
      VERSION_CONFLICT:
        'The booking or room changed. Refresh it before trying again.',
      INVALID_LOCAL_TIME: 'Enter a valid company local date and time.',
      NONEXISTENT_LOCAL_TIME:
        'This local time does not exist due to a time zone change. Choose another time.',
      AMBIGUOUS_LOCAL_TIME:
        'This local time occurs twice due to a time zone change. Choose an unambiguous time.',
    },
  },
};
