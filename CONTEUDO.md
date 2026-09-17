# O que trocar antes de publicar

Todo o conteúdo fictício está marcado abaixo. Nada aqui exige mexer em CSS.

---

## 1. Identidade — `script.js`, primeiro bloco (linhas 10–17)

É o único lugar onde nome, WhatsApp e Instagram são configurados. Os links do
site inteiro (botão do topo, botão flutuante, CTA final) são montados a partir
daqui.

```js
const MARCA = {
  nome: "Marina Alves",                  // ← nome real
  whatsapp: "5563999990000",             // ← 55 + DDD + número, só dígitos
  instagram: "marinaalves.social",       // ← sem o @
  mensagem: "Oi! Vi o site e queria...", // ← texto que já vem digitado no WhatsApp
};
```

## 2. Nome escrito no HTML — `index.html`

O nome aparece como texto em 5 pontos (o JS não reescreve texto, só links):

| Linha | Onde |
|---|---|
| 6 | `<title>` |
| 8, 14 | `<meta author>` e `og:title` |
| 55 | Marca na barra do topo |
| ~390 | Nome no rodapé |
| ~420 | Bloco JSON-LD (`name`, `telephone`, `sameAs`) |

Busca e substitui `Marina Alves` resolve tudo de uma vez.

## 3. Domínio

`index.html` linhas 10, 16 e no JSON-LD: trocar `https://www.marinaalves.com.br/`
pelo domínio real. Enquanto não houver domínio, pode deixar — não quebra nada.

## 4. Textos fictícios que precisam virar reais

- **Números da seção "A proposta"** (linhas ~126–135): `8 min`, `40+`, `72h`.
  São promessas comerciais — só publique os números que ela realmente cumpre.
- **Depoimentos** (seção `#depoimentos`): os 3 são inventados, com nomes e locais
  fictícios de Palmas. **Substitua por depoimentos reais antes de publicar** —
  depoimento falso é o tipo de coisa que destrói autoridade se alguém notar.
- **Preços**: não há preço nenhum no site, por decisão. O FAQ manda pro WhatsApp.
- **"salão de beleza em Palmas"** (seção Sobre): se puder citar o nome do salão,
  ganha credibilidade.

## 5. Legendas das fotos — `script.js`, `SLIDES`

Cada foto tem `titulo` (o texto grande, quebra linha com `\n`) e `etapa` (o rótulo
pequeno em dourado). São legendas do momento, não dados — troque à vontade.

---

# Imagens

## O que foi feito

Os originais em `imgs/` **não foram alterados**. O site consome `imgs/web/`,
gerado por `otimizar-imagens.py`:

- **`pic7.jpg` e `pic8.jpg` tinham uma moldura branca embutida no arquivo.**
  Ela aparecia como um quadro esbranquiçado no fundo full-bleed do hero. O script
  detecta e corta: `1170×1463 → 650×1367` e `1170×1463 → 1010×676`.
- `pic7.png` tinha 617 KB. Em WebP ficou 54 KB.
- Total: **2019 KB → 1130 KB (44% menor)**.

## Ao trocar as fotos

1. Coloque os arquivos novos em `imgs/`.
2. Rode:

```bash
python otimizar-imagens.py
```

3. Atualize o array `SLIDES` em `script.js` com os nomes e as dimensões que o
   script imprime (`w` e `h` precisam bater, senão o layout treme ao carregar).

## Ordem das fotos

O hero conta **um casamento em ordem cronológica**, da preparação à recepção.
Se trocar as fotos, mantenha a ordem cronológica — é o que faz a peça funcionar.
O site abre sempre na primeira foto, porque a rolagem no topo equivale à
primeira foto. Os ajustes ficam no topo do `script.js`:

| Constante | O que faz |
|---|---|
| `AUTOPLAY` | ms entre as trocas da apresentação. `0` desliga. |
| `AUTO_PASSOS` | quantas fotos ela mostra sozinha antes de descansar. |
| `SUAVIDADE` | 0–1. Menor = mais deslizante; maior = mais direto ao ponto. |

A distância de rolagem do hero é o `150svh` em `.hero__scrub` (styles.css).
Aumentar deixa a varredura mais lenta e detalhada; diminuir deixa mais rápida.
Hoje são **1,5 tela** para percorrer as 9 fotos.

