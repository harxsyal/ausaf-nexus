import { useMemo } from "react";
import { Filter as FilterIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

export type TaskFilters = {
  department?: string;
  status?: string;
  employee?: string;
  asset?: string;
  platform?: string;
  priority?: string;
  contentType?: string;
  dateFrom?: string;
  dateTo?: string;
};

export type FilterOption = { value: string; label: string };

export interface TaskFilterBarProps {
  value: TaskFilters;
  onChange: (next: TaskFilters) => void;
  /** Which fields to show. Hide irrelevant ones per dashboard. */
  show?: Partial<Record<keyof TaskFilters | "dateRange", boolean>>;
  options: {
    departments?: FilterOption[];
    statuses?: FilterOption[];
    employees?: FilterOption[];
    assets?: FilterOption[];
    platforms?: FilterOption[];
    priorities?: FilterOption[];
    contentTypes?: FilterOption[];
  };
}

const ALL = "__all__";

const FieldShell = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex flex-col gap-1 min-w-[140px]">
    <span className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground">{label}</span>
    {children}
  </div>
);

const FilterSelect = ({
  label, value, onChange, options, placeholder,
}: {
  label: string;
  value: string | undefined;
  onChange: (v: string | undefined) => void;
  options: FilterOption[];
  placeholder: string;
}) => (
  <FieldShell label={label}>
    <Select value={value ?? ALL} onValueChange={(v) => onChange(v === ALL ? undefined : v)}>
      <SelectTrigger className="h-8 text-xs rounded-none bg-surface">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="rounded-none">
        <SelectItem value={ALL} className="text-xs">All</SelectItem>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  </FieldShell>
);

export const TaskFilterBar = ({ value, onChange, show = {}, options }: TaskFilterBarProps) => {
  const set = (patch: Partial<TaskFilters>) => onChange({ ...value, ...patch });

  const activeCount = useMemo(
    () => Object.values(value).filter((v) => v !== undefined && v !== "").length,
    [value]
  );

  const showField = (k: keyof TaskFilters | "dateRange") => show[k] !== false;

  return (
    <section className="border border-border bg-surface/40 p-3">
      <div className="flex items-center gap-2 mb-3">
        <FilterIcon className="size-3 text-primary" />
        <span className="text-[10px] font-mono uppercase tracking-widest font-semibold">Filters</span>
        {activeCount > 0 && (
          <>
            <span className="text-[10px] font-mono text-muted-foreground tabular-nums">
              · {activeCount} active
            </span>
            <button
              onClick={() => onChange({})}
              className="ml-auto inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground"
            >
              <X className="size-3" /> Clear all
            </button>
          </>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        {showField("department") && options.departments && (
          <FilterSelect label="Department" placeholder="All depts"
            value={value.department}
            onChange={(v) => set({ department: v })}
            options={options.departments} />
        )}
        {showField("status") && options.statuses && (
          <FilterSelect label="Status" placeholder="Any status"
            value={value.status}
            onChange={(v) => set({ status: v })}
            options={options.statuses} />
        )}
        {showField("employee") && options.employees && (
          <FilterSelect label="Employee" placeholder="Anyone"
            value={value.employee}
            onChange={(v) => set({ employee: v })}
            options={options.employees} />
        )}
        {showField("asset") && options.assets && (
          <FilterSelect label="Asset" placeholder="Any asset"
            value={value.asset}
            onChange={(v) => set({ asset: v })}
            options={options.assets} />
        )}
        {showField("platform") && options.platforms && (
          <FilterSelect label="Platform" placeholder="Any platform"
            value={value.platform}
            onChange={(v) => set({ platform: v })}
            options={options.platforms} />
        )}
        {showField("priority") && options.priorities && (
          <FilterSelect label="Priority" placeholder="Any priority"
            value={value.priority}
            onChange={(v) => set({ priority: v })}
            options={options.priorities} />
        )}
        {showField("contentType") && options.contentTypes && (
          <FilterSelect label="Content Type" placeholder="Any type"
            value={value.contentType}
            onChange={(v) => set({ contentType: v })}
            options={options.contentTypes} />
        )}
        {showField("dateRange") && (
          <>
            <FieldShell label="Deadline From">
              <Input type="date" value={value.dateFrom ?? ""}
                onChange={(e) => set({ dateFrom: e.target.value || undefined })}
                className="h-8 text-xs rounded-none bg-surface" />
            </FieldShell>
            <FieldShell label="Deadline To">
              <Input type="date" value={value.dateTo ?? ""}
                onChange={(e) => set({ dateTo: e.target.value || undefined })}
                className="h-8 text-xs rounded-none bg-surface" />
            </FieldShell>
          </>
        )}
      </div>
    </section>
  );
};

/** Apply filters to any task row. Pass field-extractors so the same hook works for all 3 desks. */
export function applyTaskFilters<T>(
  rows: T[],
  filters: TaskFilters,
  pick: {
    status?: (r: T) => string | null | undefined;
    employee?: (r: T) => string | null | undefined;
    asset?: (r: T) => string | null | undefined;
    platform?: (r: T) => string | null | undefined;
    priority?: (r: T) => string | null | undefined;
    contentType?: (r: T) => string | null | undefined;
    deadline?: (r: T) => string | null | undefined;
  }
): T[] {
  const from = filters.dateFrom ? new Date(filters.dateFrom).getTime() : null;
  const to   = filters.dateTo   ? new Date(filters.dateTo + "T23:59:59").getTime() : null;

  return rows.filter((r) => {
    if (filters.status      && pick.status      && pick.status(r)      !== filters.status)      return false;
    if (filters.employee    && pick.employee    && pick.employee(r)    !== filters.employee)    return false;
    if (filters.asset       && pick.asset       && pick.asset(r)       !== filters.asset)       return false;
    if (filters.platform    && pick.platform    && pick.platform(r)    !== filters.platform)    return false;
    if (filters.priority    && pick.priority    && pick.priority(r)    !== filters.priority)    return false;
    if (filters.contentType && pick.contentType && pick.contentType(r) !== filters.contentType) return false;
    if ((from || to) && pick.deadline) {
      const d = pick.deadline(r);
      if (!d) return false;
      const t = new Date(d).getTime();
      if (from && t < from) return false;
      if (to   && t > to)   return false;
    }
    return true;
  });
}
