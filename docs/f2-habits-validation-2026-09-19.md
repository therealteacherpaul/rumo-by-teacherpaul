# F2 — Persistência de hábitos autenticados

Data da revisão final: 2026-09-19, 22:49 JST (Asia/Tokyo).
Checkout: `/Users/takarastefens/Downloads/RUMO-ui-audit`.
Branch: `feat/ui-ux-audit-2026-09-18`.
HEAD preservado: `1ff8905a1e876d01c7f7e0235000e2d4f3a9eef0`.
Relação com a referência local `origin/fix/foundation-review`: 0 à frente, 6 atrás. Sem integração ou novo fetch nesta rodada.

## Resultado e limite de validação

Implementação local pronta para revisão. **A migration não foi aplicada remotamente. A persistência ponta a ponta no Supabase e o ciclo real logout/login ainda não estão validados.** Nenhum commit, push, merge, rebase, reset, deploy ou alteração direta no banco remoto foi realizado. Plan, Review, autenticação e fixtures não foram alterados. As mudanças anteriores do F1 foram preservadas; Console/Network do F1 não foi repetido e nenhum status HTTP foi inferido.

## Schema incremental

Arquivo: `supabase/migrations/20260919025408_authenticated_habits.sql`, criado com `supabase migration new`, sem editar migrations anteriores.

- `user_habits`: UUID, proprietário obrigatório, nome, origem do padrão (`system`) ou personalizado (`user`), ativo, frequência/intervalo, tipo/valor/unidade da meta, meta mínima opcional, data inicial e timestamps.
- `habit_check_ins`: proprietário, hábito, data, valor, modo principal/leve e timestamps. Chave composta `(user_id, habit_id, date)` permite um registro por hábito/data. FK `(user_id, habit_id)` impede referências entre contas e remove registros quando o hábito é excluído.
- `habit_initializations`: marcador durável por usuário com timestamps, para impedir que padrões excluídos sejam recriados.

Constraints: nomes de 1–100 caracteres, unicidade por usuário sem distinção de caixa/espaços externos, intervalos válidos (dias 1–365, horas 1–24), metas positivas, valores finitos limitados a 1 milhão, mínimo não superior à meta e unidade obrigatória somente para quantidade. Trigger impõe os limites existentes do produto (20 totais, 12 ativos, 10 personalizados), protege identidade/origem e atualiza timestamps. Índices cobrem usuário/ativo e usuário/data, além das chaves e da unicidade dos nomes.

## Segurança

RLS habilitada nas três tabelas. Sem autorização baseada em `user_metadata` e sem `service_role` no frontend.

| Tabela | SELECT | INSERT | UPDATE | DELETE |
| --- | --- | --- | --- | --- |
| user_habits | habits_select | habits_insert | habits_update | habits_delete |
| habit_check_ins | check_ins_select | check_ins_insert | check_ins_update | check_ins_delete |
| habit_initializations | initialization_select | initialization_insert | initialization_update | initialization_delete |

As duas tabelas de dados permitem CRUD apenas quando `auth.uid() = user_id`, com `USING` e `WITH CHECK` no UPDATE. O frontend omite `user_id` nas gravações; o banco usa `auth.uid()` como default e verifica a propriedade mesmo se um cliente malicioso enviar outro ID. IDs das entidades, proprietário e origem são imutáveis nas atualizações.

No marcador, SELECT é restrito ao proprietário; as policies de escrita negam acesso e os grants de escrita não são concedidos ao cliente. `anon` não tem acesso às tabelas nem à inicialização.

A RPC `initialize_user_habits()` não recebe ID de usuário. Usa exclusivamente `auth.uid()`, exige sessão, tem `search_path` vazio, sem SQL dinâmico, execução revogada de PUBLIC/anon e concedida a authenticated. SECURITY DEFINER fica restrito à inicialização da própria conta. Um advisory lock por usuário serializa a inicialização; o marcador e os hábitos são inseridos na mesma transação.

