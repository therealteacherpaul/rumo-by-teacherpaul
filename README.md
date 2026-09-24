# RUMO by Teacher Paul

**Seu sistema operacional pessoal.**
**Powered by Método BÚSSOLA™**

O RUMO é um sistema web de produtividade pessoal criado para ajudar profissionais com rotinas fragmentadas a transformar prioridades em execução realista. A proposta reúne tarefas, projetos, planejamento, foco, hábitos e revisão em um único fluxo, considerando também descanso, família e imprevistos.

> O objetivo do RUMO é devolver clareza, direção e tempo — sem tentar preencher todos os minutos do dia.

## Links

- Aplicação: [https://rumo-by-teacherpaul.lovable.app](https://rumo-by-teacherpaul.lovable.app)
- Repositório: [https://github.com/therealteacherpaul/rumo-by-teacherpaul](https://github.com/therealteacherpaul/rumo-by-teacherpaul)

## Funcionalidades do MVP

- Cadastro, login, logout e proteção de rotas.
- Tarefas persistentes com projeto, categoria, prioridade, prazo e duração estimada.
- Projetos e categorias com criação, edição e arquivamento.
- Prioridades do dia.
- Hábitos recorrentes e registros diários.
- Sessões de foco com pausa, retomada e histórico.
- Planejamento por projeto, prazos e progresso.
- Revisão semanal de tarefas e hábitos.
- Planejador com IA que apresenta sugestões para revisão antes de aplicá-las.
- Central de alertas determinísticos e preferências por usuário.
- Modo demonstração separado dos dados autenticados.

> Confirme estas funcionalidades no app publicado antes da entrega. A branch `main` visível atualmente aparenta conter a versão de demonstração local anterior ao MVP descrito no relatório de desenvolvimento.

## Como usar

1. Acesse a aplicação pelo link acima.
2. Entre com uma conta autorizada ou selecione a demonstração, conforme a versão publicada.
3. Registre tarefas e organize-as por projeto, categoria, prioridade, prazo e duração.
4. Defina as prioridades do dia e consulte o planejamento.
5. Use Focus para executar sessões vinculadas a tarefas.
6. Revise os resultados em Review e ajuste o planejamento seguinte.
7. Se disponível na versão demonstrada, gere uma proposta com o planejador de IA, revise as sugestões e confirme apenas as alterações desejadas.

## Fluxo de organização

1. Capturar tarefas e compromissos.
2. Agrupar atividades por projeto e categoria.
3. Escolher poucas prioridades para o dia.
4. Estimar a duração e reservar tempo de foco.
5. Executar e registrar sessões.
6. Comparar o planejado com o realizado.
7. Fazer uma revisão semanal e ajustar o próximo ciclo.

## Inteligência Artificial

O planejador de IA do MVP gera uma proposta de organização com resumo, blocos sugeridos, justificativas e alertas. O usuário revisa as sugestões e confirma antes da aplicação. A IA apoia a decisão; não altera o planejamento sem confirmação.

No modo demonstração, são utilizados dados de exemplo e a IA real não é chamada.

## Ferramentas e arquitetura

- React e TypeScript
- TanStack Router e TanStack Query
- Supabase / Lovable Cloud para autenticação e persistência do MVP
- PostgreSQL com Row Level Security (RLS)
- Integração de IA executada no servidor
- Componentes de interface reutilizáveis

## Segurança e privacidade

Os dados autenticados são protegidos por políticas RLS e associados ao usuário proprietário. A chave de IA é mantida no servidor. O modo de demonstração é separado dos dados reais.

## Limitações e próximos passos

Foram planejados para a versão 1.0:

- notificações push em navegador fechado ou dispositivos móveis;
- execução agendada de resumos e alertas;
- service worker e sincronização offline;
- integração opcional com calendários externos;
- captura automática de contexto;
- métricas históricas avançadas.

## Evidências

Adicione capturas de tela em `docs/screenshots/` e atualize os nomes abaixo:

| Tela | Arquivo |
|---|---|
| Hoje | `docs/screenshots/today.png` |
| Tarefas | `docs/screenshots/tasks.png` |
| Planejamento ou revisão semanal | `docs/screenshots/plan-review.png` |
| Sessão de foco | `docs/screenshots/focus.png` |
| Planejador de IA | `docs/screenshots/ai-planner.png` |

## Desenvolvimento local

O repositório utiliza Bun. Com Bun instalado:

```bash
bun install
bun run dev
```

Para gerar a versão de produção:

```bash
bun run build
```
