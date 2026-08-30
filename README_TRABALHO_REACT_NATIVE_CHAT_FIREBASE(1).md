# 📱 CP1 --- React Native

## Chat com Firebase --- Authentication + Realtime Database

------------------------------------------------------------------------

# 🧾 Enunciado

Desenvolva um aplicativo de **chat em React Native com TypeScript**,
utilizando o **Firebase** como backend.

O aplicativo deverá implementar autenticação por diferentes provedores e
comunicação em tempo real entre **duas pessoas**, utilizando o
**Firebase Realtime Database**.

O projeto deverá aplicar os conceitos estudados em aula:

-   React Native
-   Expo
-   TypeScript
-   Hooks
-   Componentização
-   Firebase Authentication
-   Firebase Realtime Database
-   Atualizações em tempo real
-   Tratamento de erros
-   Loading
-   Tipagem forte
-   Organização em módulos

> **Importante:** o trabalho deverá utilizar **Firebase Realtime
> Database**, e não Cloud Firestore, para armazenar e sincronizar as
> mensagens.

------------------------------------------------------------------------

# 🎯 Objetivo

Construir um aplicativo de chat funcional no qual usuários autenticados
possam trocar mensagens em tempo real.

São obrigatórias as seguintes formas de autenticação:

-   E-mail e senha
-   Google
-   Apple

Cada conversa deverá possuir **exatamente duas pessoas**.

------------------------------------------------------------------------

# 🧰 Tecnologias obrigatórias

-   React Native
-   Expo
-   **Expo SDK 54 ou superior**
-   TypeScript
-   Firebase Authentication
-   Firebase Realtime Database

------------------------------------------------------------------------

# 📱 Plataformas

O aplicativo deverá executar corretamente em:

-   iOS
-   Android

A autenticação por provedor deverá respeitar a disponibilidade e as
configurações necessárias de cada plataforma.

------------------------------------------------------------------------

# 🔥 Serviços Firebase obrigatórios

## Firebase Authentication

Responsável pelo cadastro, autenticação e identificação dos usuários.

## Firebase Realtime Database

Responsável pelo armazenamento das informações necessárias ao chat e
pela sincronização das mensagens em tempo real.

------------------------------------------------------------------------

# 🔐 Authentication

## E-mail e Senha

O aplicativo deverá permitir:

-   Criar uma conta
-   Informar e-mail e senha
-   Realizar login
-   Tratar credenciais inválidas
-   Realizar logout

## Google

O aplicativo deverá:

-   Permitir login utilizando conta Google
-   Obter os dados básicos disponibilizados pelo provedor
-   Identificar que o usuário entrou utilizando Google

## Apple

O aplicativo deverá:

-   Permitir login utilizando Apple
-   Obter os dados disponibilizados pelo provedor
-   Identificar que o usuário entrou utilizando Apple

------------------------------------------------------------------------

# 👤 Usuário autenticado

O usuário deverá ser identificado pelo `uid` fornecido pelo Firebase
Authentication.

Exemplo:

``` ts
type AuthProvider = 'password' | 'google' | 'apple';

type ChatUser = {
  uid: string;
  name: string;
  email: string | null;
  provider: AuthProvider;
};
```

É proibido utilizar usuários hardcoded para substituir a autenticação do
Firebase.

------------------------------------------------------------------------

# 💬 Regra principal do Chat

O chat será exclusivamente **1 para 1**.

Não será permitido:

-   Chat em grupo
-   Sala com três ou mais participantes
-   Chat público
-   Mensagens disponíveis para todos os usuários

Cada conversa deverá possuir exatamente dois participantes.

------------------------------------------------------------------------

# 🔀 Regra de comunicação por tipo de autenticação

A forma utilizada para autenticar deverá determinar com quem o usuário
poderá conversar.

``` text
E-mail/Senha
     │
     └──── conversa com ──── Google OU Apple
```

## Combinações permitidas

-   E-mail/Senha ↔ Google
-   E-mail/Senha ↔ Apple

