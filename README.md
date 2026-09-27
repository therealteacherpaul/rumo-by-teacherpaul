# RUMO by Teacher Paul

## Projeto acadêmico — Sistema Operacional Pessoal (POS) — RUMO, by Teacher Paul

**Aluno:** Paulo Ricardo Takara Stefens
**RA:** 232231
**Instituição:** UniFECAF
**Disciplina:** Produtividade e Gestão do Tempo

**Seu sistema operacional pessoal — Powered by Método BÚSSOLA™.**

Aplicação acadêmica de produtividade para organizar tarefas, projetos, prioridades, hábitos e sessões de foco. A proposta considera descanso e imprevistos, sem preencher todo o tempo disponível.

## Versão de entrega

A branch `entrega` parte de `3af52ac`, presente em `feat/ui-ux-audit-2026-09-18` e `origin/fix/foundation-review` na auditoria de 27/09/2026. A `main` permanece em uma versão anterior. Esta preparação é local, sem publicação.

- [Aplicação publicada](https://rumo-by-teacherpaul.lovable.app)
- [Demonstração sem cadastro](https://rumo-by-teacherpaul.lovable.app/today?mode=demo)
- [Repositório](https://github.com/therealteacherpaul/rumo-by-teacherpaul)

A página pública e a tela Hoje em demonstração foram acessadas nesta revisão. Isso não comprova que o site publicado corresponde ao commit desta branch nem valida os fluxos autenticados.

## Funcionalidades e evidências

“Implementado” indica código presente; não significa validação ponta a ponta em produção.

| Recurso | Implementação nesta branch | Evidência e limite |
| --- | --- | --- |
| Autenticação | Cadastro, login, logout via Supabase e proteção das rotas autenticadas | Conferido no código; ciclo real não repetido nesta revisão |
| Tarefas, projetos, categorias e prioridades | Leitura e gravação no Supabase, com migrations e políticas RLS por proprietário | Conferido nos providers e migrations; CRUD remoto não exercitado |
| Hábitos | Hábitos recorrentes, metas, modo leve e check-ins; persistência autenticada e inicialização por RPC | Testes de componentes com repositório controlado e SQL de hábitos em PGlite passaram; não equivalem a Supabase remoto |
| Focus | Seleção de tarefa, temporizador, pausa/retomada e gravação de sessões no histórico autenticado | Código e teste estático da migration; ciclo completo no navegador não repetido |
| Plan e Review | Prazos e progresso por projeto; resumo semanal de tarefas e hábitos | Três testes de cálculo passaram; não há integração de calendário externo |
| Planejador com IA | Função de servidor autenticada chama o gateway Lovable; interface permite revisar e aplicar sugestões | Integração presente no código; chamada real e gravação das sugestões não testadas nesta revisão; suíte de planejamento tem bloqueio de execução |
| Alertas | Regras determinísticas, preferências persistentes e notificações do navegador com a aplicação aberta | Testes de regras, contrato SQL e entrega com simulação passaram; permissão real não solicitada |
| Demonstração | Fixtures explícitas por `?mode=demo`, hábitos locais e sugestões calculadas localmente | Não representa persistência autenticada; dados e decisões podem ser descartados ao recarregar |

A IA depende de configuração e disponibilidade do gateway, sessão válida e créditos. `LOVABLE_API_KEY` é lida apenas no servidor. Não há promessa de funcionamento offline nem de entrega de notificações com o navegador fechado. O horário do resumo diário é uma preferência/contrato; não há agendador implementado.

## Como demonstrar

1. Abra `/today?mode=demo` ou escolha **Entrar na demonstração** na página inicial.
2. Navegue por Hoje, Tarefas, Foco, Hábitos, Planejamento, Revisão semanal e Dashboard. Mantenha `?mode=demo` para usar os exemplos.
3. No Planejador do dia, ajuste o tempo disponível e gere sugestões locais. Elas não comprovam uma chamada ao modelo de IA.
4. Para dados persistentes, use `/login` com uma conta autorizada no ambiente de avaliação. `/signup` oferece cadastro, sujeito às configurações de autenticação do backend. Não há credenciais de teste neste documento.
5. Use uma conta e um backend dedicados para testar gravações. Abrir uma conta autenticada pode inicializar hábitos; não use produção para uma avaliação que deva ser somente leitura.

## Arquitetura

- React 19, TypeScript, TanStack Start/Router e TanStack Query.
- Vite 8, Tailwind CSS 4, componentes Radix/shadcn e Bun com `bun.lock`.
- Supabase Auth e PostgreSQL; migrations, constraints e políticas RLS em `supabase/migrations/`.
- `TaskDataProvider` e repositórios de hábitos, Focus e alertas para dados autenticados; providers separados para demonstração.
- Função de servidor TanStack para o planejador; build Nitro/Cloudflare configurado pelo pacote Lovable.

`src/` contém o produto, `public/` seus assets, `tests/` testes locais e `supabase/tests/` verificações SQL adicionais. `.lovable/`, `AGENTS.md`, configurações e lockfile devem ser preservados. `src/routeTree.gen.ts` e tipos gerados do Supabase já são rastreados e participam da compilação; não foram removidos.

## Execução local

Ambiente desta validação: Bun 1.4.2 e Node.js 24.11.1. Use Node 24 para os testes que importam TypeScript diretamente.

```bash
bun install --frozen-lockfile
bun run dev --host 127.0.0.1 --port 5187
```

Abra `http://127.0.0.1:5187/today?mode=demo`. Consulte a saída do Vite caso a porta não esteja disponível.

### Configuração de ambiente

O `.env` herdado já é rastreado e contém configuração pública do projeto vinculado. Não o substitua nem acrescente segredos nele. Para usar um backend próprio, copie `.env.example` para `.env.local` e preencha os valores desse ambiente. Esse arquivo local é ignorado pelo Git.

- `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`: configuração pública do cliente.
- `SUPABASE_URL` e `SUPABASE_PUBLISHABLE_KEY`: configuração correspondente do servidor.
- `LOVABLE_API_KEY`: opcional para a demonstração, necessária para IA autenticada; configurar somente no servidor, nunca com prefixo `VITE_`.

O backend autenticado precisa do schema e das políticas compatíveis com as migrations. A sequência completa de migrations em uma instalação vazia não foi validada nesta entrega; não execute migrations automaticamente contra produção. O módulo administrativo existente não é necessário para a demonstração e nenhuma chave administrativa é fornecida no exemplo.

### Verificações reproduzíveis

```bash
bun run typecheck
bun run lint
bun run build
```

Instalação, typecheck e build passaram. O build emite avisos de tamanho de bundle e configuração de divisão de código. O lint ainda falha com 480 erros e 2 avisos preexistentes; não foi aplicada formatação ampla.

Não há script `test` no `package.json`. Os testes usam `node:test`; alguns exigem ferramentas isoladas fora do checkout:

```bash
npm install --prefix /tmp/rumo-entrega-test-tools --no-package-lock --ignore-scripts @electric-sql/pglite@0.5.8 react@19.2.0 react-test-renderer@19.2.0 esbuild@0.28.2
RUMO_TEST_MODULES=/tmp/rumo-entrega-test-tools/node_modules node --test tests/*.test.mjs
```

Resultado desta revisão: **14 testes passaram; `planning.test.mjs` falhou no carregamento**, pois o Node não resolve `@/integrations` importado pela função de servidor. Seus casos não foram executados. A suíte completa não está aprovada. Testes de Focus e alertas verificam também texto/estrutura do código SQL; somente a suíte SQL de hábitos executa PostgreSQL local nesta rodada. `supabase/tests/` não foi executado contra banco remoto.

`bun run preview` existe e usa Wrangler, mas não foi validado nesta entrega. Nenhum comando de publicação foi executado.

## Limitações e próximos passos

- Validação autenticada ponta a ponta, envio real de notificações e chamada real de IA ainda precisam ser repetidos no ambiente de avaliação.
- Corrigir a execução isolada da suíte de planejamento e os erros de lint em trabalho separado.
- Confirmar o schema remoto e a correspondência entre versão publicada e branch de entrega.
- Itens planejados, sem implementação completa nesta branch: push com navegador fechado, agendamento de resumos, service worker/offline, calendários externos e captura automática de contexto.
- Relatórios datados em `docs/` registram etapas anteriores; afirmações como “integração pendente” ou “Focus temporário” nesses relatórios não descrevem necessariamente esta versão.

## Evidências acadêmicas

Veja [auditoria desta entrega](docs/entrega-validation.md) para resultados, limitações e arquivos herdados que merecem revisão separada. Não foi encontrado um relatório final independente do README entre os arquivos versionados.

Não há screenshots versionados nesta base. Para uma coleta posterior, use exclusivamente dados de demonstração e salve em `docs/screenshots/`: `today.png`, `tasks.png`, `focus.png`, `habits.png`, `plan-review.png` e `ai-planner.png`. Esses nomes são uma proposta, não evidências já existentes. Não inclua dados pessoais, credenciais ou capturas de contas reais.
