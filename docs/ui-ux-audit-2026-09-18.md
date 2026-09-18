# Auditoria UI/UX — 18/09/2026

Base: `origin/fix/foundation-review`, commit `112454f`, checkout isolado em `/Users/takarastefens/Downloads/RUMO-ui-audit` (detached HEAD). A pasta original não recebeu edições de código. Sem commit, push, merge, rebase, reset, migrations ou gravações de dados pela auditoria.

## Problemas confirmados e alterações

1. **Focus ignora tarefas autenticadas.** No site publicado, abrir `/tasks` mostra `Tarefa Test 003` e `Tarefa Teste 002`; abrir `/focus` mostra “Crie uma tarefa…” sem seletor. O código retorna esse estado incondicionalmente em `authenticated`. Correção: montar `TaskDataProvider` por usuário, consumir `useTaskData`, listar tarefas não arquivadas e resolver suas categorias reais. Estado vazio somente quando a lista realmente está vazia. Nenhum fallback de fixtures. O timer existente é compartilhado; o demo mantém tarefas e histórico de exemplo. Sessões autenticadas são temporárias, explicitamente informadas, sem persistência nova.
2. **Dashboard mostra números fictícios.** `/tasks` mostra `Projeto Teste` ativo, mas `/dashboard` informa zero projetos; hábitos locais aparecem como oito hábitos acompanhados. Valores eram constantes ou derivados de fixtures. Correção: contagens reais de projetos ativos e tarefas concluídas não arquivadas pelo mesmo provider. Foco/hábitos sem integração persistente aparecem como “Não disponível”.
3. **Mensagens enganosas em Planejamento/Revisão.** Mesmo com tarefas/projeto, `/plan` pede o primeiro projeto e `/review` promete reunir os registros automaticamente. O código não implementa essas integrações. Correção somente do texto para informar a indisponibilidade; links de retorno mantidos.
4. **Links internos saem do demo.** Em `/today?mode=demo`, “Abrir tela de foco” levava a `/focus` e ao login local. O logo e o link do resumo de hábitos também omitiam o parâmetro. Correção: preservar `mode=demo` nesses links. Fixtures e ações demo não foram alteradas.
5. **Idioma de acessibilidade incorreto.** Documento declarava `lang="en"` apesar do conteúdo em português. Corrigido para `pt-BR`.

## Evidência de navegador

Chrome conectado, conta real no site `https://rumo-by-teacherpaul.lovable.app`. A versão publicada não foi modificada. Versão corrigida disponível em `http://127.0.0.1:5174`.

| Rota | Verificação e resultado |
| --- | --- |
| `/login`, `/signup` | Formulários locais carregam, campos rotulados e navegação para cadastro. Nenhuma conta criada. Login real no site publicado feito pelo usuário. |
| `/today` | Carrega vazio de prioridades corretamente; seletor lista as duas tarefas reais. Título vazio apresenta “Informe o título da prioridade”. Não foi salva prioridade. |
| `/tasks` | Duas tarefas, categoria e projeto reais; dados permanecem após recarregar. Criar/editar abre diálogo, edição preenche valores corretos. Sem categoria é opção inicial. Categoria inline abre e cancela. Novo projeto abre com botão desabilitado sem nome. Busca sem correspondência e “Limpar busca e filtros” funcionam. Nenhum formulário salvo. |
| `/focus` | Defeito reproduzido no site autenticado e corrigido no código. Validação local autenticada passou: seletor contém as duas tarefas reais não arquivadas; iniciar, pausar, reiniciar e encerrar funcionam; categoria correta no histórico temporário. |
| `/plan`, `/review` | Carregam e navegam sem tela branca; são placeholders autenticados. Textos corrigidos e validados na sessão local; retorno a Tarefas funciona. Não foi implementado planejamento/revisão persistente. |
| `/dashboard` | Defeito de contagens reproduzido; correção local validada: 0 tarefas concluídas e 1 projeto ativo, coerentes com Tarefas; indicadores não integrados exibem Não disponível. |
| `/settings` | Categoria real carregada, criação desabilitada com nome vazio. Nenhuma gravação. |
| `/habits` | Oito hábitos iniciais locais; filtro Feitos mostra estado vazio e Todos restaura a lista. Persistência autenticada não implementada; hábitos preservados. |
| `/today?mode=demo` | Fixtures e DemoNotice aparecem; link de Focus corrigido foi repetido no Chrome e preserva o modo. |
| `/tasks?mode=demo` | Nove tarefas de exemplo carregam, sem substituição por tarefas reais. Navegação mobile preserva o modo. |
| `/focus?mode=demo` | Seletor e histórico de fixtures presentes. Iniciar, pausar, reiniciar e encerrar testados com mensagens corretas. |
| Saída do demo | Com sessão local real, “Voltar aos meus dados” retorna de Today demo para `/today` e de Tasks demo para `/tasks`, removendo o parâmetro e restaurando dados reais. Sem sessão, encaminha ao login. |