## Combinações não permitidas

-   E-mail/Senha ↔ E-mail/Senha
-   Google ↔ Google
-   Apple ↔ Apple
-   Google ↔ Apple

O aplicativo deverá implementar essa regra de forma funcional.

------------------------------------------------------------------------

# 👥 Seleção do participante

Após realizar o login, o usuário deverá visualizar apenas pessoas
compatíveis com a regra definida.

Se o usuário entrou com **E-mail/Senha**, deverá visualizar para
conversa usuários autenticados com:

-   Google
-   Apple

Se o usuário entrou com **Google** ou **Apple**, deverá visualizar para
conversa somente usuários autenticados com:

-   E-mail/Senha

O usuário não poderá iniciar uma conversa consigo mesmo.

------------------------------------------------------------------------

# 🗨️ Conversa 1 para 1

Uma possível tipagem para a conversa é:

``` ts
type Conversation = {
  id: string;
  participants: [string, string];
  createdAt: number;
};
```

Os participantes deverão ser identificados pelos respectivos `uid` do
Firebase Authentication.

------------------------------------------------------------------------

# 📨 Mensagens

Cada mensagem deverá possuir, no mínimo:

``` ts
type ChatMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  text: string;
  createdAt: number;
};
```

É proibido utilizar `any`.

------------------------------------------------------------------------

# ⚡ Realtime Database

As mensagens deverão ser armazenadas no **Firebase Realtime Database**.

Quando uma nova mensagem for enviada, a conversa deverá ser atualizada
automaticamente para os participantes.

O usuário não deverá precisar:

-   Atualizar a tela manualmente
-   Fechar e abrir novamente o chat
-   Pressionar um botão para buscar novas mensagens

------------------------------------------------------------------------

# 🗃️ Estrutura sugerida

``` text
users
  └── uid
       ├── name
       ├── email
       └── provider

conversations
  └── conversationId
       ├── participants
       └── createdAt

messages
  └── conversationId
       └── messageId
            ├── senderId
            ├── receiverId
            ├── text
            └── createdAt
```

Outra estrutura poderá ser utilizada, desde que permita identificar
corretamente:

-   Usuários
-   Conversas
-   Participantes
-   Remetente
-   Destinatário
-   Mensagens

------------------------------------------------------------------------

# 🖥️ Telas obrigatórias

## 🔐 Tela de Login

Deverá conter:

-   Campo de e-mail
-   Campo de senha
-   Botão de login com e-mail/senha
-   Opção para cadastro
-   Botão de login com Google
-   Botão de login com Apple
-   Loading durante autenticação
-   Mensagens de erro

## 👥 Tela de Usuários / Contatos

Deverá:

-   Mostrar somente usuários compatíveis
-   Exibir nome do usuário
-   Exibir forma de autenticação
-   Permitir selecionar uma pessoa para conversar
-   Impedir conversa do usuário consigo mesmo

## 💬 Tela de Chat

Deverá conter:

-   Nome do participante
-   Lista de mensagens
-   Diferenciação visual entre mensagens enviadas e recebidas
-   Campo para digitar mensagem
-   Botão para enviar
-   Atualização em tempo real
-   Rolagem da conversa
-   Estado para conversa sem mensagens

------------------------------------------------------------------------

# 🚪 Logout

O aplicativo deverá permitir logout.

Após o logout:

-   A sessão atual deverá ser encerrada
-   O usuário autenticado deverá ser removido do estado da aplicação
-   O fluxo deverá retornar para autenticação
-   O usuário anterior não poderá continuar acessando o chat

------------------------------------------------------------------------

# ⚛️ Hooks obrigatórios

Deverão ser utilizados adequadamente:

-   `useState`
-   `useEffect`
-   `useMemo`
-   `useCallback`

Os hooks deverão possuir finalidade funcional real.

------------------------------------------------------------------------

# 🔷 TypeScript obrigatório

É obrigatório:

