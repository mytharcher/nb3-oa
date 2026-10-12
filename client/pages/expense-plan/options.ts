export interface SubjectOption {
  code: string;
  label: Record<string, string>;
  active: boolean;
}
export interface ExpenseOptions {
  timeZone: string;
  department: { id: string; title: string } | null;
  matterTypes: SubjectOption[];
  subjects: SubjectOption[];
}
export function subjectLabel(
  subject: SubjectOption | undefined,
  code: string,
  language: string,
) {
  return subject?.label[language] ?? subject?.label['en-US'] ?? code;
}
