export interface SubjectOption {
  code: string;
  label: Record<string, string>;
  active: boolean;
}
export interface PurchaseOptions {
  timeZone: string;
  department: { id: string; title: string } | null;
  vendors: {
    id: string;
    name: string;
    category: string;
    active: boolean;
    status: string;
  }[];
  subjects: SubjectOption[];
}
export function subjectLabel(
  subject: SubjectOption | undefined,
  code: string,
  language: string,
) {
  return subject?.label[language] ?? subject?.label['en-US'] ?? code;
}
