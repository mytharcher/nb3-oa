export default {
  meetingRooms: {
    authz: {
      title: '会議室',
      bookings: '会議予約',
      view: '表示',
      manage: '会議室を管理',
      create: '会議室を予約',
      edit: '予約を編集',
      cancel: '予約を取消',
      confirm: '管理申請を確認',
      reject: '管理申請を却下',
      checkIn: 'チェックイン',
      owned: '自分が主催',
      participating: '自分が参加する会議',
      readable: '自分が主催または参加する会議',
    },
    notifications: {
      title: '会議予約の更新',
      body: 'あなたが関係する会議予約が変更されました。会議予約を開いて閲覧可能な詳細を確認してください。',
    },
    errors: {
      SORT_LIMIT_EXCEEDED:
        '一致するレコードが多すぎます。名前順で並べる前に検索を絞り込んでください。',
      ACCESS_DENIED: 'この操作または項目は権限範囲外です。',
      ACTIVE_EMPLOYEE_REQUIRED: '有効な従業員記録が必要です。',
      BOOKING_NOT_FOUND: '予約を利用できません。',
      CAPACITY_EXCEEDED: '主催者と参加者が会議室定員を超えています。',
      COMMAND_CONFLICT:
        'このリクエスト識別子は別の操作または操作者に属しています。',
      INVALID_BOOKING: 'タイトルと重複しない在籍中の参加者を入力してください。',
      INVALID_INTERVAL: '終了が開始より後の未来の時間帯を選択してください。',
      INVALID_PARTICIPANT: '参加者は全員在籍中の従業員にしてください。',
      INVALID_RECURRENCE:
        '毎日または毎週、1～52回の繰り返しを選択してください。',
      INVALID_REQUEST_ID: 'リクエスト識別子が必要です。',
      INVALID_ROOM: '会議室名、定員、変更理由を入力してください。',
      INVALID_SERIES: '既存の系列を選択してください。',
      INVALID_STATE:
        '現在の状態または時間帯ではこの予約の操作を実行できません。',
      REASON_REQUIRED: '管理判断の理由を入力してください。',
      ROOM_INACTIVE: 'この会議室は無効です。',
      ROOM_NOT_FOUND: 'この会議室を利用できません。',
      TIME_CONFLICT: '指定時間帯の1つ以上が使用中の時間帯と競合します。',
      VERSION_CONFLICT:
        '予約または会議室が変更されました。再試行前に更新してください。',
      INVALID_LOCAL_TIME: '有効な会社現地日時を入力してください。',
      NONEXISTENT_LOCAL_TIME:
        'タイムゾーン変更により現地時刻が存在しません。別の時刻を選択してください。',
      AMBIGUOUS_LOCAL_TIME:
        'タイムゾーン変更により現地時刻が2回存在します。一意に決まる時刻を選択してください。',
    },
  },
};
