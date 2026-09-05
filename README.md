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
- `bodymap.js` — silhueta (frente/costas) usada para destacar os músculos trabalhados
- `app.js` — toda a lógica: telas, sessão de treino, histórico e gráfico de evolução
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
7. **Ajustes → Dados** — exporte um arquivo `.json` com todo o seu backup (equipamentos,
   treinos e histórico) ou importe um arquivo pra restaurar/migrar seus dados pra
   outro navegador ou aparelho.

## Sobre "carga, repetições, peso e pausa"

Na tela de montar treino, cada exercício tem quatro campos: **séries** (quantidade de
séries), **repetições** (por série), **peso** (kg) e **pausa** (segundos de descanso
entre séries). Se você usava "carga" com outro sentido, é só me falar que eu ajusto.

## Backup dos dados

Como tudo fica no navegador, vale exportar de vez em quando. Vá em **Ajustes → Dados**:

- **Exportar backup (.json)** baixa um arquivo com equipamentos, treinos e histórico.
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
}))
```

Isso copia um JSON com tudo pra área de transferência — cole num arquivo `.json` e
guarde. A tela de **Importar** também aceita arquivos nesse formato manual.