# Auditoria da entrega acadêmica — 27/09/2026

## Base e preservação

Base selecionada: `3af52ac`, compartilhada pela branch local `feat/ui-ux-audit-2026-09-18` e pela referência remota `fix/foundation-review`, confirmada com `git ls-remote`.

A escolha foi sustentada pelo código: AuthProvider com Supabase Auth, TaskDataProvider com CRUD, repositórios persistentes de hábitos/Focus/alertas, função autenticada de IA e entrega foreground. Existem testes de hábitos com repositório controlado e PGlite, testes de cálculos de Plan/Review e verificações de alertas/Focus. Isso não constitui aprovação integral do MVP.

| Referência antes da preparação | Relação com a base selecionada |
| --- | --- |
| `main` e `origin/main` (`b56adb3`) | Ancestrais, 84 commits atrás |
| `integrate/auth-on-remote` (`0e9bf5e`) | Ancestral, 51 commits atrás |
| `fix/foundation-review` local (`306bc34`) | 3 commits exclusivos locais e 63 exclusivos da candidata |
| `feat/ui-ux-audit-2026-09-18` e `origin/fix/foundation-review` | Mesmo commit |

Os três commits exclusivos da antiga branch local tratam de autenticação, integração Lovable e compatibilidade de hábitos. A candidata contém implementações desses domínios, mas não foi feita integração automática nem declarada equivalência de cada patch.

Checkout original: `/Users/takarastefens/Downloads/RUMO`, mantido em `integrate/auth-on-remote`. Alterações existentes em README, ignore, providers, tipos, rotas e novos arquivos de documentação/testes permaneceram nesse checkout. Foi registrado snapshot de hashes dos arquivos, índice e status fora do repositório para conferência final.

Worktree de entrega: `/Users/takarastefens/Downloads/RUMO-entrega`. A branch `entrega` não existia antes da preparação.

## Alterações desta preparação

- README revisado conforme implementação e evidências atuais; identificação acadêmica preexistente preservada sem alteração.
- `.gitignore` para dependências, build, caches, cobertura opcional, logs, ambientes locais e temporários; exemplos, fontes, migrations, assets e lockfile preservados.
- `.env.example` com placeholders, sem credenciais.
- Este relatório, sem dados de contas reais.

Os relatórios anteriores em `docs/` foram lidos como evidências históricas. Eles descrevem etapas nas quais IA, Focus e Plan/Review ainda eram parciais. A implementação atual difere dessas etapas. Não foi encontrado um relatório final independente entre os arquivos versionados; nenhum PDF externo foi importado.

## Validação reproduzida

Ambiente: Bun 1.4.2, Node.js 24.11.1.

| Verificação | Resultado |
| --- | --- |
| `bun install --frozen-lockfile` | Passou; lockfile preservado |
| `bun run typecheck` | Passou |
| `bun run build` | Passou; avisos de chunk acima de 500 kB e `inlineDynamicImports` ignorado com `codeSplitting` |
| `bun run lint` | Falhou: 479 erros Prettier, 1 `prefer-const`, 2 avisos Fast Refresh; baseline anterior às edições |
| `RUMO_TEST_MODULES=/tmp/rumo-entrega-test-tools/node_modules node --test tests/*.test.mjs` | 14 testes passaram; o arquivo de planejamento falhou ao carregar |
| `git diff --check` | Passou nas alterações da entrega |
| Regras de ignore | Fontes e arquivos relevantes continuam permitidos; artefatos locais e segredos locais ignorados |
| Varredura local de assinaturas de segredos | Nenhuma assinatura privada reconhecida; não é garantia de ausência de todo segredo possível |

As dependências auxiliares foram instaladas fora do checkout conforme o comando no README. PGlite executou apenas SQL local de hábitos. Os três testes React usam repositório controlado, bloqueiam o repositório remoto e emitem aviso de depreciação de react-test-renderer. Testes de Focus/alertas incluem verificações estáticas da migration, não execução real das políticas no Supabase.

O arquivo `tests/planning.test.mjs` importa um serviço que agora alcança `planning.functions.ts`. No Node direto, o alias `@/integrations` não é resolvido (`ERR_MODULE_NOT_FOUND`). Os casos desse arquivo não executaram. Alguns nomes ainda mencionam integração pendente, embora o adaptador real esteja presente. A correção do harness e a atualização dessas expectativas precisam de trabalho separado; nenhum teste foi removido, mascarado ou declarado aprovado.

## Navegador e publicação

- `bun run dev --host 127.0.0.1 --port 5187` iniciou o servidor local.
- Página inicial publicada e `/today?mode=demo` carregaram, com exemplos e controles do planejador/alertas.
- Local: Hoje e Planejamento demonstrativos renderizaram a 375 px, com largura do documento igual à viewport.
- Outras rotas demo foram abertas, mas a coleta imediata não confirmou a renderização completa; não contam como aprovação responsiva ou funcional.
- Não foram coletadas screenshots nem executadas gravações autenticadas, chamadas de IA, permissões de notificação ou migrations remotas. Abrir hábitos autenticados pode inicializar registros, razão para limitar a navegação ao demo.
- Não foi comprovada correspondência exata entre o build publicado e o commit de base. O site já contém alertas na demonstração, mas isso não valida as notificações foreground autenticadas.
- Preview Wrangler, ciclo real de login/logout, persistência remota e sequência completa das migrations em banco vazio não foram testados.

## Arquivos herdados para revisão separada

- `.env`: já rastreado, agora corresponde ao ignore. Contém URLs/identificadores e chaves publishable; valores não reproduzidos. Nenhuma chave administrativa ou de IA foi identificada nele. Não foi alterado nem desrastreado. O commit novo não inclui esse arquivo, mas ele continua na árvore herdada; a entrega não é um pacote sem `.env`.
- `src/routeTree.gen.ts` e `src/integrations/supabase/types.ts`: gerados e rastreados, necessários à tipagem/compilação atual; mantidos sem novas alterações.
- Integração Supabase inclui módulos marcados como gerados pelo Lovable; preservados para sincronização.
- README mantém os metadados acadêmicos já existentes. Sua inclusão anterior deve ser considerada antes de qualquer publicação adicional; nenhum dado de conta de teste foi acrescentado.
- Não há PDFs nem screenshots versionados na base. Dependências auxiliares, logs de validação e snapshot de preservação ficaram fora do repositório; `node_modules/`, `.output/` e `.wrangler/` ficam ignorados.

Nenhum arquivo foi excluído ou removido do índice. Não houve push, merge na main, deploy, reescrita do histórico ou alteração de banco de produção.
