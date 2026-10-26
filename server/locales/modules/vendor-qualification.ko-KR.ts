export default {
  vendorQualifications: {
    authz: {
      resource: '공급업체 자격',
      view: '공급업체 자격 보기',
      submit: '공급업체 자격 신청 생성 및 편집',
      paymentAccount: '보호된 공급업체 은행 계좌 읽기',
      updatePaymentAccount: '내 초안의 공급업체 은행 계좌 업데이트',
      manage: '공급업체 자격 위원회 설정',
    },
    schedule: {
      expiryReminder:
        '공급업체 {{supplierName}}의 자격이 {{expiry}}에 만료됩니다. 갱신을 준비하세요.',
      title: '공급업체 자격 만료 알림',
      description: '회사 달력 기준 자격 만료 30일 전에 구매팀에 알립니다.',
    },
  },
};
