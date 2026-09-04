# RUMO by Teacher Paul

O RUMO é um sistema operacional pessoal para transformar prioridades em uma execução realista, considerando compromissos, tarefas, foco, descanso e imprevistos.

O produto é independente do Smart Schedule Pro. Uma integração com o Smart Schedule poderá existir no futuro, de forma opcional, para importar informações de agenda. Ela não é necessária para usar o RUMO.

## Estado atual

Este repositório contém uma demonstração frontend navegável. Atualmente:

- as telas usam dados locais de exemplo;
- não há autenticação;
- não há banco de dados conectado;
- não há integrações externas;
- não há sincronização com Smart Schedule Pro;
- ações de produto que dependem de backend ainda não estão implementadas.

Todas as informações exibidas na demonstração são fictícias e servem apenas para ilustrar a experiência do RUMO. Não inclua credenciais, segredos ou dados pessoais neste repositório.

## Telas

- **Hoje** (`/today`): prioridades, compromissos, bloco de foco, check-in de energia e comparação entre planejado e realizado.
- **Planejamento** (`/plan`): visão semanal, compromissos fixos, blocos de foco, capacidade e alertas.
- **Tarefas** (`/tasks`): tarefas e projetos com categoria, prioridade, prazo, estimativa e status.
- **Foco** (`/focus`): tarefa selecionada, temporizador visual e histórico de sessões.
- **Revisão** (`/review`): planejado, realizado, adiamentos, imprevistos, vitórias, dificuldades, aprendizados e ajustes.
- **Dashboard** (`/dashboard`): indicadores separados de tarefas, horas, foco, sono, treino, estudo, trabalho estratégico, deslocamento e refeições.
- **Configurações** (`/settings`): perfil, preferências, categorias, notificações, privacidade e integrações opcionais.

A navegação também inclui a landing page em `/`. No desktop, o aplicativo usa sidebar; em telas pequenas, usa navegação inferior.

## Stack

- React 19 e React DOM;
- TypeScript;
- Vite 8 com TanStack Start;
- TanStack Router para rotas e SSR;
- TanStack Query para consumo das fixtures locais;
- Tailwind CSS 4 e `tw-animate-css`;
- componentes no estilo shadcn/ui, baseados em Radix UI;
- React Hook Form e Zod para o formulário de demonstração;
- Recharts para os gráficos do Dashboard;
- Lucide React para ícones;
- `date-fns` para utilitários de data;
- Nitro com preset Cloudflare para o build de produção.

## Requisitos

É necessário ter Node.js e npm instalados. O projeto não depende de Bun.

## Instalação e desenvolvimento

```sh
npm install
npm run dev
```

O servidor de desenvolvimento informa no terminal o endereço local disponível, normalmente em `http://127.0.0.1:8080`.

## Scripts

| Script | Função |
| --- | --- |
| `npm run dev` | inicia o servidor de desenvolvimento Vite; |
| `npm run build` | gera o build de produção com Vite, TanStack Start e Nitro; |
| `npm run build:dev` | gera um build usando o modo de desenvolvimento; |
| `npm run preview` | serve o conteúdo de `.output` com Wrangler; |
| `npm run lint` | executa ESLint; |
| `npm run typecheck` | executa o TypeScript em modo de verificação; |
| `npm run format` | formata os arquivos com Prettier. |

Para validar uma alteração:

```sh
npm run lint
npm run typecheck
npm run build
npm run preview
```

O preview deve ser executado depois de `npm run build`, pois ele serve o artefato gerado em `.output`.

## Arquitetura

```text
src/
├── components/
│   ├── brand/       identidade do RUMO
│   ├── common/      cabeçalhos, cards e estados compartilhados
│   ├── layout/      shell e navegação da aplicação
│   └── ui/          componentes reutilizáveis baseados em Radix
├── hooks/           hooks de responsividade e acesso às fixtures
├── lib/             dados de demonstração, navegação, datas e utilitários
├── routes/          landing, shell da aplicação e telas do produto
├── router.tsx       configuração do router
├── server.ts        entrada SSR com tratamento de erros
└── styles.css       tokens visuais e estilos globais
```

As fixtures ficam centralizadas em `src/lib/demo-data.ts` e são consumidas localmente pelo hook `src/hooks/use-demo-query.ts`. Essa separação deixa a demonstração previsível sem simular uma integração real.

## Decisões técnicas

### SSR e hidratação

O projeto usa TanStack Start com SSR. As fixtures síncronas são fornecidas como `initialData` do TanStack Query para que a renderização no servidor e a primeira renderização no cliente recebam o mesmo snapshot.

### Timezone da demonstração

As datas apresentadas na demonstração usam `Asia/Tokyo` como timezone de referência. Isso é uma decisão dos dados de exemplo, não uma conexão com calendário, localização ou serviço externo.

### Dados locais

O conteúdo demonstrativo é estático, local e explicitamente marcado como “Dados de exemplo”. IDs, relações e valores numéricos existem apenas para alimentar a interface, cálculos de capacidade e gráficos.

### Preview com Wrangler

O build gera `.output` com Nitro. O script `npm run preview` usa Wrangler para servir esse artefato localmente, permitindo verificar o resultado do build sem publicar ou fazer deploy.

## Limitações atuais

- não existe autenticação real;
- não existe persistência ou banco de dados;
- alterações feitas na interface não são sincronizadas com um servidor;
- Smart Schedule Pro não está conectado;
- não há APIs externas, automações ou notificações reais;
- o temporizador de foco é apenas visual nesta etapa;
- as métricas do Dashboard são exemplos, não análises de uma conta real;
- a demonstração não representa dados reais de uma pessoa, empresa ou família.

## Roadmap futuro

Os próximos passos possíveis, fora do escopo atual, incluem:

1. definir o modelo de dados e persistência;
2. adicionar autenticação e autorização;
3. permitir edição persistente de tarefas, agenda e preferências;
4. implementar uma integração opcional com Smart Schedule Pro;
5. substituir as fixtures por consultas reais sem alterar a experiência essencial das telas;
6. evoluir notificações, histórico e métricas com critérios de privacidade.

Esses itens são direcionais e não estão implementados neste repositório.
