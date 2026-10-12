import type { AppClientRouteDefinition } from '@nocobase/app-client/plugins';
/** Embed attendanceChange records under each approval-center tab so closing preserves its originating view. */
export function attendanceChangeViewChildren(
  owner: string,
): AppClientRouteDefinition[] {
  return [
    {
      name: `${owner}-attendanceChange-new`,
      path: 'newAttendanceChange',
      componentLoader: () =>
        import('../pages/attendance-change/form-dialog.js'),
    },
    {
      name: `${owner}-attendanceChange-edit`,
      path: 'editAttendanceChange/:requestId',
      componentLoader: () =>
        import('../pages/attendance-change/form-dialog.js'),
    },
    {
      name: `${owner}-attendanceChange-detail`,
      path: 'attendanceChange/:requestId',
      componentLoader: () => import('../pages/attendance-change/detail.js'),
      children: [
        {
          name: `${owner}-attendanceChange-detail-edit`,
          path: 'edit',
          componentLoader: () =>
            import('../pages/attendance-change/form-dialog.js'),
        },
        {
          name: `${owner}-attendanceChange-detail-action`,
          path: 'action/:actionName/:targetId',
          componentLoader: () =>
            import('../pages/attendance-change/action-dialog.js'),
        },
      ],
    },
  ];
}
