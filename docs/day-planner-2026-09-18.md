# Planejador do dia — 18/09/2026

## Entrega e limite da integração

Seção integrada ao Today. Dados autenticados vêm de TaskDataProvider/useTaskData e das prioridades já carregadas por AuthenticatedPriorities, sem consulta duplicada. Usa tarefas abertas não arquivadas, prioridade, prazo, estimativa, projeto, prioridades abertas e hábitos ativos do contexto local existente.

Não foi confirmada uma integração de IA executável no projeto: não há função de planejamento ou transporte autenticado existente no checkout. O provider Lovable lança erro recuperável explicitamente; não há endpoint inventado, chave no frontend, chamada de IA ou fallback para fixtures no modo autenticado. As verificações locais são identificadas como regras, não como resposta de IA.

A documentação oficial https://docs.lovable.dev/features/ai descreve integração de IA por backend/Edge Function com credencial gerenciada. Conectar esse backend verificado é uma próxima etapa: validar sessão no servidor, minimizar dados enviados, validar resposta e tratar limites/erros. Nenhum backend foi criado ou publicado nesta entrega.

## Contrato

- UI chama somente planningService.generatePlan; não importa implementação do provider.
- PlanningProvider permite Lovable ou Gemini. Apenas o adaptador Lovable pendente está instanciado.
- Serviço separa demo antes de chamar provider, valida estrutura, IDs, origem, duração e capacidade; tem timeout e cancelamento.
- Demo usa fixtures existentes, cálculo local explicitamente identificado e nenhuma gravação.
- Alertas locais: atraso, prazo em até dois dias, estimativa ausente, capacidade e conflitos de prioridades.
- Aceitar, ignorar e revisar operam somente em rascunho da visita. Não aplicam mudanças persistentes; sair, recarregar, mudar dados/tempo ou regenerar descarta decisões.
- Interface futura de lembretes definida, sem implementação de push.
- Hábitos continuam editáveis no contexto local; não são hábitos persistidos por usuário. Metas de tempo são indicativas e não filtradas pela frequência do dia. Nenhum dado padrão foi alterado.

## Validação manual no Chrome autenticado

- Today: duas tarefas reais, um projeto, zero prioridades abertas e oito hábitos ativos. Redução de capacidade para 30 minutos exibiu alerta. Geração e nova tentativa mostraram integração pendente sem quebrar a tela.
- Focus: seletor com as duas tarefas reais; iniciou e encerrou bloco com Tarefa Teste 002. Histórico explicitamente temporário.
- Dashboard: zero tarefas concluídas e um projeto ativo; foco/hábitos sem métricas fictícias.
- Tasks: duas tarefas e projeto reais. Formulário abriu com Sem categoria; preencher título habilitou Salvar. Formulário fechado sem gravação. Persistência de nova tarefa não foi retestada nesta etapa.
- Plan/Review: navegação funciona, permanecem explicitamente não integrados. Ajustada frase de Review que ainda classificava hábitos como demonstração.
- Habits: sem Dados de exemplo no modo autenticado, editor de Meditar abre com meta e frequência. Fechado sem modificar hábitos.
- Today demo: gerou quatro blocos, revisou primeiro para 35 minutos, aceitou no rascunho, ignorou outro e regenerou limpando decisões.
- Today e Tasks demo: fixtures presentes; Voltar aos meus dados preservou /today e /tasks e removeu mode=demo, com retorno aos dados reais.
- 390px: Today autenticado/demo, Tasks demo e Dashboard sem overflow horizontal; revisão de sugestão legível, botões visíveis e campo com foco inicial. Viewport restaurado ao final.

Limites da evidência: não foi realizada captura de Console/Network nesta rodada. Ausência de chamadas de IA/gravações do planejador confirmada por implementação e testes, não por rastreamento de rede. Estados de tarefas vazias/erro de carregamento não foram forçados na conta real. Loading de IA tem UI implementada, mas provider pendente responde imediatamente; timeout/cancelamento exercitados em testes. Nenhum dado persistente foi criado, editado ou removido nesta validação.

## Validações automatizadas

- npm run typecheck
- npm run build
- git diff --check
- npx eslint src/lib/ai src/components/planning src/components/today/AuthenticatedPriorities.tsx src/routes/_app.today.tsx src/routes/_app.habits.tsx src/routes/_app.review.tsx tests/planning.test.mjs
- node --test tests/planning.test.mjs (9 casos: diagnósticos, datas, isolamento demo, provider pendente, vazio, resposta inválida, capacidade, timeout e cancelamento)

Sem commit, push, deploy, migration, mudanças de autenticação ou banco. A alteração anterior showDemoBadge=false em Habits foi preservada.

## Investigação da integração oficial — 19/09/2026

Conclusão: existe capacidade oficial de IA habilitada no workspace, mas não foi verificado um transporte de planejamento utilizável pelo app. O provider autenticado permanece indisponível. Habilitação do conector não equivale a uma função implantada ou credencial confirmada neste projeto.

