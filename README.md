# Maromba

Webapp de treino de academia, 100% local, sem servidor, sem internet, sem conta.
Os dados ficam salvos no `localStorage` do navegador que você usar para abrir o app.
Funciona offline como PWA (dá pra "instalar" no celular).

## Como rodar

**Opção mais simples:** dê duplo-clique em `index.html` e abra no navegador.

**Opção recomendada (evita bloqueios de segurança do navegador e habilita o modo
offline/PWA):** sirva a pasta com um servidor local simples. Com Python instalado,
dentro da pasta `maromba`:

```
python3 -m http.server 8000
```

Depois acesse `http://localhost:8000` no navegador. Com Node.js instalado, também
funciona `npx serve .` na mesma pasta.

> Importante: os dados ficam presos ao navegador + à origem (`file://` ou
> `http://localhost:8000`) que você usar. Se abrir o app de formas diferentes,
> vai ver dados diferentes. Escolha uma forma e sempre abra a mesma.

> O modo offline (service worker) só funciona servindo por `http://` ou
> `https://` — navegadores bloqueiam service workers em páginas abertas
> diretamente via `file://`. Se só der duplo-clique no `index.html`, o app
> funciona normalmente, mas sem o cache offline.

## Arquivos

- `index.html` — estrutura da página e navegação
- `style.css` — visual
- `data.js` — lista de equipamentos, músculos e a biblioteca de exercícios
- `taco.js` — base de alimentos com dados nutricionais (baseada na Tabela TACO), usada na aba Dieta
- `bodymap.js` — silhueta (frente/costas) usada para destacar os músculos trabalhados
- `app.js` — toda a lógica: telas, sessão de treino, histórico, dieta, água (com lembretes) e gráfico de evolução
- `manifest.json` — metadados do PWA (nome, ícone, cor do tema)
- `sw.js` — service worker que cacheia os arquivos estáticos pra funcionar offline
- `icons/` — ícones do app usados no manifest e ao instalar no celular

## Como usar

1. **Equipamentos** — marque o que sua academia tem. Isso filtra tudo o resto.
2. **Exercícios** — navegue por músculo; só aparece o que dá pra fazer com o que você
   marcou (dá pra desligar esse filtro). Clique num exercício pra ver os músculos
   trabalhados na silhueta e o último peso registrado.
3. **Montar treino** — dê um nome, escolha um grupo muscular no seletor e clique em
   "Adicionar" (ex.: peito e depois costas). Cada grupo adicionado abre sua própria
   caixa com um seletor de exercícios daquele músculo (só os disponíveis com seu
   equipamento aparecem) e um botão "Adicionar" — do mesmo jeito que os exercícios.
   Dá pra remover um grupo muscular clicando no ✕ da caixa. Depois defina, por
   exercício: séries, repetições, peso e pausa. Use as setas ↑/↓ ao lado de cada
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
   Composição de Alimentos, NEPA/UNICAMP) — busque o alimento pelo nome, escolha a
   quantidade e clique em "Adicionar". Cada refeição salva mostra, na lista do dia,
   o nome, o horário e um resumo de calorias e macros (proteínas, carboidratos e
   gorduras); clique nela pra abrir o detalhe com cada ingrediente e sua quantidade.
   O topo da tela soma as calorias e macros de todas as refeições do dia selecionado
   (use as setas ou o campo de data pra navegar entre os dias). Se um alimento não
   estiver na tabela, cadastre um **alimento personalizado** informando os valores
   nutricionais por 100g (do rótulo da embalagem, por exemplo). Os valores da TACO
   são uma referência média — o preparo real (tempero, marca, ponto de cozimento)
   pode variar um pouco o resultado.
   Use **"Definir meta"** (ou "Editar meta") pra informar quanto pretende consumir
   de calorias e de cada macro por dia; deixe um campo em 0 pra não acompanhar
   aquele valor específico. Com a meta definida, a tela mostra o quanto já foi
   consumido no dia frente à meta, com uma barra de progresso por calorias/macro
   (a barra fica vermelha se você já passou da meta naquele item).
8. **Água** — registre sua ingestão de água ao longo do dia. Toque num dos botões de
   medida rápida (200, 250, 300, 500, 750 ou 1000 ml) ou digite uma quantidade
   personalizada e clique em "Adicionar". O topo da tela mostra o total bebido no
   dia e, se você definir uma meta, uma barra de progresso (fica vermelha se você
   já passou da meta). Use as setas ou o campo de data pra ver/editar dias
   anteriores; cada registro pode ser excluído individualmente.
   Em **"Meta e lembretes"** você define:
   - a **meta diária** em ml;
   - os horários de **acordar** e **dormir** (os lembretes nunca disparam fora
     dessa janela);
   - de quanto em quanto tempo (em minutos) quer ser lembrado;
   - e pode **ativar as notificações** (o navegador vai pedir permissão).

   > Importante: como o Maromba não tem servidor, os lembretes só funcionam
   > enquanto o app estiver **aberto** (uma aba do navegador, ou o app instalado
   > rodando em segundo plano). Não é possível mandar notificação com o app
   > totalmente fechado — pra isso seria necessário um servidor de push, o que
   > vai contra a proposta 100% local do app.
9. **Ajustes → Dados** — exporte um arquivo `.json` com todo o seu backup (equipamentos,
   treinos, histórico, dieta, água e alimentos personalizados) ou importe um arquivo
   pra restaurar/migrar seus dados pra outro navegador ou aparelho.

## Sobre "carga, repetições, peso e pausa"

Na tela de montar treino, cada exercício tem quatro campos: **séries** (quantidade de
séries), **repetições** (por série), **peso** (kg) e **pausa** (segundos de descanso
entre séries). Se você usava "carga" com outro sentido, é só me falar que eu ajusto.

## Backup dos dados

Como tudo fica no navegador, vale exportar de vez em quando. Vá em **Ajustes → Dados**:

- **Exportar backup (.json)** baixa um arquivo com equipamentos, treinos, histórico,
  dieta, a meta diária de calorias/macros, os registros de água e a
  configuração de meta/lembretes de água.
- **Importar backup (.json)** lê um arquivo exportado e **substitui** os dados atuais
  deste navegador (peça confirmação antes de sobrescrever).

Isso também é o jeito de levar seus dados pra outro navegador ou celular: exporte no
aparelho antigo, importe no novo.

### Plano B (manual, via console)

Se preferir sem a interface, F12 → Console e rode:

```js
copy(JSON.stringify({
  equipamentos: localStorage.getItem('maromba_equipamentos'),
  treinos: localStorage.getItem('maromba_treinos'),
  historico: localStorage.getItem('maromba_historico'),
  dieta: localStorage.getItem('maromba_dieta'),
  alimentosPersonalizados: localStorage.getItem('maromba_alimentos_personalizados'),
  metaDieta: localStorage.getItem('maromba_meta_dieta'),
  agua: localStorage.getItem('maromba_agua'),
  aguaConfig: localStorage.getItem('maromba_agua_config'),
}))
```

Isso copia um JSON com tudo pra área de transferência — cole num arquivo `.json` e
guarde. A tela de **Importar** também aceita arquivos nesse formato manual.