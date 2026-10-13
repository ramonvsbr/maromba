# Maromba

App Android de treino de academia, 100% local: sem servidor, sem internet, sem conta.
Os dados ficam salvos no próprio aparelho (`localStorage` da WebView do app).
Feito com JavaScript, HTML e CSS puros, empacotado como APK com Capacitor.

> Este projeto é **somente Android**. A versão web/PWA foi descontinuada.

## Instalar

Gere o APK (veja "Desenvolvimento" abaixo), passe para o celular, permita a
instalação de fontes desconhecidas e abra o arquivo. Instalar uma versão nova
**por cima** da anterior mantém os seus dados. **Desinstalar o app apaga tudo**,
então exporte um backup antes (veja "Backup dos dados").

## Arquivos

- `src/` — fontes do app (`index.html`, JavaScript, CSS e `fonts/`)
- `package.json`, `capacitor.config.json`, `copiar-www.js` — Capacitor e script que copia o app para `www/`
- `android/` — projeto Android gerado pelo Capacitor
- `www/` — cópia gerada por `npm run sync` (não editar nem versionar)

## Como usar

1. **Equipamentos** — marque o que sua academia tem. Isso filtra tudo o resto.
2. **Exercícios** — navegue por músculo; só aparece o que dá pra fazer com o que você
   marcou (dá pra desligar esse filtro). Toque num exercício pra ver os músculos
   trabalhados na silhueta e o último peso registrado.
3. **Montar treino** — o botão amarelo fica no topo da tela inicial. Dê um nome,
   escolha um grupo muscular no seletor e toque em "Adicionar" (ex.: peito e depois
   costas). Cada grupo adicionado abre sua própria caixa com um seletor de exercícios
   daquele músculo (só os disponíveis com seu equipamento aparecem) e um botão
   "Adicionar". Dá pra remover um grupo muscular tocando no ✕ da caixa. Depois defina,
   por exercício: séries, repetições, peso e pausa. Use as setas ↑/↓ ao lado de cada
   exercício adicionado pra reordenar a sequência do treino. O topo mostra os
   músculos cobertos pelo treino inteiro e o tempo estimado.
4. **Meus treinos** — inicie, edite ou apague os treinos salvos.
5. **Treino ativo** — durante a execução, mostra o(s) músculo(s) do exercício atual na
   silhueta, cronômetro de descanso entre séries, tempo decorrido e os músculos já
   trabalhados na sessão. Enquanto a sessão está aberta, a tela do celular não apaga
   sozinha (Wake Lock), e ao fim de cada descanso o app apita e vibra pra avisar,
   mesmo que você não esteja olhando pro celular. Ao terminar, você confirma o
   salvamento no histórico (com a data de hoje).
6. **Histórico** — todas as sessões salvas, com data, duração e séries feitas. O
   gráfico no topo mostra a evolução de carga (maior peso por sessão) de um exercício
   escolhido, pra acompanhar sua progressão ao longo do tempo.
7. **Dieta** — registre suas refeições do dia: horário, nome (ex.: "Café da manhã",
   "Almoço") e os ingredientes que a compõem, com a quantidade em gramas. Os dados
   nutricionais de cada ingrediente vêm da **Tabela TACO** (Tabela Brasileira de
   Composição de Alimentos, NEPA/UNICAMP): busque o alimento pelo nome, escolha a
   quantidade e toque em "Adicionar". Cada refeição salva mostra, na lista do dia,
   o nome, o horário e um resumo de calorias e macros (proteínas, carboidratos e
   gorduras); toque nela pra abrir o detalhe com cada ingrediente e sua quantidade.
   O topo da tela soma as calorias e macros de todas as refeições do dia selecionado
   (use as setas ou o campo de data pra navegar entre os dias). Se um alimento não
   estiver na tabela, cadastre um **alimento personalizado** informando os valores
   nutricionais por 100g (do rótulo da embalagem, por exemplo). Os valores da TACO
   são uma referência média: o preparo real (tempero, marca, ponto de cozimento)
   pode variar um pouco o resultado.
   Use **"Definir meta"** (ou "Editar meta"), no topo ao lado do título, pra informar
   quanto pretende consumir de calorias e de cada macro por dia; deixe um campo em 0
   pra não acompanhar aquele valor. Com a meta definida, a tela mostra o quanto já foi
   consumido no dia frente à meta, com uma barra de progresso por item (fica vermelha
   se você passou da meta). O botão **"+ Nova refeição"** fica logo acima da lista do dia.
