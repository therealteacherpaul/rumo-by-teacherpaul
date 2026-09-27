import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute } from "@tanstack/react-router";
import { Plug, ShieldCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { DemoNotice } from "@/components/common/DemoBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCategories } from "@/hooks/use-categories";
import { useAppDataMode } from "@/hooks/use-app-data-mode";
import { useAuth } from "@/hooks/use-auth";
import { CategoryManager } from "@/components/categories/CategoryManager";
import { TaskDataProvider } from "@/components/tasks/TaskDataProvider";


export const Route = createFileRoute("/_app/settings")({
  head: () => ({
    meta: [
      { title: "Configurações — RUMO by Teacher Paul" },
      {
        name: "description",
        content:
          "Perfil, preferências, categorias, notificações, privacidade e integrações opcionais do RUMO.",
      },
      { property: "og:title", content: "Configurações — RUMO by Teacher Paul" },
      {
        property: "og:description",
        content: "Ajuste o RUMO ao seu ritmo. A integração com o Smart Schedule Pro é opcional.",
      },
    ],
  }),
  component: SettingsPage,
});

const profileSchema = z.object({
  name: z.string().min(2, "Informe pelo menos 2 caracteres."),
  email: z.string().email("Informe um e-mail válido."),
  role: z.string().min(2, "Informe sua ocupação principal."),
  city: z.string().min(2, "Informe sua cidade."),
});

type ProfileValues = z.infer<typeof profileSchema>;

const preferences = [
  { id: "start", label: "Início do dia", value: "07:00" },
  { id: "end", label: "Fim do dia", value: "22:00" },
];

const notificationItems = [
  { id: "n1", label: "Lembrete das prioridades pela manhã", defaultOn: true },
  { id: "n2", label: "Aviso antes de blocos de foco", defaultOn: true },
  { id: "n3", label: "Convite para a revisão semanal", defaultOn: true },
  { id: "n4", label: "Alertas de sobrecarga na semana", defaultOn: false },
];

function SettingsPage() {
  const mode = useAppDataMode();
  const { user } = useAuth();
  const { categories, createCategory, renameCategory, activateCategory, deactivateCategory } =
    useCategories();

  const [newCategoryName, setNewCategoryName] = useState("");
  const [categoryNames, setCategoryNames] = useState<Record<string, string>>({});
  const [categoryMessage, setCategoryMessage] = useState("");
  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "Paul",
      email: "paul@exemplo.com",
      role: "Desenvolvedor e mentor",
      city: "Tóquio",
    },
  });

  const onSubmit = () =>
    toast("Alterações não salvas", {
      description: "Esta é uma demonstração visual. Nenhum banco de dados está conectado.",
    });

  if (mode === "authenticated") {
    if (!user) return null;
    return (
      <div className="space-y-8">
        <PageHeader
          showDemoBadge={false}
          title="Configurações"
          description="Personalize o RUMO ao seu ritmo."
        />
        <TaskDataProvider key={user.id} userId={user.id}>
          <CategoryManager />
        </TaskDataProvider>
      </div>
    );
  }


  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Sua configuração"
        title="Configurações"
        description="Ajuste o RUMO ao seu ritmo. Nesta etapa, as alterações não são persistidas."
        showDemoBadge
      />

      <DemoNotice />

      <Tabs defaultValue="perfil">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
          {[
            ["perfil", "Perfil"],
            ["preferencias", "Preferências"],
            ["categorias", "Categorias"],
            ["notificacoes", "Notificações"],
            ["privacidade", "Privacidade"],
            ["integracoes", "Integrações"],
          ].map(([value, label]) => (
            <TabsTrigger key={value} value={value!}>
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="perfil" className="mt-6">
          <SectionCard title="Perfil" description="Como o RUMO se dirige a você.">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-5 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-mail</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                      <FormDescription>Usado futuramente para acesso e lembretes.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ocupação principal</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cidade</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="sm:col-span-2">
                  <Button type="submit">Salvar alterações</Button>
                </div>
              </form>
            </Form>
          </SectionCard>
        </TabsContent>

        <TabsContent value="preferencias" className="mt-6">
          <SectionCard title="Preferências" description="Limites que o RUMO respeita ao planejar.">
            <div className="grid gap-5 sm:grid-cols-2">
              {preferences.map((p) => (
                <div key={p.id}>
                  <Label htmlFor={p.id}>{p.label}</Label>
                  <Input id={p.id} type="time" defaultValue={p.value} className="mt-2" />
                </div>
              ))}
              <div>
                <Label htmlFor="focus-length">Duração padrão do bloco de foco</Label>
                <Select defaultValue="50">
                  <SelectTrigger id="focus-length" className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["25", "50", "90"].map((v) => (
                      <SelectItem key={v} value={v}>
                        {v} minutos
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="buffer">Folga diária para imprevistos</Label>
                <Select defaultValue="60">
                  <SelectTrigger id="buffer" className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["30", "60", "90"].map((v) => (
                      <SelectItem key={v} value={v}>
                        {v} minutos
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Separator className="my-6" />
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium">Proteger descanso e refeições</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Impede que o planejamento ocupe blocos de sono, alimentação e família.
                </p>
              </div>
              <Switch defaultChecked aria-label="Proteger descanso e refeições" />
            </div>
          </SectionCard>
        </TabsContent>

        <TabsContent value="categorias" className="mt-6">
          <SectionCard
            title="Categorias"
            description="Base para os relatórios de tempo por área da vida."
          >
            <p className="text-sm text-muted-foreground">
              {categories.filter((category) => category.active).length}/{categories.length} ativas ·{" "}
              {categories.filter((category) => category.source === "user").length}/4 personalizadas
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Input
                value={newCategoryName}
                onChange={(event) => setNewCategoryName(event.target.value)}
                placeholder="Nome da nova categoria"
                aria-label="Nome da nova categoria"
              />
              <Button
                type="button"
                className="shrink-0"
                onClick={() => {
                  const result = createCategory(newCategoryName);
                  setCategoryMessage(
                    result.valid ? "Categoria criada nesta demonstração." : result.reason,
                  );
                  if (result.valid) setNewCategoryName("");
                }}
              >
                Criar categoria
              </Button>
            </div>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((c) => (
                <li key={c.id} className="rounded-lg border border-border/70 p-3">
                  <div className="flex items-center gap-3">
                    <span
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ background: c.color }}
                      aria-hidden
                    />
                    <Input
                      value={categoryNames[c.id] ?? c.name}
                      onChange={(event) =>
                        setCategoryNames((current) => ({ ...current, [c.id]: event.target.value }))
                      }
                      aria-label={`Nome da categoria ${c.name}`}
                      className="h-8 min-w-0"
                    />
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">
                      {c.source === "system" ? "Sistema" : "Personalizada"}
                    </Badge>
                    <Badge variant={c.active ? "secondary" : "outline"}>
                      {c.active ? "Ativa" : "Desativada"}
                    </Badge>
                    <Badge variant="outline">{c.kind}</Badge>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      aria-label={`Salvar nome da categoria ${c.name}`}
                      onClick={() => {
                        const result = renameCategory(c.id, categoryNames[c.id] ?? c.name);
                        setCategoryMessage(
                          result.valid ? "Categoria renomeada nesta demonstração." : result.reason,
                        );
                      }}
                    >
                      Renomear
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      aria-label={`${c.active ? "Desativar" : "Ativar"} categoria ${c.name}`}
                      onClick={() => {
                        const result = c.active ? deactivateCategory(c.id) : activateCategory(c.id);
                        setCategoryMessage(
                          result.valid
                            ? `Categoria ${c.active ? "desativada" : "ativada"} nesta demonstração.`
                            : result.reason,
                        );
                      }}
                    >
                      {c.active ? "Desativar" : "Ativar"}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
            {categoryMessage ? (
              <p className="mt-4 text-sm text-success" role="status">
                {categoryMessage}
              </p>
            ) : null}
            <p className="mt-4 text-xs text-muted-foreground">
              Alterações temporárias desta demonstração. Categorias desativadas continuam
              disponíveis no histórico.
            </p>
          </SectionCard>
        </TabsContent>

        <TabsContent value="notificacoes" className="mt-6">
          <SectionCard title="Notificações" description="Poucos avisos, nos momentos certos.">
            <ul className="divide-y divide-border">
              {notificationItems.map((n) => (
                <li key={n.id} className="flex items-center justify-between gap-4 py-4 first:pt-0">
                  <span className="min-w-0 text-sm">{n.label}</span>
                  <Switch defaultChecked={n.defaultOn} aria-label={n.label} />
                </li>
              ))}
            </ul>
          </SectionCard>
        </TabsContent>

        <TabsContent value="privacidade" className="mt-6">
          <SectionCard title="Privacidade" description="Seus dados, sob seu controle.">
            <div className="space-y-5">
              <div className="flex items-start gap-3 rounded-lg border border-border/70 p-4">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden />
                <div className="min-w-0">
                  <p className="text-sm font-medium">Nenhum dado é armazenado nesta versão</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    A demonstração roda inteiramente no navegador, com dados de exemplo.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="min-w-0 text-sm">Compartilhar métricas anônimas de uso</span>
                <Switch aria-label="Compartilhar métricas anônimas de uso" />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" disabled>
                  Exportar meus dados
                </Button>
                <Button variant="outline" disabled>
                  Excluir minha conta
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Ações disponíveis quando a conta e o armazenamento forem implementados.
              </p>
            </div>
          </SectionCard>
        </TabsContent>

        <TabsContent value="integracoes" className="mt-6">
          <SectionCard title="Integrações" description="Opcionais, sempre.">
            <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 rounded-lg border border-border/70 p-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-secondary">
                <Plug className="size-4 text-muted-foreground" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="break-words text-sm font-medium">
                  Smart Schedule Pro — não conectado
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Importaria eventos, contatos e locais favoritos.
                </p>
              </div>
              <Button variant="outline" disabled className="shrink-0">
                Conectar futuramente
              </Button>
            </div>
            <p className="mt-4 rounded-lg bg-muted p-3 text-sm text-muted-foreground">
              O RUMO funciona normalmente sem o Smart Schedule Pro. A integração é opcional.
            </p>
          </SectionCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}
