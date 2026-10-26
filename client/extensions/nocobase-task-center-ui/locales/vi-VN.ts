/**
 * The wording of the task-center-ui components' own chrome, under `taskCenterUi`. Everything the data says — sources,
 * subjects, titles, statuses, summaries and batch actions — arrives translated from the page; merge these into the
 * locale resources of the namespace that renders the components.
 */
const enUS = {
  taskCenterUi: {
    nav: {
      label: 'Nguồn tác vụ',
      search: 'Tìm loại tác vụ',
      noMatches: 'Không có loại tác vụ phù hợp',
      clearSearch: 'Xóa tìm kiếm',
      expand: 'Mở rộng {{name}}',
      collapse: 'Thu gọn {{name}}',
      subjects: 'Loại tác vụ của {{name}}',
      pending: '{{count}} cần làm',
    },
    tabs: {
      pending: 'Cần làm',
      closed: 'Hoàn tất',
      all: 'Tất cả',
    },
    groups: {
      today: 'Hôm nay',
      yesterday: 'Hôm qua',
      earlier: 'Trước đó',
    },
    time: {
      received: '{{time}}',
      closed: 'Đã đóng {{time}}',
    },
    selection: {
      select: 'Chọn "{{name}}"',
      lockedTask:
        '"{{name}}" không khả dụng: đã chọn {{type}}, chỉ có thể chọn cùng lúc tác vụ cùng loại',
      otherType: 'Đã chọn {{type}}; chỉ có thể chọn cùng lúc tác vụ cùng loại',
      unsupportedTask: '"{{name}}" không có thao tác hàng loạt',
      unsupported: 'Tác vụ loại này được xử lý từng mục',
    },
    bulk: {
      label: 'Thao tác hàng loạt',
      selected: 'Đã chọn {{count}}',
      clear: 'Bỏ lựa chọn',
      cancel: 'Hủy',
      skipped: '{{count}} tác vụ đã chọn khác không hỗ trợ và giữ nguyên.',
    },
    empty: {
      pending: {
        title: 'Đã xử lý hết',
        description: 'Không có gì đang chờ bạn ở đây.',
      },
      closed: {
        title: 'Chưa hoàn thành gì',
        description: 'Tác vụ bạn hoàn thành hoặc bị hủy hiển thị tại đây.',
      },
      all: {
        title: 'Không có tác vụ',
        description: 'Tác vụ loại này hiển thị tại đây khi đến lượt bạn.',
      },
      showAll: 'Hiện tất cả',
    },
    loading: 'Đang tải tác vụ',
    pagination: {
      label: 'Trang',
      summary: 'Trang {{page}} trên {{pages}}, {{total}} tác vụ',
      previous: 'Trước',
      next: 'Tiếp',
    },
  },
};

type Widen<T> = {
  readonly [K in keyof T]: T[K] extends string ? string : Widen<T[K]>;
};

/** The shape every locale of task-center-ui has. */
export type TaskCenterUiLocale = Widen<typeof enUS>;

const locale: TaskCenterUiLocale = enUS;

export default locale;