-   Tipar componentes
-   Tipar propriedades
-   Tipar usuários
-   Tipar conversas
-   Tipar mensagens
-   Tipar estados
-   Tipar funções
-   Tipar dados utilizados pelo Firebase

## ❌ Não utilizar `any`

O uso de `any` será considerado erro de implementação.

------------------------------------------------------------------------

# ♻️ Imutabilidade

As alterações de estado deverão respeitar imutabilidade.

``` ts
setMessages((previous) => [
  ...previous,
  newMessage,
]);
```

------------------------------------------------------------------------

# 🧩 Componentização

O projeto deverá utilizar componentes reutilizáveis e separação de
responsabilidades.

Exemplo:

``` text
components/
  ChatMessage.tsx
  ChatInput.tsx
  UserItem.tsx
  Loading.tsx
  ErrorMessage.tsx
```

------------------------------------------------------------------------

# 🧱 Estrutura sugerida

``` text
src/
  components/
    ChatMessage.tsx
    ChatInput.tsx
    UserItem.tsx

  screens/
    LoginScreen.tsx
    UsersScreen.tsx
    ChatScreen.tsx

  services/
    firebase.ts
    authService.ts
    chatService.ts
    userService.ts

  hooks/
    useAuth.ts
    useChat.ts

  contexts/
    AuthContext.tsx

  types/
    user.ts
    chat.ts

  utils/
    chatRules.ts
```

O aluno poderá utilizar outra estrutura, desde que o projeto esteja
organizado e modularizado.

------------------------------------------------------------------------

# 📦 Services

A comunicação com Firebase deverá estar separada da interface sempre que
possível.

## `authService.ts`

Responsável por operações como:

-   Cadastro
-   Login com e-mail/senha
-   Google
-   Apple
-   Logout

## `chatService.ts`

Responsável por operações como:

-   Criar ou localizar conversa
-   Enviar mensagem
-   Escutar mensagens
-   Remover listeners

------------------------------------------------------------------------

# 🔄 Comunicação em tempo real

O fluxo esperado é:

``` text
Usuário A envia mensagem
          ↓
Firebase Realtime Database
          ↓
Usuário B recebe a atualização
          ↓
Tela atualiza automaticamente
```

Listeners deverão ser removidos corretamente quando não forem mais
necessários.

------------------------------------------------------------------------

# ⏳ Estados da aplicação

A interface deverá tratar:

-   Loading
-   Erro
-   Usuário não autenticado
-   Nenhum contato disponível
-   Conversa sem mensagens
-   Falha no envio da mensagem

------------------------------------------------------------------------

# 🔒 Segurança

O Firebase Realtime Database deverá possuir regras de segurança.

Não será aceita a utilização permanente de regras abertas como:

``` json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

O banco deverá exigir autenticação para os dados protegidos.

As regras deverão considerar, sempre que possível, que apenas usuários
autenticados e participantes da conversa tenham acesso às mensagens
correspondentes.

------------------------------------------------------------------------

# ⚠️ Tratamento de erros

O aplicativo deverá tratar erros relacionados a:

-   Login
-   Cadastro
-   Google Sign-In
-   Apple Sign-In
-   Leitura do Realtime Database
-   Envio de mensagens
-   Conectividade

O usuário deverá receber feedback compreensível quando ocorrer uma
falha.

------------------------------------------------------------------------

# 🎨 Interface

A aplicação deverá possuir:

-   Flexbox
-   `StyleSheet`
-   Organização visual consistente
-   Campos adequados
-   Botões identificáveis
-   Feedback de loading
-   Feedback de erro
-   Diferenciação visual entre mensagens enviadas e recebidas

------------------------------------------------------------------------

# 🚫 Não será permitido

-   Utilizar Cloud Firestore no lugar do Realtime Database
-   Utilizar `any`
-   Substituir Firebase Authentication por usuários hardcoded
-   Criar chat público
-   Criar chat em grupo
-   Permitir mais de duas pessoas em uma conversa
-   Ignorar a regra entre os provedores
-   Manter o Realtime Database permanentemente público
-   Simular mensagens sem armazená-las no Firebase

------------------------------------------------------------------------

# 📄 README.md obrigatório

O repositório deverá possuir obrigatoriamente um arquivo `README.md`.

O README deverá conter:

-   Nome do projeto
-   Descrição
-   Tecnologias utilizadas
-   Versão do Expo
-   Serviços Firebase utilizados
-   Instruções para execução
-   Instruções básicas de configuração do Firebase
-   Estrutura do projeto
-   Prints da aplicação
-   Nome completo dos integrantes
-   RM de todos os integrantes

Exemplo:

``` md
## Integrantes