Referência consultada antes de implementar: https://supabase.com/docs/guides/database/postgres/row-level-security e changelog oficial do Supabase.

## Regra explícita dos padrões

Na primeira carga autenticada, a RPC verifica o marcador. Se já existe, não faz nada. Se não existe e o usuário já possui qualquer hábito na nova tabela, preserva a coleção integralmente e apenas registra a inicialização. Se a coleção está vazia e nunca foi inicializada, cria oito padrões de produto:

Beber água, Meditar, Dormir no horário, Orar, Exercitar-se, Ler, Alongar e Planejar o dia — com as metas e frequências iniciais já oferecidas pelo produto. IDs são novos UUIDs do banco; a data inicial é `current_date` do banco. Os check-ins começam vazios. Não são copiadas edições, IDs, datas históricas ou conclusões das fixtures/demo.

Reload, novo login e chamadas repetidas não duplicam os padrões. Excluir todos os hábitos mantém uma coleção vazia, com CTA para criar, pois o marcador é preservado. Não há backfill destrutivo nem trigger novo em auth.users. Edições antigas que existiam apenas em memória no provider anterior não podem ser recuperadas automaticamente.

## Aplicação e UX

- HabitProvider seleciona explicitamente o provider autenticado ou o provider local demo. Não há fallback de fixtures em loading, vazio ou erro autenticado.
- Provider autenticado carrega hábitos/check-ins, pagina os registros e confirma as gravações antes de atualizar a UI. Troca de usuário remonta o estado; respostas atrasadas do usuário anterior são descartadas.
- Criar, editar, ativar, desativar, excluir com confirmação, registrar progresso e reabrir por data. Nenhuma exclusão ocorre ao simplesmente abrir o diálogo.
- Falhas de carga/gravação têm recuperação por nova carga; operações simultâneas são bloqueadas durante salvamento.
- Hábitos inativos ou não previstos para hoje continuam acessíveis para edição. IDs de campos de criação/edição são distintos; Escape restaura foco.
- Today usa a data local para hábitos autenticados e conserva a data fixa do demo. O Planejador fica indisponível se os hábitos não carregaram, evitando gerar com uma fonte silenciosamente incompleta. Sua descrição diferencia persistência autenticada da sessão demo.
- Nenhum aviso de dados de exemplo aparece em hábitos autenticados. O aviso continua presente no demo explícito.

## Validação executada

| Verificação | Resultado |
| --- | --- |
| Typecheck | Passou |
| Build | Passou; log local em `/tmp/rumo-f2-build.log` |
| git diff --check | Passou |
| ESLint direcionado, incluindo arquivos pendentes do F1 | Passou, sem erros ou warnings após os ajustes |
| SQL local com PGlite | Passou: CRUD, constraints, limites, RLS, isolamento entre contas, FK composta, acesso anônimo negado, inicialização idempotente, preservação de coleção existente e exclusão em cascata |
| Componentes | 3 testes passaram: loading/erro/retry/vazio, isolamento contra respostas atrasadas, CRUD e recarga após remount, bloqueio de gravação simultânea, recuperação de falha, demo local com reset |
| Regressão Planejador | 11 testes existentes passaram |
| Chrome autenticado local | Sessão confirmada. `/habits` exibe erro recuperável sem fixtures; retry funciona. `/today` continua carregando e a navegação permanece disponível |
| Chrome demo | Criar, editar, concluir (100%), reabrir, desativar e reativar passaram. Reload restaurou os padrões e descartou o hábito de teste. Sair do demo preservou `/habits` e removeu a query |
| Responsivo | Sem overflow em 390, 768 e 1440 px. Diálogo de edição em 390×844: largura 390, altura 754, dentro do viewport; formulário utilizável. Escape devolveu foco ao botão de edição. Viewport restaurado ao final |
| Persistência real + logout/login no Supabase | **Pendente**: depende da aplicação autorizada da migration; remount com repositório controlado foi validado no teste de componente, não substitui o E2E real |

