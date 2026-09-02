import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Compass, Clock, Target, ShieldCheck } from "lucide-react";

import { RumoLogo } from "@/components/brand/RumoLogo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RUMO by Teacher Paul — Seu sistema operacional pessoal" },
      {
        name: "description",
        content:
          "RUMO transforma prioridades em execução realista: compromissos, foco, estudos, descanso e imprevistos em um só lugar.",
      },
      { property: "og:title", content: "RUMO by Teacher Paul — Seu sistema operacional pessoal" },
      {
        property: "og:description",
        content:
          "Clareza, direção e tempo de volta. Planeje o dia real, não um dia ideal. Powered by Método BÚSSOLA™.",
      },
    ],
  }),
  component: Landing,
});

const pillars = [
  {
    icon: Compass,
    title: "Direção antes de velocidade",
    text: "Prioridades claras para o dia, sem tentar preencher cada minuto da agenda.",
  },
  {
    icon: Clock,
    title: "Tempo de volta",
    text: "Deslocamentos, descanso e imprevistos entram na conta desde o planejamento.",
  },
  {
    icon: Target,
    title: "Planejado versus realizado",
    text: "Indicadores compreensíveis um a um, sem índice único de produtividade.",
  },
  {
    icon: ShieldCheck,
    title: "Sustentável por princípio",
    text: "Sono, alimentação, exercício e família fazem parte do sistema, não do resíduo.",
  },
];

function Landing() {
  return (
    <div className="min-h-screen bg-navy text-navy-foreground">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-6 sm:px-6">
        <RumoLogo />
        <Button asChild variant="secondary" size="sm">
          <Link to="/today">Entrar na demonstração</Link>
        </Button>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <section className="grid gap-10 py-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-20">
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-gold">
              Powered by Método BÚSSOLA™
            </p>
            <h1 className="mt-5 text-4xl font-semibold leading-[1.08] text-balance-tight sm:text-5xl lg:text-6xl">
              Seu sistema operacional pessoal.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-navy-foreground/75">
              O RUMO ajuda profissionais com rotinas fragmentadas a transformar prioridades em
              execução realista — considerando compromissos fixos, deslocamentos, estudos,
              trabalho, descanso e o que a vida não avisa que vai acontecer.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-gold text-gold-foreground hover:bg-gold/90">
                <Link to="/today">
                  Ver o RUMO por dentro
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-navy-foreground/25 bg-transparent text-navy-foreground hover:bg-navy-soft"
              >
                <Link to="/plan">Conhecer o planejamento</Link>
              </Button>
            </div>
            <p className="mt-6 text-xs text-navy-foreground/55">
              Versão de demonstração navegável, com dados de exemplo. Nenhuma conta é criada nesta
              etapa.
            </p>
          </div>

          <Card className="border-navy-foreground/15 bg-navy-soft/40 text-navy-foreground shadow-none backdrop-blur">
            <CardContent className="space-y-5 pt-6">
              <p className="text-[11px] uppercase tracking-[0.18em] text-gold">Hoje, em uma tela</p>
              {[
                { label: "Prioridades do dia", value: "3 definidas" },
                { label: "Compromissos fixos", value: "4 na agenda" },
                { label: "Blocos de foco", value: "2 reservados" },
                { label: "Planejado versus realizado", value: "6h30 / 4h15" },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between gap-4 border-b border-navy-foreground/10 pb-4 last:border-0 last:pb-0"
                >
                  <span className="min-w-0 truncate text-sm text-navy-foreground/70">
                    {row.label}
                  </span>
                  <span className="shrink-0 font-display text-sm font-semibold">{row.value}</span>
                </div>
              ))}
              <p className="text-xs text-navy-foreground/50">Dados de exemplo.</p>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-5 border-t border-navy-foreground/10 pt-14 sm:grid-cols-2 lg:grid-cols-4">
          {pillars.map(({ icon: Icon, title, text }) => (
            <div key={title} className="min-w-0">
              <Icon className="size-5 text-gold" aria-hidden />
              <h2 className="mt-4 text-base font-semibold">{title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-navy-foreground/70">{text}</p>
            </div>
          ))}
        </section>

        <section className="mt-16 rounded-2xl border border-navy-foreground/12 bg-navy-soft/30 p-8">
          <h2 className="text-xl font-semibold">Independente por padrão</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-navy-foreground/70">
            O RUMO funciona integralmente sozinho. No futuro, será possível conectar opcionalmente
            a conta do Smart Schedule Pro para importar eventos, contatos e locais favoritos — mas
            nenhuma funcionalidade essencial dependerá disso.
          </p>
        </section>
      </main>

      <footer className="border-t border-navy-foreground/10 py-8">
        <p className="mx-auto max-w-6xl px-4 text-xs text-navy-foreground/50 sm:px-6">
          RUMO by Teacher Paul — Powered by Método BÚSSOLA™
        </p>
      </footer>
    </div>
  );
}
