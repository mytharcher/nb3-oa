import type { LocaleResource } from '@nocobase/i18n';

const enUS = {
  nav: {
    notifications: '알림',
    logs: '알림 로그',
  },
  logs: {
    retry: '다시 시도',
    limitNotice:
      '최근 알림 {{count}}개만 표시되며 합계도 이 레코드를 기준으로 합니다.',
    deliveryOperations: '전달 작업',
    recipeDescription: '채널 전달과 공급자의 모든 시도를 추적합니다.',
    redacted: '메시지 본문, 수신자 및 임대 토큰은 숨겨집니다.',
    providerAttempts: '공급자 시도',

    eyebrow: '알림',
    title: '알림 로그',
    description:
      '알림 전달과 공급자의 모든 시도를 추적합니다. 메시지 본문, 수신자 및 임대 토큰은 숨겨집니다.',
    refreshing: '새로고침 중…',
    refresh: '새로고침',
    deliveriesShown: '표시된 전달 건수',
    needAttention: '확인 필요',
    unavailable: '로그를 사용할 수 없음',
    recent: '최근 알림',
    loading: '전달 내역을 불러오는 중…',
    emptyTitle: '전달 내역 없음',
    emptyDescription: '알림을 보내면 전달 레코드가 여기에 표시됩니다.',
    expand: '알림 펼치기',
    collapse: '알림 접기',
    noDeliveries: '기록된 전달 내역이 없습니다.',
    noAttempts: '기록된 시도가 없습니다.',
    columns: {
      source: '출처',
      notificationId: '알림 ID',
      status: '상태',
      deliveries: '전달',
      created: '생성됨',
      channel: '채널',
      provider: '공급자',
      attempts: '시도',
      updated: '업데이트됨',
    },
  },
  status: {
    pending: '대기 중',
    processing: '처리 중',
    completed: '완료됨',
    partial: '일부 완료',
    failed: '실패',
    unknown: '알 수 없음',
    preparing: '준비 중',
    submitting: '제출 중',
    retrying: '재시도 중',
    accepted: '접수됨',
  },
  errors: {
    forbidden: '접근 권한이 제거되었습니다. 관리자에게 문의하세요.',
    notFound: '이 레코드를 사용할 수 없습니다. 워크벤치로 돌아가세요.',
    providerFailed:
      '전달에 실패했습니다. 채널 설정을 확인하거나 관리자에게 문의하세요.',
    requestFailed: '알림 요청에 실패했습니다.',
    inAppRecipientNotFound: '앱 내 알림 수신자가 존재하지 않습니다.',
  },
};

export type NotificationResource = LocaleResource<typeof enUS>;

export default enUS;