- RM12345 - João da Silva
- RM54321 - Maria Souza
```

> ⚠️ **REGRA IMPORTANTE:** caso o `README.md` não contenha o **NOME e RM
> de todos os integrantes**, o trabalho receberá **nota ZERO**.
> **Quantidade máxima de integrantes: 5**.

------------------------------------------------------------------------

# 📤 Entrega

A entrega deverá ser realizada pelo **Microsoft Teams**, na aba **Tarefas**:

``` text
Task: CheckPoint 1 - Chat
```

Deverá ser enviado **apenas o link do repositório no GitHub**.


------------------------------------------------------------------------

# 🧪 Critérios de avaliação

  Critério                                            Pontos
  ----------------------------------------------- ----------
  Authentication --- E-mail/Senha                        1,0
  Authentication --- Google                              1,0
  Authentication --- Apple                               1,0
  Regra de comunicação entre provedores                  1,0
  Chat 1 para 1                                          1,0
  Realtime Database e atualização em tempo real          2,0
  TypeScript, Hooks e ausência de `any`                  1,0
  Organização, services e componentização                1,0
  UI, loading e tratamento de erros                      1,0
  **Total**                                         **10,0**

------------------------------------------------------------------------

# ✅ Checklist de requisitos

-   [ ] React Native
-   [ ] TypeScript
-   [ ] Expo SDK 55
-   [ ] Firebase configurado
-   [ ] Login com e-mail/senha
-   [ ] Cadastro com e-mail/senha
-   [ ] Login com Google
-   [ ] Login com Apple
-   [ ] Logout
-   [ ] Usuário identificado pelo Firebase Authentication
-   [ ] Regra entre provedores implementada
-   [ ] Chat somente entre duas pessoas
-   [ ] Mensagens no Realtime Database
-   [ ] Atualização em tempo real
-   [ ] Mensagens enviadas e recebidas diferenciadas
-   [ ] Loading
-   [ ] Tratamento de erros
-   [ ] Regras de segurança configuradas
-   [ ] Hooks obrigatórios utilizados corretamente
-   [ ] Projeto sem `any`
-   [ ] Componentização
-   [ ] Services separados
-   [ ] README.md presente
-   [ ] README.md com NOME e RM de todos os integrantes
-   [ ] Repositório disponível no GitHub

------------------------------------------------------------------------

# 🏁 Resultado esperado

Ao final, espera-se um aplicativo:

-   Funcional
-   Autenticado pelo Firebase
-   Com login por E-mail/Senha, Google e Apple
-   Com controle de comunicação baseado no provedor
-   Com conversa exclusivamente entre duas pessoas
-   Com mensagens persistidas no Realtime Database
-   Com atualização em tempo real
-   Tipado com TypeScript
-   Sem `any`
-   Organizado em módulos
-   Com tratamento de loading e erros
-   Executando em iOS, Android e Web (Expo Go)

------------------------------------------------------------------------

# 📚 Referências

-   React Native: https://reactnative.dev/
-   Expo: https://docs.expo.dev/
-   TypeScript: https://www.typescriptlang.org/docs/
-   Firebase: https://firebase.google.com/docs
-   Firebase Authentication: https://firebase.google.com/docs/auth
-   Firebase Realtime Database:
    https://firebase.google.com/docs/database
