# Changelog — Feature: Edital Upload & UX Refactoring

> Sessão de desenvolvimento: 2026-05-27
> Escopo: `apps/api` + `apps/web`

---

## Visão Geral

Esta sessão de desenvolvimento cobriu as seguintes iniciativas:

1. **Correção de bugs críticos** de renderização e inicialização no Vue
2. **Refatoração completa da UI** da página de Edital (drag-and-drop, renomeação inline, preview)
3. **Implementação de endpoints REST** para atualização e exclusão de editais
4. **Integração com Supabase Storage** para exclusão de arquivos em nuvem
5. **Validação de tamanho de arquivo** (limite 10 MB) com feedback visual
6. **Consolidação dos alertas** para um único toast no canto superior direito

---

## Arquivos Modificados

---

### `apps/api`

---

#### `apps/api/src/lib/prisma.ts`
**O que mudou:** Corrigida a string de conexão com o banco de dados.
**Por quê:** O pooler PgBouncer (porta `6543`) causava timeouts intermitentes. A conexão foi alterada para usar `DIRECT_URL` (porta `5432`) que conecta diretamente ao Postgres, eliminando os timeouts.

---

#### `apps/api/src/features/edital/edital.service.ts`
**O que mudou:**
- Removida tipagem `any` da função `createEdital(data, studyPlanId)` — agora fortemente tipada.
- **Adicionado** método `updateEdital(id, studyPlanId, data)`: atualiza o título/metadados de um edital no banco de dados, validando que o registro pertence ao `studyPlanId` informado.
- **Adicionado** método `deleteEdital(id, studyPlanId)`: busca o caminho do arquivo no banco, chama `removeFile(...)` para remover do bucket Supabase Storage, e depois deleta o registro do banco via Prisma.

**Por quê:** O serviço precisava suportar as operações CRUD completas solicitadas (renomear título e excluir arquivo + registro).

---

#### `apps/api/src/features/edital/edital.controller.ts`
**O que mudou:**
- Todos os handlers existentes foram encapsulados em blocos `try/catch` para respostas de erro mais robustas.
- **Adicionado** handler `updateEdital`: valida o corpo da requisição com `updateEditalSchema` (Zod), chama o serviço e retorna `200 OK` com o registro atualizado.
- **Adicionado** handler `deleteEdital`: valida o parâmetro `:id` e `studyPlanId`, chama o serviço de exclusão e retorna `204 No Content`.

**Por quê:** Os novos métodos do serviço precisam de handlers HTTP correspondentes para serem acessíveis via API REST.

---

#### `apps/api/src/features/edital/edital.routes.ts`
**O que mudou:**
- **Registrada** rota `PATCH /editais/:id` → `updateEdital`
- **Registrada** rota `DELETE /editais/:id` → `deleteEdital`

**Por quê:** Sem o registro das rotas, os endpoints não seriam acessíveis pelo frontend.

---

### `apps/web`

---

#### `apps/web/src/hooks/useEditalUpload.ts`
**O que mudou:**

| Mudança | Por quê |
|---|---|
| `resetPreview()` foi movida para **antes** dos `watch` e `useMutation` | Corrige `ReferenceError: Cannot access 'resetPreview' before initialization` causado pela Temporal Dead Zone (TDZ) do JavaScript com `const` |
| `selectedFile` agora recebe um objeto `new File([], fileName, { type })` com `Object.defineProperty` para o `size` | O Vue valida `instanceof File` em runtime; passar um plain object causava freezes de renderização |
| **Adicionado** `deleteMutation` | Invoca `DELETE /editais/:id` para remover o arquivo do Supabase Storage e o registro do banco |
| **Adicionado** `renameMutation` + `renameEdital()` | Invoca `PATCH /editais/:id` para atualizar o título no banco e invalida o cache do React Query |
| **Adicionado** `savedEdital` e `isSavedEdital` como computed | Expõe ao componente se o edital atual já foi salvo no banco (para controlar o botão de renomear) |
| **Adicionado** `clearError()` (posteriormente removido do retorno público) | Permitia limpar o estado de erro inline — descontinuado quando o card de alerta foi removido |
| **Adicionado** `errorKey` (`ref<number>`) | Força o Vue a recriar o elemento de erro no DOM (via `:key`) mesmo quando a mensagem de erro é idêntica à anterior, garantindo que a animação re-dispare a cada nova violação |
| Validação de tamanho reordenada para **antes** do `resetPreview()` | Impede que selecionar um arquivo inválido limpe um arquivo válido já carregado |
| Toast `life` aumentado para `8000ms`; mensagem atualizada para texto mais urgente | Um toast de 5s era fácil de não perceber |

---

#### `apps/web/src/views/EditalView.vue`
**O que mudou:**
- Desestrutura os novos retornos do hook: `savedEdital`, `isSavedEdital`, `renameEdital`.
- Conecta `@rename="renameEdital"` ao componente `EditalUploader`.
- Removidos props e bindings de `uploadError`, `errorKey` e `@clear-error` após a consolidação para um único toast.