## Como o carrossel se comporta

- **De cara é uma apresentação de slides**: anda sozinha por algumas fotos e
  descansa, esperando a pessoa.
- **Conforme a pessoa rola, a rolagem passa a comandar as fotos** — de forma
  contínua, sem parar em cada uma. A fita desliza junto com o gesto.
- **A rolagem nunca é interceptada.** Não existe `preventDefault` em lugar
  nenhum: o palco fica preso com `position: sticky` e o código apenas *lê* o
  quanto a seção já passou. Por isso a barra de rolagem continua dizendo a
  verdade, o toque no celular é o nativo do sistema e ninguém fica preso.
- Passado o percurso das fotos, a página segue para o conteúdo normalmente.
- Também dá para **clicar numa foto, arrastar de lado e usar o teclado**
  (← → Home End) — tudo é convertido em posição de rolagem, então existe uma
  só verdade.
- Quem tem "reduzir movimento" ligado no sistema não recebe apresentação
  automática nem deslize: as fotos trocam direto.

### Duas decisões que não são óbvias no código

**A âncora da entrega.** Se a apresentação já andou sozinha até a 4ª foto e a
pessoa então rola, mapear a rolagem de forma absoluta faria a fita rebobinar
para a 1ª. Em vez disso, o percurso inteiro passa a valer pelas fotos que ainda
faltam. A âncora é o topo da seção — nunca o ponto onde o evento de rolagem
chegou, que pode já estar no fim e deixaria o percurso restante valendo nada.
É também por isso que `AUTO_PASSOS` existe: ele garante que sempre sobre
percurso de verdade para quem nunca tocou em nada.

**O botão não desvanece.** Ao varrer entre duas fotos, o rótulo some (é o que
deixa a transição limpa), mas o "Pedir orçamento" fica. Elemento de conversão
não pode piscar para fora da tela.

---

# Detalhes técnicos

- **Sem build, sem dependência.** HTML + CSS + JS puro. Publica em qualquer
  hospedagem estática (Netlify, Vercel, GitHub Pages, hospedagem comum via FTP).
- **Para rodar local:** `python -m http.server 4173` e abrir
  `http://localhost:4173`. Abrir o `index.html` direto pelo Windows Explorer
  **não funciona** — as fotos e o CSS não carregam por causa do protocolo
  `file://`.
- **Fontes**: Cormorant Garamond, Jost e IBM Plex Mono via Google Fonts. Sem
  internet, o site cai para as fontes do sistema e continua legível.
- **Animações de scroll**: usam `animation-timeline: view()` nativo onde existe
  (Chrome, Edge, Safari 26+). No Firefox o JS detecta a ausência e ativa um
  `IntersectionObserver` equivalente. Quem tiver "reduzir movimento" ligado no
  sistema vê tudo parado.
- **Acessibilidade**: carrossel navegável por teclado (← → Home End), link de
  pular para o conteúdo, foco visível, textos alternativos.
- **SEO local**: JSON-LD `ProfessionalService` com `areaServed` cobrindo Palmas,
  Porto Nacional, Paraíso, Gurupi e Araguaína — é o que sustenta o objetivo de
  autoridade regional.

---

# Referência de design

O hero é uma reescrita em JS puro do **Hero Carousel** (autor `crafterui`,
21st.dev): filmstrip onde todos os cards dividem a mesma aresta superior, o card
em foco se abre em altura total e o fundo inteiro é re-colorido com o tom da foto
em foco. O original é React + Framer Motion; aqui virou CSS + JS sem dependência,
com a geometria medida por `ResizeObserver` (as proporções são razões do palco,
então funciona igual em 375px e em 4K).

Duas adaptações. A primeira: no original o filmstrip é uma vitrine de imagens
soltas; aqui ele é **a linha do tempo de um casamento**, do making of à recepção.

A segunda é de comportamento. O original avança de foto em foto interceptando a
roda do mouse, com um limiar de 60px e um bloqueio de 420ms entre uma e outra —
o que dá a sensação de travar em cada foto. Aqui a posição na fita é um número
contínuo, derivado de quanto a seção já rolou, e um laço de animação persegue
esse número com folga. Não existe passo, não existe bloqueio e não existe
`preventDefault`: a fita desliza junto com o dedo e a página continua sendo da
pessoa.
