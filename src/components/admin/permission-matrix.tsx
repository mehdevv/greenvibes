import { Checkbox } from "@/components/ui/checkbox";
import type { AdminPermissions } from "@/api/types";
import {
  ADMIN_ACTIONS,
  ADMIN_RESOURCES,
  type AdminAction,
  type AdminResource,
} from "@/lib/admin-permissions";
import { cn } from "@/lib/utils";

type PermissionMatrixProps = {
  value: AdminPermissions;
  onChange: (permissions: AdminPermissions) => void;
  disabled?: boolean;
  className?: string;
};

export function PermissionMatrix({ value, onChange, disabled, className }: PermissionMatrixProps) {
  const toggle = (resource: AdminResource, action: AdminAction, checked: boolean) => {
    onChange({
      ...value,
      [resource]: {
        ...value[resource],
        [action]: checked,
      },
    });
  };

  return (
    <div className={cn("overflow-x-auto rounded-xl border border-border", className)}>
      <table className="w-full min-w-[480px] text-sm">
        <thead>
          <tr className="border-b border-border bg-secondary/40">
            <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Ressource</th>
            {ADMIN_ACTIONS.map((action) => (
              <th key={action.id} className="px-3 py-2.5 text-center font-medium text-muted-foreground">
                {action.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ADMIN_RESOURCES.map((resource) => (
            <tr key={resource.id} className="border-b border-border last:border-0">
              <td className="px-4 py-3 font-medium">{resource.label}</td>
              {ADMIN_ACTIONS.map((action) => {
                const id = `${resource.id}-${action.id}`;
                return (
                  <td key={action.id} className="px-3 py-3 text-center">
                    <div className="flex justify-center">
                      <Checkbox
                        id={id}
                        checked={value[resource.id][action.id]}
                        disabled={disabled}
                        onCheckedChange={(checked) =>
                          toggle(resource.id, action.id, checked === true)
                        }
                      />
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="border-t border-border px-4 py-2 text-xs text-muted-foreground">
        Cochez ce que ce compte peut faire. « Voir » est requis pour accéder aux listes.
      </p>
    </div>
  );
}

export function PermissionSummary({ permissions }: { permissions: AdminPermissions }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {ADMIN_RESOURCES.map((resource) => {
        const active = ADMIN_ACTIONS.filter((a) => permissions[resource.id][a.id]).map((a) => a.label);
        if (!active.length) return null;
        return (
          <span
            key={resource.id}
            className="rounded-full bg-secondary px-2.5 py-0.5 text-xs text-foreground"
          >
            {resource.label}: {active.join(", ")}
          </span>
        );
      })}
    </div>
  );
}