Evidências somente de leitura:

- Projeto Lovable `697a87cd-6fa4-406f-831e-bcf5623302a8`, workspace `CFEyHvd1hPl6Zr6sq1jg`, commit remoto `88e2ff2eef709b4defb5c62c0fe1db156926e02a`.
- `get_database_status`: enabled=true, stack=supabase.
- `list_connectors`: AI (`ai_gateway`) e Cloud habilitados. Trata-se de disponibilidade no workspace, não de confirmação de configuração de um endpoint neste app.
- `list_custom_connectors`: zero conectores adicionados.
- `list_files` paginado: 144 arquivos no commit remoto, sem Edge Function, rota API de IA ou adapter de IA. Checkout local também não contém transporte configurado. `src/server.ts` é entrada SSR genérica; `client.server.ts` é cliente Supabase administrativo, não integração de IA.
- `.env` contém apenas nomes SUPABASE_PROJECT_ID, SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL e correspondentes VITE_. Nenhuma variável de IA nos nomes do ambiente do processo. Valores de credenciais não foram exibidos ou copiados.
- O app e `supabase/config.toml` apontam para `wwbhohaedqwfovlhgids`. Listar Edge Functions desse projeto pelo conector Supabase retornou falta de permissão. Isso NÃO demonstra ausência de funções.
- Há outro projeto acessível chamado `rumo-by-teacherpaul`, ref `vmrlxcoikkmtunonwvph`, sem Edge Functions. Ele não é o destino deste checkout; não houve troca de projeto.
- As ferramentas Lovable disponíveis não oferecem inventário de secrets de runtime. A existência remota de LOVABLE_API_KEY permanece não verificada. Não se tentou obter valores, reaproveitar chaves de outro projeto ou consultar tabelas de secrets.
- A documentação oficial distingue IA dentro do app do agente de desenvolvimento do Lovable e descreve credencial gerenciada e chamadas pelo backend. Não foi enviado comando ao agente para provisionar/publicar recursos.

### O que falta para ativar

1. Verificar no Cloud do projeto correto, com acesso administrativo, a presença do secret gerenciado LOVABLE_API_KEY e a lista de Edge Functions. Basta confirmar nomes/configuração, sem compartilhar valores.
2. Identificar uma função de planejamento existente com URL/nome, contrato de entrada/saída, autenticação e autorização verificáveis. Se não existir, sua criação e publicação serão uma etapa separada autorizada; habilitar AI no workspace por si só não resolve isso.
3. O backend deve validar sessão e dados de entrada, limitar uso, chamar o conector oficial e devolver o contrato PlanningSuggestion; não executar alterações nas tarefas/hábitos/prioridades. Credencial permanece no backend.
4. Implementar apenas o transporte do LovablePlanningProvider após essa confirmação, respeitando AbortSignal e os erros estruturados. Validar retorno com o schema atual, IDs de tarefas e limite de tempo; testar usuário real, indisponibilidade, timeout e resposta inválida.
5. Preservar demo sem chamadas reais e decisões manuais em rascunho. Gemini permanece somente uma interface tipada, sem SDK, endpoint ou chave.

### Revisão dos 14 arquivos

- AuthenticatedDayPlanner: tarefas/projetos do provider autenticado; prioridades reais compartilhadas; hábitos locais editáveis, não apresentados como persistidos por usuário.
- DemoDayPlanner: único adapter novo que importa fixtures. Today monta esse adapter somente no ramo demo.
- DayPlanner: sem mutações de banco; hooks incondicionais, estado vazio com CTA, geração bloqueada sem tarefas, retry e cancelamento, aceitar/ignorar/revisar apenas em memória.
- planning-types/service/analysis e os dois providers: contrato independente, schema e limites, nenhuma credencial, nenhum SDK ou endpoint arbitrário, sem fallback autenticado. Interface GeminiPlanningProvider explicitada nesta revisão.
- AuthenticatedPriorities/Today: integração da seção sem duplicar consulta nem modificar CRUD existente.
- Habits: remoção do badge anterior preservada, linguagem de sessão local e formatação; dados padrão e operações existentes inalterados.
- Review: apenas descrição corrigida; sem alteração de fluxo.
- Testes: adicionados casos de entrada autenticada vazia sem fallback e recuperação após erro/resposta inválida (provider de teste injetado, nunca utilizado no app). Total: 11 testes.
- Este relatório: evidências e limitações atualizadas. Os testes manuais de Chrome acima são da etapa anterior, não repetidos nesta investigação.

Sem novos arquivos além dos 14 já pendentes. Nesta revisão mudaram somente planning-types.ts, planning.test.mjs e este relatório. Nenhuma dependência, secret, fixture, autenticação, banco, migration, commit, push ou deploy foi alterado.

Validações repetidas em 19/09: typecheck, build, diff-check, lint direcionado e 11 testes passaram. Build manteve aviso de tamanho de bundle.
