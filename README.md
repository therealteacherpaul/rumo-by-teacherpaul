# Rumo: By Teacher Paul

use a identidade visual presente no pdf anexado.

Quero iniciar um novo aplicativo SaaS chamado:

RUMO by Teacher Paul

Slogan:

“Seu sistema operacional pessoal.”

Endosso:

“Powered by Método BÚSSOLA™”

IMPORTANTE SOBRE O PRODUTO

RUMO é um produto novo e independente do Smart Schedule Pro.

O RUMO deve funcionar integralmente sozinho. No futuro, o usuário poderá conectar opcionalmente sua conta do Smart Schedule Pro para importar eventos, contatos e locais favoritos, mas essa integração não pode ser necessária para usar nenhuma funcionalidade essencial.

OBJETIVO DO PRODUTO

O RUMO ajuda profissionais com rotinas fragmentadas a transformar prioridades em execução realista, considerando:

- compromissos fixos;

- tarefas e projetos;

- deslocamentos;

- foco e produtividade;

- estudos;

- trabalho;

- geração de renda;

- sono;

- alimentação;

- exercício;

- família;

- tarefas domésticas;

- imprevistos;

- planejamento versus execução real.

O produto não deve incentivar produtividade tóxica nem tentar preencher todos os minutos do dia. A proposta é devolver clareza, direção e tempo.

OBJETIVO DESTA PRIMEIRA IMPLEMENTAÇÃO

Nesta etapa, construa somente a fundação visual e estrutural do frontend.

Não implemente ainda:

- banco de dados;

- autenticação real;

- Supabase;

- Gemini;

- pagamentos;

- Smart Schedule Pro;

- APIs externas;

- automações;

- dados complexos;

- funcionalidades simuladas que pareçam estar realmente funcionando.

Crie uma interface navegável usando dados locais de demonstração claramente identificados como “Dados de exemplo”.

STACK DO FRONTEND

Use:

- React;

- TypeScript;

- Vite;

- Tailwind CSS;

- shadcn/ui;

- React Router;

- TanStack Query;

- React Hook Form;

- Zod.

O código deve possuir componentes reutilizáveis, boa separação de responsabilidades e estrutura preparada para futura conexão com Supabase.

IDENTIDADE VISUAL

A marca deve transmitir:

- clareza;

- direção;

- confiança;

- sofisticação discreta;

- humanidade;

- produtividade sustentável.

Utilize como base:

- azul-marinho profundo;

- dourado discreto;

- branco;

- cinzas claros;

- tipografia elegante e altamente legível.

Evite:

- visual infantil;

- excesso de gradientes;

- neon;

- gamificação exagerada;

- dashboards visualmente poluídos;

- aparência genérica de template de startup;

- linguagem de guru ou “hustle culture”.

ESTRUTURA DO APLICATIVO

Crie as seguintes rotas:

1. `/`

Landing/login de apresentação do RUMO.

2. `/today`

Página “Hoje”.

Mostrar:

- saudação;

- data;

- próximos compromissos;

- três prioridades do dia;

- bloco de foco;

- breve check-in de energia;

- indicador planejado versus realizado.

3. `/plan`

Página “Planejamento”.

Mostrar:

- visão semanal;

- compromissos fixos;

- blocos de foco;

- capacidade estimada;

- alertas de conflito ou sobrecarga.

4. `/tasks`

Página “Tarefas”.

Mostrar:

- tarefas;

- projetos;

- categorias;

- prioridade;

- prazo;

- duração estimada;

- status.

5. `/focus`

Página “Foco”.

Mostrar:

- temporizador estilo Pomodoro;

- tarefa selecionada;

- duração planejada;

- histórico de sessões.

O temporizador pode ser apenas visual nesta etapa.

6. `/review`

Página “Revisão semanal”.

Mostrar:

- o que foi planejado;

- o que foi realizado;

- tarefas adiadas;

- imprevistos;

- vitórias;

- dificuldades;

- aprendizados;

- ajustes para a próxima semana.

7. `/dashboard`

Página “Dashboard”.

Mostrar dados de exemplo para:

- tarefas planejadas versus concluídas;

- horas por categoria;

- sessões de foco;

- sono planejado versus realizado;

- treino;

- estudo;

- trabalho estratégico;

- deslocamento;

- refeições em casa versus konbini.

Não criar um único “índice de produtividade”. Os indicadores devem ser compreensíveis individualmente.

8. `/settings`

Página “Configurações”.

Criar seções para:

- perfil;

- preferências;

- categorias;

- notificações;

- privacidade;

- integrações.

Dentro de integrações, mostrar:

“Smart Schedule Pro — não conectado”

Incluir botão desabilitado ou claramente marcado:

“Conectar futuramente”

Adicionar o texto:

“O RUMO funciona normalmente sem o Smart Schedule Pro. A integração é opcional.”

NAVEGAÇÃO

No desktop:

- sidebar lateral;

- logo RUMO;

- navegação com ícones;

- área principal limpa;

- opção de recolher a sidebar.

No celular:

- navegação inferior ou menu adequado para telas pequenas;

- preservar acesso rápido a Hoje, Planejamento, Tarefas e Revisão.

DADOS DE EXEMPLO

Use exemplos baseados em uma rotina profissional real, com categorias como:

- Spring;

- Deslocamento;

- Faculdade;

- Rocketseat;

- RUMO;

- Smart Schedule;

- Mentorias;

- Família;

- Exercício;

- Alimentação;

- Tarefas domésticas;

- Descanso.

Marque claramente esses registros como demonstração, pois ainda não há banco de dados conectado.

REQUISITOS DE QUALIDADE

- Interface responsiva.

- Componentes reutilizáveis.

- Estados vazios bem desenhados.

- Hierarquia visual clara.

- Contraste acessível.

- Textos em português brasileiro.

- Não inventar funcionalidades de backend.

- Não adicionar recursos fora deste escopo.

- Não conectar serviços externos nesta etapa.

- Preparar a estrutura para futura integração com Supabase.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://rumo-by-teacherpaul.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/697a87cd-6fa4-406f-831e-bcf5623302a8).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
