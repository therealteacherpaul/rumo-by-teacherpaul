import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowRightCircle,
  CalendarCheck,
  CircleAlert,
  CloudLightning,
  Lightbulb,
  Sparkles,
  TimerReset,
  Trophy,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { DemoNotice } from "@/components/common/DemoBadge";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { useDemoQuery } from "@/hooks/use-demo-query";
import { reviewData } from "@/lib/demo-data";

export const Route = createFileRoute("/_app/review")({
  head: () => ({
    meta: [
      { title: "Revisão semanal — RUMO by Teacher Paul" },
      {
        name: "description",
        content:
          "Compare planejado e realizado, registre imprevistos, vitórias, dificuldades e ajustes para a próxima semana.",
      },
      { property: "og:title", content: "Revisão semanal — RUMO by Teacher Paul" },
      {
        property: "og:description",
        content: "Uma revisão honesta da semana, sem culpa e com ajustes concretos.",
      },
    ],
  }),
  component: ReviewPage,
});

function ListBlock({
  title,
  description,
  icon: Icon,
  items,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  items: string[];
}) {
  return (
    <SectionCard
      title={title}
      description={description}
      action={<Icon className="size-4 text-gold" aria-hidden />}
    >
      <ul className="space-y-2.5">
        {items.map((item) => (
          <li
            key={item}
            className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-2.5 text-sm"
          >
            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-gold" aria-hidden />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}

function ReviewPage() {
  const { data } = useDemoQuery(["review"], () => reviewData);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Semana de 24/08 a 30/08"
        title="Revisão semanal"
        description="Revisar não é cobrar. É comparar o plano com a realidade e ajustar o próximo ciclo com informação de verdade."
      />

      <DemoNotice />

      <div className="grid gap-6 lg:grid-cols-2">
        <ListBlock
          title="O que foi planejado"
          description="Compromissos assumidos no início da semana."
          icon={CalendarCheck}
          items={data.planned}
        />
        <ListBlock
          title="O que foi realizado"
          description="O que efetivamente aconteceu."
          icon={Sparkles}
          items={data.done}
        />
        <ListBlock
          title="Tarefas adiadas"
          description="Adiar com consciência é decidir, não falhar."
          icon={TimerReset}
          items={data.postponed}
        />
        <ListBlock
          title="Imprevistos"
          description="O que a semana trouxe sem avisar."
          icon={CloudLightning}
          items={data.unexpected}
        />
        <ListBlock
          title="Vitórias"
          description="Registre o que funcionou."
          icon={Trophy}
          items={data.wins}
        />
        <ListBlock
          title="Dificuldades"
          description="Onde o plano encontrou atrito."
          icon={CircleAlert}
          items={data.struggles}
        />
        <ListBlock
          title="Aprendizados"
          description="O que essa semana ensinou sobre o seu ritmo."
          icon={Lightbulb}
          items={data.learnings}
        />
        <ListBlock
          title="Ajustes para a próxima semana"
          description="Poucas mudanças, bem escolhidas."
          icon={ArrowRightCircle}
          items={data.adjustments}
        />
      </div>
    </div>
  );
}
