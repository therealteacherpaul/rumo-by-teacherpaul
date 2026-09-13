# RUMO by Teacher Paul

RUMO é um sistema operacional pessoal para transformar prioridades em uma execução realista, considerando compromissos, tarefas, foco, descanso, imprevistos e consistência de hábitos.

O RUMO é independente do Smart Schedule Pro. Uma integração com o Smart Schedule poderá ser adicionada no futuro, de forma opcional, para organizar ou importar informações de agenda. Nenhuma integração está ativa nesta versão.

## Estado atual do MVP

Este repositório contém um MVP frontend demonstrativo, navegável e executado com dados locais de exemplo. Atualmente:

- não há autenticação;
- não há banco de dados;
- não há persistência;
- não há `localStorage` ou cookies para salvar alterações;
- não há APIs, backend ou integrações externas conectadas;
- alterações em tarefas, foco, hábitos, categorias e preferências valem somente enquanto a sessão da demonstração permanece aberta;
- todos os dados exibidos são fictícios e demonstrativos.

O produto e este repositório não devem conter credenciais, segredos ou dados pessoais reais.

## Telas e rotas

- `/` — landing page e entrada na demonstração;
- `/today` — prioridades, compromissos, foco, check-in de energia, planejado versus realizado e resumo compacto de hábitos;
- `/plan` — planejamento semanal, capacidade, blocos de foco, conflitos e legenda de estados;
- `/tasks` — tarefas e projetos demonstrativos, com categorias, prioridades, prazos, estimativas, filtros e conclusão local;
- `/focus` — timer de foco, duração personalizada, pausa, reinício, encerramento e histórico temporário de sessões;
- `/habits` — Habit Tracker local, com criação, edição, ativação, desativação, filtros e check-ins;
- `/review` — revisão semanal com planejado, realizado, adiamentos, imprevistos, vitórias, dificuldades e aprendizados;
- `/dashboard` — indicadores e gráficos demonstrativos de tarefas, horas, foco, sono, treino, estudo, trabalho, deslocamento e refeições;
- `/settings` — perfil, preferências, categorias, notificações, privacidade e integrações opcionais.

No desktop, a aplicação usa uma sidebar. Em telas pequenas, usa navegação inferior. A tela Today mantém hábitos como resumo secundário; o gerenciamento completo fica em `/habits`.

## Interações demonstrativas

As interações são locais e não simulam uma gravação no servidor.

### Categorias

Configurações permite criar, renomear, ativar e desativar categorias dentro dos limites do modelo local. Categorias desativadas não aparecem em novos seletores, mas permanecem disponíveis para interpretar dados históricos. IDs e relações existentes são preservados.

### Habit Tracker

`/habits` começa com hábitos demonstrativos padrão e permite, durante a sessão:

- criar e editar hábitos personalizados;
- ativar e desativar hábitos sem exclusão física;
- escolher frequência diária, a cada X dias ou a cada X horas;
- usar metas de ocorrência, duração ou quantidade;
- registrar check-ins como **Feito**, **Em progresso** ou **Modo leve**;
- remover o check-in do dia.

Modo leve significa que a meta mínima foi cumprida e é tratado como progresso válido. Não há pontos, streaks, gamificação ou linguagem punitiva. O resumo compacto de `/today` oferece os mesmos check-ins essenciais e aponta para a tela completa.

### Foco

O timer permite selecionar 25, 50, 90 minutos ou uma duração personalizada, além de pausar, reiniciar e encerrar a sessão. O histórico é temporário e desaparece ao recarregar ou sair da sessão. O bloqueio de smartphone durante o foco não faz parte do MVP.

## Stack técnica

- React 19 e React DOM;
- TypeScript;
- Vite 8 com TanStack Start;
- TanStack Router para rotas e SSR;
- TanStack Query para consumo síncrono das fixtures locais;
- Tailwind CSS 4 e `tw-animate-css`;
- componentes no estilo shadcn/ui, baseados em Radix UI;
- React Hook Form e Zod para o formulário demonstrativo de perfil;
- Recharts para os gráficos do Dashboard;
- Lucide React para ícones;
- `date-fns` para utilitários de data;
- Nitro com preset Cloudflare para o build.

## Requisitos e execução

É necessário ter Node.js e npm instalados. O projeto não depende de Bun.

```sh
npm install
npm run dev
```

