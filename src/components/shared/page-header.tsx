import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
};

export function PageHeader({ title, description, action, className }: PageHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between gap-4 mb-6", className)}>
      <div>
        <h1 className="text-display-sm text-[#0a0a0a]">{title}</h1>
        {description && (
          <p className="text-body-sm text-[#6a6a6a] mt-1">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
