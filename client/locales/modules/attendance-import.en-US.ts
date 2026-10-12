export default {
  attendanceImport: {
    title: 'Import attendance evidence',
    description:
      'Preview and import immutable raw evidence. This does not evaluate attendance or calculate payroll.',
    template: 'Download Excel template',
    downloadStarted: 'Excel template download started.',
    downloadFailed: 'The Excel template could not be downloaded. Try again.',
    file: 'Excel evidence file',
    empty: 'Choose an .xlsx file to start the preview.',
    help: 'Use the template with one sheet and text cells. Required columns: userId, date, punchKind, source, sourceKey and sourceData (JSON object). punchedAt may be blank or UTC ISO text such as 2035-01-02T01:00:00Z. date is the company local date. userId is the stable user ID of a real employee, never a name. Maximum 4 MiB and 1,000 rows. Formulas and numeric dates are rejected. JSON object keys must be unique; numbers must preserve their decimal value when serialized and integers must be safe. Represent larger IDs or exact decimals as strings.',
    parsing: 'Parsing Excel',
    preview: 'Preview: {{count}} rows',
    confirm:
      'I have reviewed this evidence and confirm importing the entire batch',
    submit: 'Confirm batch import',
    submitting: 'Importing',
    success: '{{count}} evidence rows imported.',
    evidence: 'Expand original evidence',
    denied: 'You do not have permission to import attendance evidence.',
    failed: 'The batch could not be imported. Review the file and try again.',
    invalid:
      'The server rejected this evidence. Check employee IDs, company dates and source data.',
    conflict:
      'A source key already has different evidence. No rows from this batch were imported.',
    retry: 'Try importing again',
    discard: 'Discard the unsubmitted evidence preview?',
    continue: 'Continue reviewing',
    discardConfirm: 'Discard preview',
    discardHelp:
      'After discarding the preview, click your destination again to continue navigating.',
    columns: {
      userId: 'User ID',
      date: 'Company date',
      punchKind: 'Punch kind',
      punchedAt: 'UTC instant',
      source: 'Source',
      sourceKey: 'Source key',
      sourceData: 'Original evidence',
    },
    errors: {
      file: 'Choose an .xlsx file no larger than 4 MiB.',
      archive:
        'The Excel archive is invalid or exceeds the safe extraction limits.',
      template:
        'Use exactly the downloaded template headers and a single sheet.',
      cell: 'Row {{row}}: use text cells without formulas and only the seven template columns.',
      rows: 'Use 1–1,000 consecutive evidence rows after the header.',
      identity:
        'Row {{row}}: provide a stable user ID and valid source and source key.',
      date: 'Row {{row}}: provide a real company date, in/out kind and an explicit UTC ISO instant or blank.',
      evidence:
        'Row {{row}}: provide a bounded JSON object with unique object keys, safely round-tripping numbers and a unique source key.',
    },
  },
};
