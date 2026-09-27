import { useCallback, useEffect, useState } from "react";

import { SectionCard } from "@/components/common/SectionCard";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import {
  browserNotificationStatus,
  requestBrowserNotificationPermission,
} from "@/lib/alerts/alert-delivery";
import {
  loadAlertPreferences,
  saveAlertPreferences,
} from "@/lib/alerts/alert-preferences-repository";
import { defaultAlertPreferences, type AlertPreferences } from "@/lib/alerts/alert-types";

/** Alert preferences and browser notification permission live in Configurações, not in Hoje. */
export function AlertSettings() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<AlertPreferences>(defaultAlertPreferences);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notificationMessage, setNotificationMessage] = useState("");
  const [foregroundEnabled, setForegroundEnabled] = useState(
    () => browserNotificationStatus() === "granted",
  );
  const [notificationBusy, setNotificationBusy] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      setPreferences(await loadAlertPreferences(user.id));
      setError("");
    } catch {
      setPreferences(defaultAlertPreferences);
      setError("Não foi possível carregar suas preferências de alerta. Tente novamente.");
    }
  }, [user]);
  useEffect(() => {
    void load();
  }, [load]);

  const update = async (next: AlertPreferences) => {
    if (!user) return;
    setPreferences(next);
    setSaving(true);
    try {
      await saveAlertPreferences(user.id, next);
      setError("");
    } catch {
      setError("Não foi possível salvar as preferências. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  const toggleNotifications = async () => {
    if (foregroundEnabled) {
      setForegroundEnabled(false);
      setNotificationMessage(
        "Notificações desativadas nesta aba. A permissão do navegador permanece inalterada.",
      );
      return;
    }
    setNotificationBusy(true);
    try {
      const permission = await requestBrowserNotificationPermission();
      if (permission === "unsupported") {
        setNotificationMessage(
          "Seu navegador não oferece notificações. A Central de alertas continua disponível.",
        );
        return;
      }
      if (permission !== "granted") {
        setNotificationMessage(
          "As notificações foram negadas. Libere a permissão nas configurações do navegador para tentar novamente.",
        );
        return;
      }
      setForegroundEnabled(true);
      setNotificationMessage("Notificações ativadas nesta aba.");
    } finally {
      setNotificationBusy(false);
    }
  };

  return (
    <SectionCard
      title="Alertas e notificações"
      description="Escolha quais alertas aparecem em Hoje e se esta aba pode notificar você."
    >
      <div className="grid gap-3 text-sm">
        <label className="flex min-h-11 items-center gap-2">
          <input
            type="checkbox"
            checked={preferences.enabled}
            onChange={(event) => void update({ ...preferences, enabled: event.target.checked })}
          />
          Ativar alertas
        </label>
        <label className="flex min-h-11 items-center gap-2">
          <input
            type="checkbox"
            checked={preferences.habitsEnabled}
            onChange={(event) =>
              void update({ ...preferences, habitsEnabled: event.target.checked })
            }
          />
          Alertas de hábitos
        </label>
        <label className="flex min-h-11 items-center gap-2">
          <input
            type="checkbox"
            checked={preferences.focusEnabled}
            onChange={(event) =>
              void update({ ...preferences, focusEnabled: event.target.checked })
            }
          />
          Alertas de foco
        </label>
        <label className="grid gap-1 sm:grid-cols-[1fr_auto] sm:items-center">
          Antecedência de prazo (dias)
          <input
            className="h-11 w-full rounded-md border bg-background px-3 sm:w-24"
            type="number"
            min={0}
            max={30}
            value={preferences.deadlineLeadDays}
            aria-label="Antecedência de prazo em dias"
            onChange={(event) =>
              void update({
                ...preferences,
                deadlineLeadDays: Math.min(30, Math.max(0, Number(event.target.value) || 0)),
              })
            }
          />
        </label>
        <label className="grid gap-1 sm:grid-cols-[1fr_auto] sm:items-center">
          Horário do resumo diário
          <input
            className="h-11 w-full rounded-md border bg-background px-3 sm:w-32"
            type="time"
            value={preferences.dailySummaryTime}
            aria-label="Horário do resumo diário"
            onChange={(event) =>
              void update({ ...preferences, dailySummaryTime: event.target.value })
            }
          />
        </label>
        {saving && <p role="status">Salvando preferências…</p>}
        <Button
          type="button"
          variant="outline"
          className="min-h-11 justify-self-start"
          disabled={!preferences.enabled || saving || notificationBusy}
          onClick={() => void toggleNotifications()}
        >
          {notificationBusy
            ? "Verificando permissão…"
            : foregroundEnabled
              ? "Desativar notificações nesta aba"
              : "Ativar notificações nesta aba"}
        </Button>
        {notificationMessage && <p role="status">{notificationMessage}</p>}
        {error && (
          <p role="alert" className="text-destructive">
            {error}
          </p>
        )}
      </div>
    </SectionCard>
  );
}
