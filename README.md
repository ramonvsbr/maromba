<div align="center">

# 💪 Maromba

### Treino, dieta e água num app só. 100% offline, 100% seu.

*Sem servidor. Sem internet. Sem conta. Seus dados ficam no seu celular.*

<br>

![Plataforma](https://img.shields.io/badge/plataforma-Android-3DDC84?style=for-the-badge&logo=android&logoColor=white)
![Capacitor](https://img.shields.io/badge/Capacitor-119EFF?style=for-the-badge&logo=capacitor&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![Offline](https://img.shields.io/badge/100%25-offline-success?style=for-the-badge)

<br>

[📥 Baixar](#-instalação) · [✨ Funcionalidades](#-funcionalidades) · [🚀 Como usar](#-como-usar) · [💾 Backup](#-backup-dos-dados) · [🛠️ Desenvolvimento](#️-desenvolvimento)

</div>

---

## 📖 Sobre

O **Maromba** é um app de treino de academia pensado para quem quer praticidade e privacidade. Ele funciona inteiramente no aparelho: não precisa de login, não envia nada para a nuvem e não depende de conexão.

Feito com **JavaScript, HTML e CSS puros**, empacotado como APK com **Capacitor**.

## ✨ Funcionalidades

| | Recurso | O que faz |
|---|---|---|
| 🏋️ | **Equipamentos** | Marque o que sua academia tem e todo o app se adapta |
| 📚 | **Exercícios** | Navegue por músculo e veja a silhueta com os músculos trabalhados |
| 🧱 | **Montar treino** | Combine grupos musculares, defina séries, reps, peso e pausa |
| ▶️ | **Treino ativo** | Cronômetro de descanso, alerta sonoro e vibração, tela sempre ligada |
| 📈 | **Histórico** | Sessões salvas e gráfico de evolução de carga por exercício |
| 🍽️ | **Dieta** | Refeições com calorias e macros, baseadas na Tabela TACO |
| 💧 | **Água** | Registro diário, meta e lembretes que funcionam com o app fechado |
| 💾 | **Backup** | Exporte e importe tudo em um único arquivo `.json` |

## 📥 Instalação

1. Baixe o APK na página de **[Releases](../../releases)** (ou gere o seu, veja [Desenvolvimento](#️-desenvolvimento)).
2. Passe o arquivo para o celular.
3. Permita a instalação de **fontes desconhecidas**.
4. Abra o arquivo e instale.

> [!TIP]
> Instalar uma versão nova **por cima** da anterior mantém seus dados.

> [!WARNING]
> **Desinstalar o app apaga tudo.** Exporte um backup antes (veja [Backup dos dados](#-backup-dos-dados)).

## 🚀 Como usar

<details>
<summary><b>1. 📚 Exercícios</b></summary>
<br>

Navegue por músculo. Só aparece o que dá para fazer com os equipamentos marcados (dá para desligar esse filtro). Toque num exercício para ver os músculos trabalhados na silhueta e o último peso registrado. A seção **Meus equipamentos** fica dentro da Biblioteca; abra-a para marcar o que a sua academia tem.
</details>

<details>
<summary><b>2. 🧱 Montar treino</b></summary>
<br>

O botão amarelo fica no topo da tela inicial.

- Dê um nome ao treino.
- Escolha um grupo muscular no seletor e toque em **Adicionar** (ex.: peito e depois costas).
- Cada grupo abre sua própria caixa com um seletor de exercícios daquele músculo (só os disponíveis com seu equipamento). Para remover um grupo, toque no ✕ da caixa.
- Defina, por exercício, **séries**, **repetições**, **peso** (kg) e **pausa** (segundos entre séries).
- Use as setas ↑/↓ para reordenar a sequência.

O topo mostra os músculos cobertos pelo treino inteiro e o tempo estimado.
</details>

<details>
<summary><b>3. 📋 Meus treinos</b></summary>
<br>

Inicie, edite ou apague os treinos salvos.
</details>

<details>
<summary><b>4. ▶️ Treino ativo</b></summary>
<br>

Durante a execução você vê:

- o(s) músculo(s) do exercício atual na silhueta;
- cronômetro de descanso entre séries;
- tempo decorrido;
- músculos já trabalhados na sessão.

A tela não apaga sozinha (Wake Lock) e, ao fim de cada descanso, o app **apita e vibra**, mesmo que você não esteja olhando para o celular. Ao terminar, você confirma o salvamento no histórico (com a data de hoje).
</details>

<details>
<summary><b>5. 📈 Histórico</b></summary>
<br>

Todas as sessões salvas, com data, duração e séries feitas. O gráfico no topo mostra a evolução de carga (maior peso por sessão) do exercício escolhido.
</details>

<details>
<summary><b>6. 🍽️ Dieta</b></summary>
<br>

Registre as refeições do dia com horário, nome e ingredientes (quantidade em gramas).

- Os dados nutricionais vêm da **Tabela TACO** (Tabela Brasileira de Composição de Alimentos, NEPA/UNICAMP). Busque pelo nome, escolha a quantidade e toque em **Adicionar**.
- Cada refeição mostra nome, horário e resumo de calorias e macros (proteínas, carboidratos e gorduras). Toque nela para ver o detalhe de cada ingrediente.
- O topo soma calorias e macros do dia. Use as setas ou o campo de data para navegar entre os dias.
- Alimento fora da tabela? Cadastre um **alimento personalizado** com os valores por 100 g (do rótulo, por exemplo).
- Use **Definir meta** (ou **Editar meta**) para informar quanto pretende consumir por dia. Deixe um campo em 0 para não acompanhar aquele valor. Cada item ganha uma barra de progresso, que fica vermelha se passar da meta.

> Os valores da TACO são uma referência média. Tempero, marca e ponto de cozimento podem alterar o resultado real.
</details>

<details>
<summary><b>7. 💧 Água</b></summary>
<br>

Toque numa medida rápida (**200, 250, 300, 500, 750 ou 1000 ml**) ou digite uma quantidade personalizada. O topo mostra o total do dia e, com meta definida, uma barra de progresso (vermelha se passar da meta). Cada registro pode ser excluído individualmente.

Em **Meta e lembretes** você configura:

| Opção | Descrição |
|---|---|
| Meta diária | Quantidade em ml |
| Acordar / dormir | Janela em que os lembretes podem disparar |
| Intervalo | De quanto em quanto tempo ser lembrado (mínimo 15 min) |
| Notificações | O Android pede permissão ao ativar |

Os lembretes são agendados no sistema: chegam **com o app fechado** e continuam depois de reiniciar o celular. O texto é fixo e mostra a meta do dia, não o total já bebido.

> [!TIP]
> Se as notificações não aparecerem no horário, libere-as nas configurações do Android e, se necessário, vá em **Configurações → Apps → Maromba → Bateria → Sem restrições**.
</details>

<details>
<summary><b>8. ⚙️ Ajustes → Dados</b></summary>
<br>

Exporte um `.json` com todo o seu backup ou importe um arquivo para restaurar ou migrar para outro aparelho.
</details>

## 💾 Backup dos dados

Como tudo fica no aparelho, exporte de vez em quando e guarde o arquivo fora do celular (Drive, e-mail). Vá em **Ajustes → Dados**:

| Ação | O que acontece |
|---|---|
| **Exportar backup (.json)** | Abre o menu de compartilhar do Android com um arquivo contendo equipamentos, treinos, histórico, dieta, meta de calorias/macros, registros de água e configuração de lembretes |
| **Importar backup (.json)** | Lê um arquivo exportado e **substitui** os dados atuais (pede confirmação). Também reagenda os lembretes de água |

Para trocar de celular: **exporte no antigo, importe no novo.**

## 🛠️ Desenvolvimento

**Pré-requisitos:** Node.js e Android Studio.

> [!IMPORTANT]
> Edite sempre os arquivos em `src/`. A pasta `www/` é gerada automaticamente.

```powershell
npm install            # primeira vez, ou em outro computador/clone novo
npm run sync           # copia src/ para www/ e sincroniza com o projeto Android
npx cap open android   # abre o projeto no Android Studio
```

Depois de **qualquer** mudança no código:

1. Rode `npm run sync`.
2. No Android Studio: **Build → Generate App Bundles or APKs → Generate APKs**.
3. O arquivo fica em `android/app/build/outputs/apk/debug/app-debug.apk`.

Se criar arquivos ou pastas novos que o app use, inclua-os no `copiar-www.js`.

### 📁 Estrutura do projeto

```
maromba/
├── src/                     # fontes do app (index.html, JS, CSS e fonts/)
├── android/                 # projeto Android gerado pelo Capacitor
├── www/                     # gerado por `npm run sync` (não editar nem versionar)
├── copiar-www.js            # script que copia src/ para www/
├── capacitor.config.json
└── package.json
```

### 🔌 Plugins nativos

| Plugin | Uso |
|---|---|
| `@capacitor/filesystem` | Backup (exportar/importar) |
| `@capacitor/share` | Backup (menu de compartilhar) |
| `@capacitor/local-notifications` | Lembretes de água |


```powershell
git config --global core.longpaths true
```

## 🙏 Créditos

- Dados nutricionais: **Tabela TACO**, NEPA/UNICAMP.
- Empacotamento: [Capacitor](https://capacitorjs.com/).

<div align="center">
<br>

</div>