O Vite informa no terminal a porta disponível, normalmente `http://127.0.0.1:8080`. Para servir o artefato de produção localmente, execute primeiro `npm run build` e depois `npm run preview`.

## Scripts

| Script | Função |
| --- | --- |
| `npm run dev` | inicia o servidor de desenvolvimento Vite; |
| `npm run build` | gera o build de produção com Vite, TanStack Start e Nitro; |
| `npm run build:dev` | gera um build usando o modo de desenvolvimento; |
| `npm run preview` | serve `.output` com Wrangler; |
| `npm run lint` | executa o ESLint; |
| `npm run typecheck` | executa o TypeScript em modo de verificação; |
| `npm run format` | formata os arquivos com Prettier. |

Fluxo recomendado de validação:

```sh
npm run lint
npm run typecheck
npm run build
npm run preview
```

## Arquitetura

```text
src/
├── components/
│   ├── brand/       identidade do RUMO
│   ├── categories/  CategoryProvider e contexto de categorias
│   ├── common/      cabeçalhos, cards, estados e avisos de demonstração
│   ├── habits/      HabitProvider, contexto e resumo de Today
│   ├── layout/      AppShell e navegação
│   └── ui/          componentes reutilizáveis baseados em Radix
├── hooks/           hooks de categorias, hábitos, responsividade e fixtures
├── lib/             dados demonstrativos, modelo de hábitos, navegação e datas
├── routes/          landing, shell da aplicação e telas do produto
├── router.tsx       configuração do router
├── server.ts        entrada SSR com tratamento de erros
└── styles.css       tokens visuais e estilos globais
```

As fixtures principais ficam em `src/lib/demo-data.ts` e são consumidas localmente por `src/hooks/use-demo-query.ts`. O modelo e as fixtures do Habit Tracker ficam em `src/lib/habit-data.ts`. `CategoryProvider` e `HabitProvider` criam cópias locais dos dados iniciais e compartilham alterações somente durante a sessão.

## Decisões técnicas

### SSR e hidratação

TanStack Start renderiza a aplicação com SSR. Fixtures síncronas são fornecidas como `initialData` do TanStack Query, mantendo o mesmo snapshot na renderização do servidor e na primeira renderização do cliente. O estado interativo começa após a hidratação e não é persistido.

### Timezone da demonstração

As datas da demonstração usam `Asia/Tokyo` como referência. Isso é uma decisão dos dados de exemplo, não uma conexão com calendário ou localização.

### Estado local compartilhado

Categorias e hábitos usam providers React montados no `AppShell`. Assim, Today, Tasks, Plan, Focus, Dashboard, Settings e Habits podem resolver o estado necessário durante a sessão, sem `localStorage`, cookies ou estado externo.

### Preview com Wrangler

`npm run build` gera o artefato `.output` com Nitro. `npm run preview` usa Wrangler para servi-lo localmente, sem publicar ou fazer deploy.

## Limitações atuais

- não há autenticação, contas ou autorização;
- não há banco de dados, backend, API ou persistência;
- alterações locais desaparecem ao recarregar ou encerrar a sessão;
- Smart Schedule Pro não está conectado;
- notificações, lembretes e automações não são reais;
- métricas e gráficos do Dashboard são exemplos;
- o histórico de foco e os check-ins de hábitos são temporários;
- frequências por horas estão representadas no modelo, mas o MVP usa um check-in diário simples;
- o bloqueio de smartphone durante o foco não existe;
- gamificação, pontos e streaks não existem;
- os dados não representam uma pessoa, empresa ou família real.

## Roadmap pós-MVP

Fora do escopo desta entrega acadêmica, os próximos passos possíveis são:

1. definir persistência, contas e autorização;
2. substituir fixtures por dados reais sem perder a experiência essencial;
3. sincronizar tarefas, hábitos, categorias, agenda e preferências entre sessões;
4. adicionar uma integração futura e opcional com Smart Schedule Pro;
5. evoluir histórico, notificações e métricas com critérios de privacidade;
6. explorar gamificação de forma cuidadosa e opcional;
7. planejar o modo futuro de bloqueio de smartphone durante o foco, mantendo chamadas e alertas de desastre permitidos.

Esses itens são direcionais e não estão implementados neste repositório.

## Aviso de demonstração

O RUMO apresentado aqui é um MVP frontend para avaliação acadêmica. Os dados são demonstrativos, as interações são temporárias e nenhuma ação cria uma conta, salva informações ou envia dados para serviços externos.
