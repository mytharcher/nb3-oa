export default {
  attendanceImport: {
    title: '근태 증빙 가져오기',
    description:
      '변경 불가능한 원시 증빙을 미리 보고 가져옵니다. 근태 평가나 급여 계산은 하지 않습니다.',
    template: 'Excel 템플릿 다운로드',
    downloadStarted: 'Excel 템플릿 다운로드를 시작했습니다.',
    downloadFailed: 'Excel 템플릿을 다운로드하지 못했습니다. 다시 시도하세요.',
    file: 'Excel 증빙 파일',
    empty: '.xlsx 파일을 선택하여 미리 보기를 시작하세요.',
    help: '시트 하나와 텍스트 셀이 있는 템플릿을 사용하세요. 필수 열: userId, date, punchKind, source, sourceKey, sourceData(JSON 객체). punchedAt은 비워 두거나 2035-01-02T01:00:00Z 같은 UTC ISO 텍스트여야 합니다. date는 회사 현지 날짜이며 userId는 이름이 아닌 실제 직원의 고정 사용자 ID입니다. 최대 4MiB, 1,000행입니다. 수식과 숫자 날짜는 허용되지 않습니다. JSON 객체 키는 고유해야 합니다. 숫자는 직렬화 후 소수 값을 유지해야 하며 정수는 안전 범위여야 합니다. 큰 ID와 정확한 소수는 문자열로 표현하세요.',
    parsing: 'Excel 분석 중',
    preview: '미리 보기: {{count}}행',
    confirm: '이 증빙을 검토했으며 전체 일괄 가져오기를 확인합니다',
    submit: '일괄 가져오기 확인',
    submitting: '가져오는 중',
    success: '증빙 {{count}}행을 가져왔습니다.',
    evidence: '원본 증빙 펼치기',
    denied: '근태 증빙 가져오기 권한이 없습니다.',
    failed: '일괄 가져오기에 실패했습니다. 파일을 검토하고 다시 시도하세요.',
    invalid:
      '서버가 증빙을 거부했습니다. 직원 ID, 회사 날짜 및 원본 데이터를 확인하세요.',
    conflict:
      '같은 원본 키에 다른 증빙이 이미 있습니다. 이 일괄 처리에서는 아무 행도 가져오지 않았습니다.',
    retry: '가져오기 재시도',
    discard: '제출하지 않은 증빙 미리 보기를 버리시겠습니까?',
    continue: '계속 검토',
    discardConfirm: '미리 보기 버리기',
    discardHelp: '미리 보기를 버린 후 이동할 대상을 다시 클릭하세요.',
    columns: {
      userId: '사용자 ID',
      date: '회사 날짜',
      punchKind: '기록 유형',
      punchedAt: 'UTC 시점',
      source: '출처',
      sourceKey: '원본 키',
      sourceData: '원본 증빙',
    },
    errors: {
      file: '4MiB 이하의 .xlsx 파일을 선택하세요.',
      archive:
        'Excel 압축 파일이 유효하지 않거나 안전한 압축 해제 한도를 초과합니다.',
      template: '다운로드한 템플릿의 헤더와 단일 시트를 그대로 사용하세요.',
      cell: '{{row}}행: 수식 없는 텍스트 셀과 템플릿의 일곱 열만 사용하세요.',
      rows: '헤더 다음에 연속된 증빙 행 1~1,000개를 사용하세요.',
      identity:
        '{{row}}행: 고정 사용자 ID와 유효한 원본 및 원본 키를 입력하세요.',
      date: '{{row}}행: 실제 회사 날짜, in/out 유형 및 명시적 UTC ISO 시점을 입력하거나 시점은 비워 두세요.',
      evidence:
        '{{row}}행: 고유 객체 키, 안전하게 왕복 변환되는 숫자 및 고유 원본 키를 가진 제한 크기의 JSON 객체를 제공하세요.',
    },
  },
};