**Por quê:** A view é o ponto de ligação entre o composable e os componentes; precisava refletir todos os novos contratos.

---

#### `apps/web/src/components/edital/EditalUploader.vue`
**O que mudou:**

| Mudança | Por quê |
|---|---|
| **Substituído** `<FileUpload>` do PrimeVue por uma zona de drag-and-drop nativa HTML5 | O componente PrimeVue não oferecia controle granular suficiente sobre o estilo e o comportamento de arrastar |
| `handleFileChange` zera `target.value = ''` após emitir | Permite que o mesmo arquivo seja selecionado consecutivamente e o evento `@change` seja disparado novamente |
| **Adicionado** formulário de renomeação inline (`isEditingName`, `editNameInputRef`, `startNameEdit`, `saveName`, `cancelNameEdit`) | Permite ao usuário editar o título de um edital já salvo clicando no ícone de lápis |
| `displayName` usa `savedEdital.title` quando disponível | Garante que o nome exibido reflita o título do banco, não o nome físico do arquivo |
| Removido card de alerta vermelho embutido | Dois alertas simultâneos (card + toast) eram redundantes e poluíam a UI. O toast do canto superior direito foi mantido como único ponto de feedback |
| Removidos props `uploadError`, `errorKey` e emit `clearError` | Ficaram orphaned após a remoção do card de alerta |
| Removido "Guia Rápido" | Solicitado pelo usuário |

---

#### `apps/web/src/layouts/AppLayout.vue`
**O que mudou:** `<VToast />` foi montado globalmente no layout privado.

**Por quê:** O PrimeVue Toast exige que o componente `<Toast>` esteja presente no DOM para que `toast.add()` funcione. Sem ele no layout, os toasts não apareciam em nenhuma tela do dashboard.

---

#### `apps/web/src/vincis-primevue-theme.ts`
**O que mudou:**

| Token | Antes | Depois |
|---|---|---|
| `toast.root.width` | `22rem` | `26rem` |
| `toast.message.borderRadius` | `0.75rem` | `0.875rem` |
| `toast.message.border` | `1px solid` | `1.5px solid` |
| `toast.message.shadow` | Cinza discreto | Sombra alaranjada pronunciada |
| `toast.message.padding` | `0.75rem 1rem` | `1rem 1.125rem` |
| `toast.messageIcon.size` | `1.25rem` | `1.5rem` |
| `warn.background` | Branco (`surfaceContainerLowest`) | `#e65100` (cor de warning do DS) |
| `warn.borderColor` | Laranja 20% opaco | `#d4af37` (dourado primário) |
| `warn.color` | Cinza escuro | `#ffffff` |
| `warn.detailColor` | Cinza secundário | `rgba(255,255,255,0.85)` |
| `warn.iconBackground` | Container laranja claro | `rgba(255,255,255,0.20)` |
| `warn.iconColor` | Laranja `#e65100` | `#fff3e0` (creme claro) |

**Por quê:** O toast de `warn` antes era virtualmente indistinguível dos outros toasts (fundo branco, borda fina laranja). A nova versão usa o fundo sólido laranja-escuro do design system, tornando-o imediatamente visível e inequívoco, sem introduzir novas cores fora da paleta Vincis.

---

#### `apps/web/src/global.css`
**O que mudou:** Adicionadas as keyframes e classes utilitárias `animate-warning-shake` e `animate-warning-glow` (posteriormente não mais usadas no componente após a remoção do card, mas mantidas no CSS para uso futuro).

**Por quê:** Foram criadas para animar o card de alerta inline. Com a remoção do card, as classes estão disponíveis mas inativas.

---

#### `apps/web/src/App.vue`
**O que mudou:** O fallback da boundary de erro global foi substituído por uma página de erro limpa e profissional.

**Por quê:** O fallback anterior exibia o stack trace bruto do Vue diretamente na tela, expondo informações internas para o usuário final.

---

## Resumo das Decisões Técnicas

| Decisão | Alternativa descartada | Motivo |
|---|---|---|
| `new File([], name, { type })` + `Object.defineProperty(size)` | Plain object `{ name, size, type }` | O Vue faz `instanceof File` em runtime; plain object causava freeze |
| `resetPreview` declarada antes dos `watch` | Deixar na posição original | TDZ: `watch({ immediate: true })` executava antes da função ser declarada |
| `:key="errorKey"` com timestamp | Comparar mensagem de erro anterior | Vue não recria o elemento se apenas o conteúdo muda; o key force-remonta |
| Toast único no canto superior direito | Card embutido + toast simultâneos | Dois alertas ao mesmo tempo eram redundantes e confusos |
| Fundo sólido `#e65100` no toast warn | Toast com borda colorida e fundo branco | A versão sutil era facilmente ignorada pelo usuário |
