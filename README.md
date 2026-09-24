# RUMO by Teacher Paul

RUMO é um sistema operacional pessoal para transformar prioridades em uma execução realista, considerando compromissos, tarefas, foco, descanso, imprevistos e consistência de hábitos.

O RUMO é independente do Smart Schedule Pro. Uma integração com o Smart Schedule poderá ser adicionada no futuro, de forma opcional, para organizar ou importar informações de agenda. Nenhuma integração está ativa nesta versão.

## Estado atual do MVP

O RUMO possui dois modos explícitos:

- **Autenticado** — usa Supabase Auth, dados reais por usuário, RLS e persistência de tarefas, projetos, categorias, prioridades, hábitos, sessões de foco e preferências de alertas.
- **Demonstração** — ativado por `?mode=demo`, usa fixtures locais, não acessa dados autenticados, não chama IA real e não grava no Supabase.

O MVP inclui autenticação, Today, Tasks, Plan, Review, Dashboard, Focus, Hábitos, preferências por usuário e a Central de alertas determinísticos. O Planejador do dia usa a abstração de provider de IA e mantém aprovação manual para alterações sugeridas.

Nenhuma credencial, secret ou chave privada deve ser incluída no repositório ou no frontend.

## Telas e rotas

- `/` — landing page e entrada na demonstração;
- `/login` e `/signup` — autenticação;
- `/today` — prioridades, compromissos, foco, check-in de energia, planejado versus realizado e resumo compacto de hábitos;
- `/plan` — planejamento semanal, capacidade, blocos de foco, conflitos e legenda de estados;
- `/tasks` — tarefas e projetos persistentes no modo autenticado; fixtures locais no demo;
- `/focus` — timer com histórico persistido de sessões autenticadas;
- `/habits` — hábitos persistentes por usuário, com check-ins por data;
- `/review` — revisão semanal baseada nos dados persistidos disponíveis;
- `/dashboard` — indicadores baseados nos dados reais autenticados ou nas fixtures do demo;
- `/settings` — perfil, preferências, categorias, notificações e privacidade.

No desktop, a aplicação usa uma sidebar. Em telas pequenas, usa navegação inferior. A tela Today mantém hábitos como resumo secundário; o gerenciamento completo fica em `/habits`.

## Dados e interações

No modo autenticado, operações são gravadas pelo cliente Supabase existente e protegidas por RLS. O `user_id` é derivado da sessão; o frontend não usa `service_role`.

No modo demo, as interações são locais à sessão e não simulam uma gravação no servidor.

### Categorias

Configurações permite criar, renomear, ativar e desativar categorias. No modo autenticado, as categorias são persistidas por usuário; no demo, permanecem locais. Categorias desativadas não aparecem em novos seletores, mas permanecem disponíveis para interpretar dados históricos.

### Habit Tracker

`/habits` mostra os hábitos padrão iniciais e permite:

- criar e editar hábitos personalizados;
- ativar e desativar hábitos sem exclusão física;
- escolher frequência diária, a cada X dias ou a cada X horas;
- usar metas de ocorrência, duração ou quantidade;
- registrar check-ins como **Feito**, **Em progresso** ou **Modo leve**;
- remover o check-in do dia.

No modo autenticado, hábitos e check-ins permanecem após reload e novo login. No demo, alterações permanecem somente na sessão. Modo leve significa que a meta mínima foi cumprida e é tratado como progresso válido. Não há pontos, streaks, gamificação ou linguagem punitiva.

### Foco

O timer permite selecionar 25, 50, 90 minutos ou uma duração personalizada, além de pausar, reiniciar e encerrar a sessão. No modo autenticado, sessões encerradas entram no histórico persistido; o bloco em andamento permanece temporário. O bloqueio de smartphone durante o foco não faz parte do MVP.

### Alertas e Planejador

A Central de alertas calcula alertas de tarefas atrasadas, prazos próximos, prioridades abertas, hábitos pendentes e sessões de foco. As preferências são persistidas por usuário e os dismissals permanecem locais nesta etapa.

O botão de notificações foreground solicita permissão somente após ação explícita. A entrega pode ser ativada ou desativada na aba atual sem revogar a permissão do navegador. O resumo diário possui contrato e horário configurável, mas ainda não tem envio agendado por backend.

## Stack técnica

- React 19 e React DOM;
- TypeScript;
- Vite 8 com TanStack Start;
- TanStack Router para rotas e SSR;
- TanStack Query para carregamento e estados assíncronos;
- Supabase Auth, PostgREST e RLS para dados autenticados;
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
├── hooks/           hooks de autenticação, tarefas, hábitos e responsividade
├── lib/             repositories, regras de alertas, IA, dados demo e utilitários
├── integrations/    cliente e tipos gerados do Supabase
├── supabase/        migrations incrementais e políticas RLS
├── routes/          landing, shell da aplicação e telas do produto
├── router.tsx       configuração do router
├── server.ts        entrada SSR com tratamento de erros
└── styles.css       tokens visuais e estilos globais
```

As fixtures ficam em `src/lib/demo-data.ts` e `src/lib/habit-data.ts`, sendo usadas somente quando `mode=demo`. Providers e repositories autenticados carregam dados do Supabase sem fallback silencioso para fixtures.

## Decisões técnicas

### SSR e hidratação

TanStack Start renderiza a aplicação com SSR. Fixtures demo são fornecidas como `initialData`; rotas autenticadas aguardam a sessão e os providers correspondentes. O estado de entrega foreground é temporário e não usa storage do navegador.

### Timezone da demonstração

As datas da demonstração usam `Asia/Tokyo` como referência. Isso é uma decisão dos dados de exemplo, não uma conexão com calendário ou localização.

### Estado local compartilhado

Categorias, tarefas e hábitos usam providers React montados no `AppShell`; repositories Supabase cuidam da persistência autenticada. O modo demo usa providers locais separados e não acessa o banco.

### Preview com Wrangler

`npm run build` gera o artefato `.output` com Nitro. `npm run preview` usa Wrangler para servi-lo localmente, sem publicar ou fazer deploy.

## Limitações atuais

- Smart Schedule Pro não está conectado;
- notificações foreground dependem do suporte e da permissão do navegador e funcionam enquanto a aba está ativa;
- não há service worker, push mobile ou resumo diário agendado;
- o histórico do Focus não oferece ainda analytics avançado;
- frequências por horas estão representadas no modelo, mas o MVP usa um check-in diário simples;
- o bloqueio de smartphone durante o foco não existe;
- gamificação, pontos e streaks não existem;
- dados do modo demo são fictícios e não representam uma pessoa, empresa ou família real.

## Roadmap pós-MVP

Fora do escopo desta entrega, os próximos passos possíveis são:

1. adicionar service worker e push mobile;
2. criar Edge Function e scheduler para resumo diário;
3. adicionar uma integração futura e opcional com Smart Schedule Pro;
4. evoluir histórico, notificações e métricas com critérios de privacidade;
6. explorar gamificação de forma cuidadosa e opcional;
7. planejar o modo futuro de bloqueio de smartphone durante o foco, mantendo chamadas e alertas de desastre permitidos.

Esses itens são direcionais e não estão implementados neste repositório.

## Aviso de demonstração

O modo `?mode=demo` é um ambiente isolado para avaliação. Seus dados são demonstrativos, as interações são temporárias e nenhuma ação cria uma conta, salva informações ou envia dados para serviços externos. O modo autenticado usa somente os dados da conta ativa e as políticas RLS do Supabase.
