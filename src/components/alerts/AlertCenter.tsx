import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { SectionCard } from "@/components/common/SectionCard";
import { Button } from "@/components/ui/button";
import type { AlertItem, AlertPreferences } from "@/lib/alerts/alert-types";
import { defaultAlertPreferences } from "@/lib/alerts/alert-types";

export function AlertCenter({
  alerts,
  demo = false,
  loading = false,
  error = "",
  onRetry,
  preferences: persistedPreferences,
  onPreferencesChange,
  preferencesSaving = false,
}: {
  alerts: AlertItem[];
  demo?: boolean;
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
  preferences?: AlertPreferences;
  onPreferencesChange?: (preferences: AlertPreferences) => void | Promise<void>;
  preferencesSaving?: boolean;
}) {
  const [preferences, setPreferences] = useState<AlertPreferences>(
    persistedPreferences ?? defaultAlertPreferences,
  );
  const [dismissed, setDismissed] = useState<string[]>([]);
  useEffect(() => {
    if (persistedPreferences) setPreferences(persistedPreferences);
  }, [persistedPreferences]);
  const updatePreferences = (next: AlertPreferences) => {
    setPreferences(next);
    void onPreferencesChange?.(next);
  };
  const visible = useMemo(
    () => (preferences.enabled ? alerts.filter((alert) => !dismissed.includes(alert.id)) : []),
    [alerts, dismissed, preferences.enabled],
  );
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
        <ul className="space-y-2">
          {visible.map((alert) => (
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
      )}
      <div className="mt-4 grid gap-2 border-t pt-3 text-xs">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={preferences.enabled}
            onChange={(event) =>
              updatePreferences({ ...preferences, enabled: event.target.checked })
            }
          />
          Ativar alertas
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={preferences.habitsEnabled}
            onChange={(event) =>
              updatePreferences({ ...preferences, habitsEnabled: event.target.checked })
            }
          />
          Alertas de hábitos
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={preferences.focusEnabled}
            onChange={(event) =>
              updatePreferences({ ...preferences, focusEnabled: event.target.checked })
            }
          />
          Alertas de foco
        </label>
        <label className="grid gap-1 sm:grid-cols-[1fr_auto] sm:items-center">
          Antecedência de prazo (dias)
          <input
            className="h-10 w-full rounded-md border bg-background px-3 sm:w-24"
            type="number"
            min={0}
            max={30}
            value={preferences.deadlineLeadDays}
            aria-label="Antecedência de prazo em dias"
            onChange={(event) =>
              updatePreferences({
                ...preferences,
                deadlineLeadDays: Math.min(30, Math.max(0, Number(event.target.value) || 0)),
              })
            }
          />
        </label>
        <label className="grid gap-1 sm:grid-cols-[1fr_auto] sm:items-center">
          Horário do resumo diário
          <input
            className="h-10 w-full rounded-md border bg-background px-3 sm:w-32"
            type="time"
            value={preferences.dailySummaryTime}
            aria-label="Horário do resumo diário"
            onChange={(event) =>
              updatePreferences({ ...preferences, dailySummaryTime: event.target.value })
            }
          />
        </label>
        {preferencesSaving && <p role="status">Salvando preferências…</p>}
      </div>
    </SectionCard>
  );
}