## Responsividade e acessibilidade

- Desktop: oito rotas autenticadas visitadas e navegação de retorno exercitada.
- 390 × 844: oito rotas autenticadas publicadas com `document.documentElement.scrollWidth === innerWidth === 390`, sem overflow horizontal nos estados observados.
- Diálogo de nova tarefa em 390px: limites horizontais 0–390 e verticais aproximadamente 48–796, dentro da altura 844. Foco inicial no título, Tab vai à categoria, Escape fecha.
- Tarefas em 768px: largura do documento e viewport iguais a 768.
- Demo local Hoje/Tarefas/Focus em 390px: sem overflow; capturas visuais de Tarefas e Focus inspecionadas, navegação mobile legível.
- Focus e Dashboard corrigidos foram também validados autenticados em 390px: largura do documento igual ao viewport e screenshots inspecionadas. Ausência de overflow não substitui inspeção de todos os controles em todos os estados.

## Console e Network

- Console do site publicado: nenhuma entrada de erro/aviso capturada nos testes executados.
- Console local, inclusive na rodada autenticada final: somente avisos de hidratação capturados; apontam atributos `data-new-gr-c-s-check-loaded` e `data-gr-ext-installed` inseridos por extensão (Grammarly). Não foi suprimido nem usado para modificar a hidratação da aplicação.
- **Network não verificado:** a API disponível da integração Chrome expõe Console, DOM e screenshots, mas não captura de requisições. Não foi produzida evidência de métodos/status HTTP nem prova via Network de ausência de escritas demo. Por inspeção de código, Focus demo não monta TaskDataProvider e suas sessões são estado React local.

## Limites e pendências

- Login local concluído pelo usuário e verificado na rodada final. Nenhuma credencial precisou ser utilizada pelo agente; não foram lidos/copiados tokens, cookies ou armazenamento de sessão.
- Focus autenticado local validado com Tarefa Test 003 e Tarefa Teste 002 no seletor. Bloco executado com Tarefa Teste 002 e Categoria Teste 001; histórico vazio ao voltar à rota, conforme aviso de estado temporário. Loading observado. Duração 0 mostra erro de limite e desabilita Iniciar. Estado sem nenhuma tarefa e falha de carregamento/rede foram conferidos no código, sem indução no navegador, para preservar dados e ambiente.
- Não foram salvos, concluídos, reabertos, arquivados ou removidos registros para respeitar a instrução mais recente de preservar os dados. Criação/edição foi validada até os formulários, não até persistência de novas gravações.
- Não foi executado logout da sessão real. Não há afirmação de auditoria completa de persistência, erro de rede, usuário sem tarefas ou isolamento de escritas via Network.
- Hábitos continuam demonstração local mesmo autenticado. Não foram removidos nem modificados hábitos, fixtures ou sua implementação de estado.

## Validações

- `npm run typecheck`: passou.
- `npm run build`: passou (cliente e servidor). Aviso de configuração existente sobre `vite-tsconfig-paths` e resolução nativa do Vite.
- `git diff --check`: passou.
- ESLint direcionado aos oito arquivos de código alterados: passou sem saída.
- O servidor local usa dependências disponíveis por symlink ignorado `node_modules`; nenhum manifesto/lockfile foi alterado.

## Revisão

```sh
cd /Users/takarastefens/Downloads/RUMO-ui-audit
git status --short --branch
git diff --stat
git diff --check
git diff -- src/routes/_app.focus.tsx
git diff -- src/routes/_app.dashboard.tsx src/routes/_app.plan.tsx src/routes/_app.review.tsx
git diff -- src/routes/_app.today.tsx src/components/layout/AppShell.tsx src/components/habits/HabitTodaySummary.tsx src/routes/__root.tsx
cat docs/ui-ux-audit-2026-09-18.md
```

## Rodada final autenticada

Sessão real local confirmada em `/today`. Today lista as duas tarefas no seletor; Tasks mantém as mesmas tarefas, categoria, projeto e status anteriores ao teste. Focus, Dashboard, Plan e Review foram navegados e conferidos. Fixtures de Today (3 prioridades) e Tasks (9 tarefas) continuam disponíveis somente no modo demo dessas telas; saída restaura os dados reais na mesma rota.

Typecheck, build, ESLint direcionado e diff check executados novamente e aprovados. Nenhuma nova alteração de código foi necessária nesta rodada; somente este relatório foi atualizado. Nenhuma gravação no banco, commit ou push.