8. **Água** — registre sua ingestão de água ao longo do dia. Toque num dos botões de
   medida rápida (200, 250, 300, 500, 750 ou 1000 ml) ou digite uma quantidade
   personalizada e toque em "Adicionar". O topo da tela mostra o total bebido no
   dia e, se você definir uma meta, uma barra de progresso (fica vermelha se você
   já passou da meta). Use as setas ou o campo de data pra ver/editar dias
   anteriores; cada registro pode ser excluído individualmente.
   Em **"Meta e lembretes"** você define:
   - a **meta diária** em ml;
   - os horários de **acordar** e **dormir** (os lembretes nunca disparam fora
     dessa janela);
   - de quanto em quanto tempo (em minutos, mínimo 15) quer ser lembrado;
   - e pode **ativar as notificações** (o Android vai pedir permissão).

   Os lembretes são agendados no sistema, então chegam **mesmo com o app fechado** e
   continuam depois de reiniciar o celular. O texto da notificação é fixo (mostra a
   meta do dia, não o total já bebido). Se não aparecerem no horário, libere as
   notificações do Maromba nas configurações do Android e, se necessário, tire a
   restrição de bateria do app (Configurações → Apps → Maromba → Bateria → "Sem
   restrições").
9. **Ajustes → Dados** — exporte um arquivo `.json` com todo o seu backup (equipamentos,
   treinos, histórico, dieta, água e alimentos personalizados) ou importe um arquivo
   pra restaurar/migrar seus dados pra outro aparelho.

## Sobre "carga, repetições, peso e pausa"

Na tela de montar treino, cada exercício tem quatro campos: **séries** (quantidade de
séries), **repetições** (por série), **peso** (kg) e **pausa** (segundos de descanso
entre séries).

## Backup dos dados

Como tudo fica no aparelho, vale exportar de vez em quando e guardar o arquivo fora do
celular (Drive, e-mail). Vá em **Ajustes → Dados**:

- **Exportar backup (.json)** abre o menu de compartilhar do Android (Drive, WhatsApp,
  e-mail etc.) com um arquivo que contém equipamentos, treinos, histórico, dieta, a meta
  diária de calorias/macros, os registros de água e a configuração de meta/lembretes de água.
- **Importar backup (.json)** lê um arquivo exportado e **substitui** os dados atuais
  do app (pede confirmação antes de sobrescrever). Também reagenda os lembretes de água.

Esse é o jeito de levar seus dados pra outro celular ou reinstalar o app: exporte no
aparelho antigo, importe no novo.

## Desenvolvimento

Pré-requisitos: Node.js e Android Studio. Edite sempre os arquivos em `src/` (nunca
os de `www/`, que são gerados).

```powershell
npm install        # primeira vez, ou em outro computador/clone novo
npm run sync       # copia src/ para www/ e sincroniza com o projeto Android
npx cap open android   # abre o projeto no Android Studio
```

Depois de **qualquer** mudança no código, rode `npm run sync` e gere o APK de novo
(Android Studio: **Build → Generate App Bundles or APKs → Generate APKs**; o arquivo
fica em `android/app/build/outputs/apk/debug/app-debug.apk`). Se criar arquivos ou
pastas novos que o app use, inclua-os no `copiar-www.js`.

Plugins nativos em uso: `@capacitor/filesystem` e `@capacitor/share` (backup) e
`@capacitor/local-notifications` (lembretes de água).

Para salvar no Git: `git add -A`, `git commit -m "mensagem"` e `git push`. O
`-A` registra também arquivos apagados. Se o `git add` reclamar de `Filename too long`,
confira o `.gitignore` (deve ignorar `node_modules/`, `www/` e builds do Android) e rode
`git config --global core.longpaths true`.