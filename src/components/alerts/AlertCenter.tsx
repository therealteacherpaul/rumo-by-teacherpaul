import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { SectionCard } from "@/components/common/SectionCard";
import { Button } from "@/components/ui/button";
import type { AlertItem, AlertPreferences } from "@/lib/alerts/alert-types";
import { defaultAlertPreferences } from "@/lib/alerts/alert-types";
import { browserNotificationStatus, deliverForegroundAlerts } from "@/lib/alerts/alert-delivery";
import { pluralize } from "@/lib/pluralize";

/** How many alerts the list shows at once, to keep the Hoje screen readable. */
export const ALERT_PAGE_SIZE = 3;

export function AlertCenter({
  alerts,
  demo = false,
  loading = false,
  error = "",
  onRetry,
  preferences = defaultAlertPreferences,
}: {
  alerts: AlertItem[];
  demo?: boolean;
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
  preferences?: AlertPreferences;
}) {
  const [dismissed, setDismissed] = useState<string[]>([]);
  const visible = useMemo(
    () => (preferences.enabled ? alerts.filter((alert) => !dismissed.includes(alert.id)) : []),
    [alerts, dismissed, preferences.enabled],
  );
  const shown = visible.slice(0, ALERT_PAGE_SIZE);
  const remaining = visible.length - shown.length;
  useEffect(() => {
    if (demo) return;
    deliverForegroundAlerts(visible, preferences, browserNotificationStatus() === "granted");
  }, [demo, visible, preferences]);
  return (
    <SectionCard
      title="Central de alertas"
      description="Alertas determinísticos, com uma ação clara e sem notificações automáticas."
    >
      {loading ? (
        <p role="status">Carregando alertas…</p>
      ) : error ? (
        <div role="alert" className="space-y-2">
          <p>{error}</p>
          <Button variant="outline" onClick={onRetry}>
            Tentar novamente
          </Button>
        </div>
      ) : !visible.length ? (
        <p>Nenhum alerta ativo no momento.</p>
      ) : (
        <>
          <p className="mb-3 text-xs text-muted-foreground" role="status">
            Mostrando {shown.length} de {visible.length}{" "}
            {pluralize(visible.length, "alerta", "alertas")}
            {remaining > 0 && ` · ${remaining} aguardando`}
          </p>
          <ul className="space-y-2">
            {shown.map((alert) => (
              <li key={alert.id} className="flex flex-wrap items-center gap-2 rounded-lg border p-3">
                <div className="min-w-0 flex-1">
                  <p className="break-words text-sm font-medium">{alert.title}</p>
                  <p className="break-words text-xs text-muted-foreground">{alert.reason}</p>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link to={alert.href} search={demo ? { mode: "demo" } : {}}>
                    {alert.actionLabel}
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDismissed((current) => [...current, alert.id])}
                >
                  Dispensar
                </Button>
              </li>
            ))}
          </ul>
          {remaining > 0 && (
            <p className="mt-3 text-xs text-muted-foreground">
              Resolva ou dispense um alerta para ver o próximo.
            </p>
          )}
        </>
      )}
      {!demo && (
        <p className="mt-4 border-t pt-3 text-xs text-muted-foreground">
          Ajuste quais alertas aparecem e as notificações desta aba em{" "}
          <Link className="underline" to="/settings">
            Configurações
          </Link>
          .
        </p>
      )}
    </SectionCard>
  );
}