O harness usa PGlite (PostgreSQL local) com papéis/auth.uid de teste e um repositório controlado nos testes React. Isso não testa PostgREST, JWT real, concorrência entre múltiplas conexões ou uma instalação Supabase completa. React Test Renderer emite seu aviso de depreciação; não houve falha dos testes. O build também emitiu avisos de tamanho de chunk e de `inlineDynamicImports` ignorado em combinação com `codeSplitting`, sem impedir a compilação. Nenhuma dependência foi adicionada ao package.json/lockfile do produto; as ferramentas de teste ficaram fora do checkout.

Dados temporários no Chrome: `Água F2 demo` (renomeação local) e `TESTE F2 somente demo`. Ambos descartados por reload confirmado. Nenhum hábito autenticado, tarefa, projeto ou prioridade foi gravado durante a validação manual.

## Arquivos do F2

Modificados:

- `src/components/habits/HabitProvider.tsx`
- `src/components/habits/HabitTodaySummary.tsx` (também contém alterações anteriores F1)
- `src/components/habits/habit-context.ts`
- `src/components/planning/AuthenticatedDayPlanner.tsx`
- `src/components/planning/DayPlanner.tsx` (também contém alterações anteriores F1)
- `src/integrations/supabase/types.ts`
- `src/routes/_app.habits.tsx`

Novos:

- `src/components/habits/AuthenticatedHabitProvider.tsx`
- `src/components/habits/DemoHabitProvider.tsx`
- `src/lib/habit-repository.ts`
- `supabase/migrations/20260919025408_authenticated_habits.sql`
- `tests/habit-provider.test.mjs`
- `tests/habits-sql.test.mjs`
- `docs/f2-habits-validation-2026-09-19.md`

Demais pendências anteriores preservadas: `AuthenticatedCategoryStart.tsx`, `AuthenticatedTasks.tsx`, `dialog.tsx`, `demo-planning-provider.ts`, `_app.dashboard.tsx`, `_app.tasks.tsx`, `src/lib/pluralize.ts` e `docs/f1-validation-2026-09-19.md`.

## Reprodução dos testes e revisão

```sh
cd /Users/takarastefens/Downloads/RUMO-ui-audit
npm run typecheck
npm run build
git diff --check
npx --no-install eslint src/components/habits/*.tsx src/components/habits/habit-context.ts src/components/planning/AuthenticatedDayPlanner.tsx src/components/planning/DayPlanner.tsx src/integrations/supabase/types.ts src/lib/habit-repository.ts src/routes/_app.habits.tsx tests/habit-provider.test.mjs tests/habits-sql.test.mjs

# Dependências somente para testes, fora do checkout (já instaladas nesta rodada):
npm install --prefix /tmp/rumo-f2-tests --no-package-lock @electric-sql/pglite@0.5.8 react@19.2.0 react-test-renderer@19.2.0 esbuild@0.28.2
RUMO_TEST_MODULES=/tmp/rumo-f2-tests/node_modules node --test tests/habit-provider.test.mjs tests/habits-sql.test.mjs tests/planning.test.mjs

git status --short --branch
git diff --stat
git diff -- src/components/habits src/components/planning src/integrations/supabase/types.ts src/routes/_app.habits.tsx
# Arquivos novos não aparecem em git diff sem staging; revisar diretamente:
cat supabase/migrations/20260919025408_authenticated_habits.sql
cat src/lib/habit-repository.ts
cat src/components/habits/AuthenticatedHabitProvider.tsx
cat src/components/habits/DemoHabitProvider.tsx
cat tests/habits-sql.test.mjs
cat tests/habit-provider.test.mjs
```

Não publicar esta integração antes de revisar/aplicar a migration com autorização e repetir CRUD autenticado, exclusão confirmada e logout/login no ambiente de destino. Os seis commits remotos continuam sem integração. Não houve tentativa de resolver essa divergência.
