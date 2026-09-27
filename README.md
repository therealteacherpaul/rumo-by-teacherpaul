# RUMO by Teacher Paul

## Projeto acadêmico — Sistema Operacional Pessoal (POS) — RUMO, by Teacher Paul

**Aluno:** Paulo Ricardo Takara Stefens  
**RA:** 232231  
**Instituição:** UniFECAF  
**Disciplina:** Produtividade e Gestão do Tempo  

> **"Seu sistema operacional pessoal — Powered by Método BÚSSOLA™."**

Aplicação de produtividade sustentável para organizar tarefas, projetos, prioridades, hábitos e blocos de foco. O projeto baseia-se nos princípios do Método BÚSSOLA™, priorizando clareza, intenção, pausas e flexibilidade para imprevistos — rejeitando expressamente a produtividade tóxica, índices punitivos ou a tentativa de preencher 100% do tempo disponível.

---

## Acesso e Demonstração

- **Aplicação publicada:** [https://rumo-by-teacherpaul.lovable.app](https://rumo-by-teacherpaul.lovable.app)
- **Demonstração sem cadastro (Modo Demo):** [https://rumo-by-teacherpaul.lovable.app/today?mode=demo](https://rumo-by-teacherpaul.lovable.app/today?mode=demo)
- **Repositório oficial:** [https://github.com/therealteacherpaul/rumo-by-teacherpaul](https://github.com/therealteacherpaul/rumo-by-teacherpaul)

O modo de demonstração opera 100% no navegador por meio de fixtures e repositórios locais em memória, permitindo avaliar a usabilidade, o design system e a lógica de planejamento sem exigir cadastro ou consumo de backend.

---

## Evidências Visuais e Demonstração das Telas

As capturas a seguir registram as interfaces em ambiente real de validação (arquivos disponíveis no diretório `docs/` do repositório):

### 1. Tela "Hoje" (Visão Geral e Prioridades)
Visão consolidada das prioridades do dia, hábitos a cumprir e Central de Alertas integrada.
<br>
<img src="docs/IMAGEM 01 — tela “Hoje”.png" alt="Tela Hoje" width="700">

---

### 2. Tela "Tarefas" (Gestão com Categorias e Projetos)
Organização de tarefas com estimativa de duração (`estimate_min`), projetos e categorias protegidas por limites relacionais.
<br>
<img src="docs/IMAGEM 02 — tela “Tarefas”.png" alt="Tela Tarefas" width="700">

---

### 3. Tela "Planejamento"
Visão temporal e alinhamento de compromissos com o método BÚSSOLA™.
<br>
<img src="docs/IMAGEM 03 — tela “Planejamento”.png" alt="Tela Planejamento" width="700">

---

### 4. Tela "Foco" (Deep Work Resiliente)
Cronômetro monotarefa com persistência contínua, sobrevivência a recarregamentos (F5) e consolidação automática de tempo por tarefa.
<br>
<img src="docs/IMAGEM 04 — tela “Foco”.png" alt="Tela Foco" width="700">

---

### 5. Dashboard
Dashboard de acompanhamento
<br>
<img src="docs/IMAGEM 05 — Dashboard.png" alt="Dashboard" width="700">

---

### 5. Planejador do Dia com IA (Ciclo Completo)

O Planejador do Dia analisa tarefas e hábitos, calcula o tempo útil e sugere uma distribuição equilibrada respeitando pausas e imprevistos:

#### 5A. Configuração de disponibilidade
Definição do tempo disponível e parâmetros para o cálculo inteligente:
<br>
<img src="docs/IMAGEM 06A — “planejador do dia”.png" alt="Planejador do Dia - Configuração" width="700">

#### 5B. Sugestão gerada pela IA
Distribuição inteligente de blocos de foco gerada pelo modelo de linguagem:
<br>
<img src="docs/IMAGEM 06B — “planejador do dia”.png" alt="Planejador do Dia - Sugestões de IA" width="700">

#### 5C. Revisão interativa
Possibilidade de ajustar individualmente a minutagem sugerida antes da confirmação:
<br>
<img src="docs/IMAGEM 06C — “planejador do dia”.png" alt="Planejador do Dia - Revisão de Blocos" width="700">

#### 5D. Aceite e consolidação
Aplicação dos blocos aceitos com gravação direta no planejamento do dia:
<br>
<img src="docs/IMAGEM 06D — “planejador do dia”.png" alt="Planejador do Dia - Aplicação Concluída" width="700">

---

### 6. Modo Demonstração (Sem Cadastro)
Acesso instantâneo a todas as telas com fixtures locais, sem necessidade de login:
<br>
<img src="docs/IMAGEM 07 — Modo demonstração.png" alt="Modo Demonstração" width="700">

---

## Funcionalidades e Estado Atual de Implementação

| Recurso | Implementação Atual | Status e Evidências |
| :--- | :--- | :--- |
| **Autenticação e Sessão** | Cadastro, login com validação HIBP e logout via Supabase Auth; rotas autenticadas protegidas com redirecionamento automático. | **Validado** — fluxos de sessão ativa, expiração e isolamento de rotas operacionais. |
| **Tarefas, Projetos e Prioridades** | CRUD completo com persistência relacional; prioridades diárias (até 3 slots em `/today`); prazos e duração estimada (`estimate_min`). | **Validado** — políticas RLS garantem isolamento estrito por `auth.uid()`. |
| **Gestão de Categorias** | Ciclo de vida completo (criação rápida, renomeação, arquivamento e reativação); limites de até 20 ativas e 30 totais protegidos por gatilhos PostgreSQL e advisory locks; integridade relacional com soft-archive antes de exclusão. | **Validado** — interface integrada em Configurações e criação contextual em Tarefas. |
| **Hábitos Sustentáveis** | Hábitos recorrentes com metas, frequência e "Modo Leve" (fallback do Método BÚSSOLA™); suporte a hábitos incrementais (botão rápido `+1` para água, páginas, etc.); percentual dinâmico; ação "Dispensar hoje" e fechamento retroativo de dias encerrados sem registro. | **Validado** — persistência via RPC `initialize_user_habits` e check-ins com valor numérico e modalidade. |
| **Sessões de Foco (Deep Work)** | Cronômetro com seleção de tarefa e duração herdada da estimativa; heartbeat resiliente em `localStorage` para sobrevivência a recarregamento acidental (F5), interrupções ou queda de conexão; recuperação e gravação automática (>= 1 min); consolidação de entrada única por tarefa/dia (`accumulateFocusSession`); conclusão automática ao zerar (`00:00`). | **Validado** — dados persistidos na tabela `focus_sessions`, integrando minutos reais ao histórico e somando tempo anterior ao reiniciar blocos. |
| **Planejador do Dia com IA** | Função de servidor autenticada (`createServerFn`) integrada ao gateway oficial de IA via modelo `openai/gpt-6-astra`; gera distribuição inteligente de blocos baseada em tarefas e hábitos reais, reservando folga para pausas; permite Aceitar, Ignorar ou Revisar minutagem antes da aplicação em lote (`acceptedChanges`); fallback local determinístico no modo demo. | **Validado** — geração ponta a ponta com tarefas reais e segredos isolados exclusivamente no backend. |
| **Central de Alertas e Notificações** | Regras determinísticas para prazos de tarefas e hábitos pendentes (com descarte imediato de hábitos cumpridos ou dispensados); lista paginada de 3 alertas por vez com contador de pendências; painel de preferências em Configurações (antecedência 0–30 dias, horário do resumo diário e botão para Web Notification API). | **Validado** — persistência na tabela `alert_preferences` e testes unitários de regras e contratos SQL. |
| **Dashboard Integrado** | Cards numéricos minimalistas com dados reais agregados da conta autenticada: Tarefas concluídas, Projetos ativos, Tempo de foco acumulado (em horas/minutos reais de sessões) e Taxa de conclusão de hábitos do dia; atalhos rápidos para navegação. | **Validado** — leitura reativa dos repositórios locais e remotos. |
| **Design System & Acessibilidade** | Paleta institucional Navy (`#0F2747`), Dourado (`#C9A227`), Cinza Neutro (`#F5F7FA`); tipografia Fraunces para títulos e DM Sans para leitura; layout responsivo (mobile first com alvo de toque >= 44px e zero overflow horizontal em 390px). | **Validado** — sem dependência de temas genéricos ou bibliotecas conflitantes. |

---

## Arquitetura e Engenharia de Software

A aplicação foi desenvolvida sobre o ecossistema full-stack moderno em TypeScript:

- **Frontend & Framework:** React 19, TanStack Start v1 (arquitetura SSR/Edge compatível), TanStack Router (roteamento com tipos estritos via `routeTree.gen.ts`) e TanStack Query v5.
- **Estilização e Componentes:** Tailwind CSS v4 (configurado nativamente via tokens semânticos em `src/styles.css`), Radix UI primitives e componentes shadcn/ui.
- **Backend & Dados (Lovable Cloud):** PostgreSQL gerenciado, Supabase Auth e Row Level Security (RLS) habilitado em 100% das tabelas públicas com concessão de permissões explícitas (`GRANT SELECT, INSERT, UPDATE, DELETE`).
- **Camada de Servidor (Server Functions):** `createServerFn` para chamadas client-to-server tipadas com middleware de autenticação (`requireSupabaseAuth`) e validação via Zod.
- **IA e LLM:** Lovable AI Gateway chamando o modelo `openai/gpt-6-astra` com prompt em português estruturado para JSON, respeitando tempo livre e limites de energia cognitiva.
- **Qualidade e Testes:** Suíte de validação local com Node.js test runner (`node:test`), testes de integridade SQL em PGlite e testes de regras de negócio em `tests/`.

### Estrutura de Pastas

```text
├── src/
│   ├── components/       # Componentes de interface (auth, tasks, habits, planning, alerts, etc.)
│   ├── hooks/            # Hooks reativos (useAuth, useTaskData, useHabits, useCategories, etc.)
│   ├── integrations/     # Clientes do Supabase (client, server, tipos e middleware de autenticação)
│   ├── lib/              # Lógica de domínio, repositórios (focus, habits, alerts, task-data) e IA
│   │   └── ai/           # Funções de servidor, validação Zod e provedores de IA
│   ├── routes/           # Rotas tipadas do TanStack Router (_app.today, _app.focus, etc.)
│   └── styles.css        # Design tokens, variáveis CSS e reset Tailwind v4
├── supabase/
│   └── migrations/       # Migrations SQL versionadas (tabelas, triggers, RLS e RPCs)
└── tests/                # Testes automatizados de regras, SQL e contratos de dados
```

---

## Execução Local

### Pré-requisitos
- **Bun** (versão 1.2+ recomendada) ou **Node.js** (versão 22+)
- Git

### 1. Clonar o repositório e instalar dependências

```bash
git clone https://github.com/therealteacherpaul/rumo-by-teacherpaul.git
cd rumo-by-teacherpaul
bun install --frozen-lockfile
```

### 2. Configurar variáveis de ambiente

Copie o arquivo de exemplo:

```bash
cp .env.example .env
```

Preencha as variáveis necessárias:
- `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`: Endereço e chave pública anônima do backend.
- `LOVABLE_API_KEY`: Necessária no ambiente do servidor caso deseje testar a chamada real da IA localmente (no modo demo, a geração utiliza fallback determinístico sem necessidade de chave).

### 3. Iniciar o servidor de desenvolvimento

```bash
bun run dev
```

Acesse `http://localhost:8080` (ou a porta informada pelo Vite). Para entrar direto na demonstração sem cadastro, acesse `http://localhost:8080/today?mode=demo`.

---

## Scripts de Verificação

Para garantir a qualidade e a ausência de regressões:

```bash
# Verificação estática de tipos TypeScript
bun run typecheck

# Análise de linting
bun run lint

# Build de produção
bun run build
```

---

## Segurança e Privacidade

- **Isolamento de Dados:** Cada usuário acessa estritamente seus próprios registros por meio de políticas RLS aplicadas no PostgreSQL baseadas em `auth.uid() = user_id`.
- **Proteção de Segredos:** Nenhuma chave secreta, token administrativo ou credencial de IA é incluída no bundle do navegador. Todas as chamadas ao gateway de IA ocorrem em Server Functions autenticadas.
- **Resiliência e Recuperação:** Mecanismo de checkpoint de foco local impede perda de dados em caso de falha de conexão ou fechamento acidental da janela.

---

## Considerações Metodológicas (Método BÚSSOLA™)

O RUMO foi projetado especificamente para superar as falhas comuns dos gerenciadores de tarefas tradicionais:

1. **Anti-produtividade tóxica:** O sistema não cobra metas inalcançáveis nem cria dashboards punitivos de "produtividade".
2. **Modo Leve para Hábitos:** Reconhece que a consistência em dias difíceis vale mais do que a perfeição temporária; realizar a versão mínima mantém o hábito vivo sem gerar frustração.
3. **Margem de Respiro no Planejador:** A IA é instruída a planejar apenas o tempo útil das prioridades, preservando intencionalmente intervalos para descanso e imprevistos diários.
4. **Foco Monotarefa:** O módulo de Foco isola uma única tarefa por vez, eliminando a sobrecarga cognitiva do multitasking.
