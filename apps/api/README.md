# Vincis API - Módulo de Autenticação

Este repositório contém a lógica de Backend (Express) para a plataforma Vincis. A estrutura mais recente lida com a autenticação de ponta a ponta e gestão de identidades.

## 🔒 Autenticação e Segurança (Supabase)

Adotamos a **Integração via SDK do Supabase** (`@supabase/supabase-js`) para abstrair com segurança o hashing de senhas e JWTs, transferindo o peso mecânico do backend e mitigando brechas clássicas.

### Fluxo de Funcionamento

1. **Validação Estrita (Zod)**
   Antes de processar qualquer requisição, todos os inputs (e-mail, formato de senha) passam pelo nosso middleware genérico interceptador (Zod Validator). Se o formato for inválido (como senhas muito curtas ou sem números), ele é cortado na fonte devolvendo erro 400 antes mesmo de tocar as APIs externas.

2. **Supabase Auth**
   O controlador principal envia os dados limpos ao ecossistema do Supabase via função direta sem revelar chaves ao lado do front: `supabase.auth.signUp()` e `supabase.auth.signInWithPassword()`.

3. **Gerenciamento de Estado (HttpOnly Cookies)**
   Não retornamos os Tokens ao Front para salvar no vulnerável `LocalStorage`. Adotamos a postura recomendada de injetar de forma transparente os tokens `access_token` e `refresh_token` restritamente no ambiente do servidor via Cabeçalhos de Respostas `Set-Cookie` através do Express usando:
   - `httpOnly: true`
   - `sameSite: 'strict'`
   - *(Em produção, ativam-se as chaves seguras)*.
   
4. **Proteção Multi-Rotas & Autenticação Baseada em Middleware**
   Qualquer rota privativa que necessite do usuário instanciado (Ex: `GET /auth/me`) possui a flag interposta em seu endpoint do `requireAuth`. Esse verificador autônomo resgata a chave invisível do cookie, autentica do lado do servidor chamando `supabase.auth.getUser()`, e se autorizado, anexa em Tempo Real as informações do usuário atual à `Request` global permitindo que as regras do banco subsequentes sigam na API, se não, um imediato bloqueio 401 entra em efeito.

## 📡 Endpoints do Módulo (`/auth`)

| Rota | Descrição | Status/Proteção |
| :--- | :--- | :--- |
| `POST /register` | Cadastro de Usuários (Requer validador/Zod). | Público |
| `POST /login` | Autenticação (Garante Cookies HttpOnly). | Público |
| `GET /me` | Intercepta Cookies invisíveis, recupera o Status atual, e repassa propriedades logadas vindas do Supabase. | **Privado (requireAuth)** |

## 🧪 Como Testar

Para checar o fluxo de segurança de ponta a ponta (End-to-End):

1. **Tente Burlar:** Acesse a rota protegida pelo navegador: `http://localhost:5173/private`. O frontend será barrado com o Status `401 Unauthorized` e jogará você para o Login.
2. **Faça o Auth:** Cadastre-se ou Logue em `http://localhost:5173/auth`. 
3. **Validação e Cookies:** Sucesso no log-in redirecionará nativamente e reabrirá o Dashboard agora plotando as *suas* informações vindas no cookie.
