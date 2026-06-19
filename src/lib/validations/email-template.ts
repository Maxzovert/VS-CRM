import { z } from "zod";

export const emailTemplateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  subject: z.string().min(1, "Subject is required"),
  body: z.string().min(1, "Body is required"),
});

export type EmailTemplateInput = z.infer<typeof emailTemplateSchema>;

export type TemplateVariables = {
  clientName?: string;
  companyName?: string;
  amount?: string;
  dueDate?: string;
  invoiceNumber?: string;
  followUpNote?: string;
  email?: string;
  phone?: string;
};

export function renderTemplate(
  template: string,
  variables: TemplateVariables
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const value = variables[key as keyof TemplateVariables];
    return value ?? "";
  });
}
