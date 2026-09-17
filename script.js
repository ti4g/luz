/* ═══════════════════════════════════════════════════════════════
   Marina Alves — social media de casamento, Palmas-TO

   ┌─────────────────────────────────────────────────────────────┐
   │  TUDO QUE VOCÊ PRECISA TROCAR ESTÁ NESTE PRIMEIRO BLOCO.    │
   │  Veja CONTEUDO.md para a lista completa.                    │
   └─────────────────────────────────────────────────────────────┘
   ═══════════════════════════════════════════════════════════════ */

const MARCA = {
  nome: "Marina Alves",                        // PLACEHOLDER
  whatsapp: "5563999990000",                   // PLACEHOLDER — 55 + DDD + número, só dígitos
  instagram: "marinaalves.social",             // PLACEHOLDER — sem o @
  mensagem:
    "Oi! Vi o site e queria um orçamento de cobertura pro meu casamento. A data é ",
};

/* A história de um casamento, em ordem cronológica.
   `cor` é o tom para o qual o fundo inteiro é re-colorido. */
const SLIDES = [
  { img: "imgs/web/pic1-jpg.webp", w: 1206, h: 1608, titulo: "Antes\ndo sim",       etapa: "Preparação",   cor: "#9aa3a8" },
  { img: "imgs/web/pic2-jpg.webp", w: 1170, h: 1560, titulo: "O último\nretoque",   etapa: "Beauty",       cor: "#c8a97e" },
  { img: "imgs/web/pic8-jpg.webp", w: 1010, h: 676,  titulo: "O lugar\nacorda",     etapa: "A chácara",    cor: "#8a9a7b" },
  { img: "imgs/web/pic3-jpg.webp", w: 1170, h: 1463, titulo: "A noiva\npronta",     etapa: "Retrato",      cor: "#b9a48c" },
  { img: "imgs/web/pic4-jpg.webp", w: 1170, h: 1463, titulo: "Detalhes\nque contam",etapa: "Detalhes",     cor: "#8c8b86" },
  { img: "imgs/web/pic5-jpg.webp", w: 1170, h: 1463, titulo: "Ela\nentrou",         etapa: "A entrada",    cor: "#a8927a" },
  { img: "imgs/web/pic6-jpg.webp", w: 1170, h: 1463, titulo: "O sim",               etapa: "A cerimônia",  cor: "#7e8b93" },
  { img: "imgs/web/pic7-jpg.webp", w: 650,  h: 1367, titulo: "Assinado",            etapa: "A assinatura", cor: "#b89253" },
  { img: "imgs/web/pic7-png.webp", w: 497,  h: 726,  titulo: "A festa\ncomeça",     etapa: "A recepção",   cor: "#a9906a" },
];

const AUTOPLAY = 4200;    // ms entre as trocas da apresentação. 0 desliga.
const AUTO_PASSOS = 3;    // quantas fotos ela mostra sozinha antes de descansar
const SUAVIDADE = 0.12;   // 0–1. Menor = mais deslizante, maior = mais direto.

/* ═══════════════════════════════════════════════════════════════
   Daqui para baixo é mecanismo. Não precisa mexer.
   ═══════════════════════════════════════════════════════════════ */

const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
const semMovimento = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ─── razões do palco, herdadas da referência editorial ─── */
const CARD_H    = 0.264; // altura do card em foco ÷ altura do palco
const CARD_AR   = 0.75;  // card em foco é 3:4
const GAP_R     = 0.038; // gap ÷ largura do card
const STRIP_TOP = 0.5;   // aresta superior compartilhada
const PAD_R     = 0.017;
const LABEL_R   = 0.0103;

/* ─── elementos ─── */
const scrub   = document.getElementById("scrub");
const stage   = document.getElementById("stage");
const track   = document.getElementById("track");
const bgA     = document.getElementById("bgA");
const bgB     = document.getElementById("bgB");
const bgTint  = document.getElementById("bgTint");
const titleEl = document.getElementById("title");
const stepEl  = document.getElementById("step");
const headEl  = document.getElementById("label");
const railNow = document.getElementById("railNow");
const railAll = document.getElementById("railAll");
const railFill= document.getElementById("railFill");

const ultimo = () => SLIDES.length - 1;

let caixa = { w: 0, h: 0 };
let cardW = 0, fullH = 0, halfH = 0, gap = 0, passo = 0;

/* `f` é a posição contínua na fita: 3.5 = exatamente entre a 4ª e a 5ª foto.
   Tudo é desenhado a partir dele, e por isso não existe passo nem trava. */
let f = 0, fAlvo = 0, fAuto = 0;
let assumiu = false;      // a pessoa rolou? então a rolagem manda.
let fTake = 0;            // onde a apresentação parou quando ela assumiu
let visivel = true, laco = null;
let idxA = -1, idxB = -1, rotuloAtual = -1;
let timerAuto = null;

const frames = [];
const CORES = SLIDES.map((s) => [
  parseInt(s.cor.slice(1, 3), 16),
  parseInt(s.cor.slice(3, 5), 16),
  parseInt(s.cor.slice(5, 7), 16),
]);

/* ─── monta o filmstrip ─── */
function montar() {
  SLIDES.forEach((s, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "frame";
    b.setAttribute("aria-label", `${s.etapa} — ${s.titulo.replace("\n", " ")}`);

    const img = document.createElement("img");
    img.src = s.img;
    img.alt = "";
    img.width = s.w;
    img.height = s.h;
    img.draggable = false;
    img.decoding = "async";
    if (i !== 0) img.loading = "lazy";

    b.appendChild(img);
    b.addEventListener("click", () => {
      if (b.dataset.arrastou) { delete b.dataset.arrastou; return; }
      irPara(i);
    });

    track.appendChild(b);
    frames.push(b);
  });

  if (railAll) railAll.textContent = String(SLIDES.length).padStart(2, "0");
}

/* ─── geometria: uma medição alimenta todos os tamanhos ─── */
function medir() {
  caixa = { w: stage.clientWidth, h: stage.clientHeight };

  fullH = clamp(caixa.h * CARD_H, 96, 360);
  halfH = fullH / 2;
  cardW = fullH * CARD_AR;
  gap   = Math.max(4, Math.round(cardW * GAP_R));
  passo = cardW + gap;

  stage.style.setProperty("--card-w", `${cardW}px`);
  stage.style.setProperty("--gap", `${gap}px`);
  stage.style.setProperty("--strip-top", `${STRIP_TOP * 100}%`);
  stage.style.setProperty("--pad", `${Math.max(16, Math.round(caixa.w * PAD_R))}px`);
  stage.style.setProperty("--label", `${Math.max(9, Math.round(caixa.h * LABEL_R))}px`);

  desenhar(f);
}

/* ─── a rolagem, lida como posição (nunca interceptada) ───────────
   O palco fica preso com `position: sticky` enquanto a seção alta
   passa por trás. O quanto ela já passou é o progresso. Nenhum
   `preventDefault` em lugar nenhum: a barra de rolagem continua
   dizendo a verdade e o toque no celular é o nativo.
   ───────────────────────────────────────────────────────────────── */
function percorrivel() {
  return Math.max(1, scrub.offsetHeight - stage.offsetHeight);
}

function progresso() {
  return clamp(-scrub.getBoundingClientRect().top / percorrivel(), 0, 1);
}

/* A apresentação pode já ter andado sozinha quando a pessoa começa a rolar.
   Mapear a rolagem de forma absoluta faria a fita rebobinar nesse instante.
   Então o percurso inteiro passa a valer pelas fotos que ainda faltam: começa
   de onde a apresentação parou e termina na última. Sempre crescente, e a
   âncora é o topo — nunca o ponto onde o evento de rolagem chegou, que pode
   já estar no fim e deixaria o percurso valendo nada. */
function posicaoPara(p) {
  return fTake + p * (ultimo() - fTake);
}

function assumirControle() {
  if (assumiu) return;
  assumiu = true;
  fTake = clamp(f, 0, ultimo() - 1); // garante percurso restante
  pararAuto();
}

/* leva a rolagem até a foto `i` — usado pelo clique e pelo teclado */
function irPara(i) {
  assumirControle();
  fTake = 0; // escolha explícita: daqui em diante o mapa é absoluto
  const destino = clamp(i, 0, ultimo());
  window.scrollTo({
    top: scrub.offsetTop + (destino / ultimo()) * percorrivel(),
    behavior: semMovimento() ? "auto" : "smooth",
  });
}

/* ═══════════════════════════════════════════════════════════════
   DESENHO — tudo derivado de um único número contínuo
   ═══════════════════════════════════════════════════════════════ */
function desenhar(v) {
  /* a fita desliza; o card não se mexe sozinho */
  track.style.setProperty("--x", `${caixa.w / 2 - (v * passo + cardW / 2)}px`);

  /* cada card cresce conforme se aproxima do centro — sem degraus */
  const perto = Math.round(v);
  frames.forEach((el, i) => {
    const d = Math.min(1, Math.abs(i - v));
    el.style.height = `${halfH + (fullH - halfH) * (1 - d)}px`;
    el.style.setProperty("--veu", String(0.16 * d));
    if ((i === perto) !== (el.getAttribute("aria-current") === "true")) {
      el.setAttribute("aria-current", String(i === perto));
    }
  });

  /* fundo: duas fotos em travessia + um tom interpolado por cima */
  const a = Math.floor(v), b = Math.min(ultimo(), a + 1), t = v - a;
  if (a !== idxA) { bgA.src = SLIDES[a].img; idxA = a; }
  if (b !== idxB) { bgB.src = SLIDES[b].img; idxB = b; }
  bgB.style.opacity = String(t);
  bgA.style.opacity = String(1 - t);

  const A = CORES[a], B = CORES[b];
  bgTint.style.setProperty("--accent",
    `rgb(${Math.round(A[0] + (B[0] - A[0]) * t)} ${Math.round(A[1] + (B[1] - A[1]) * t)} ${Math.round(A[2] + (B[2] - A[2]) * t)})`);

  /* respiro lento do zoom ao longo de toda a fita */
  stage.style.setProperty("--zoom", String(1.30 - 0.08 * (v / ultimo())));

  /* rótulo: aparece quando assenta numa foto, some ao passar entre elas.
     O botão de orçamento fica de fora deste fade, de propósito. */
  const dist = Math.abs(v - perto);
  const op = 1 - Math.min(1, dist * 2.6);
  headEl.style.opacity = String(op);
  headEl.style.transform = `translateY(${dist * 12}px)`;
  if (perto !== rotuloAtual) {
    rotuloAtual = perto;
    const s = SLIDES[perto];
    stepEl.textContent = s.etapa;
    titleEl.replaceChildren();
    s.titulo.split("\n").forEach((linha) => {
      const ln = document.createElement("span");
      ln.className = "ln";
      const it = document.createElement("i");
      it.textContent = linha;
      ln.appendChild(it);
      titleEl.appendChild(ln);
    });
    if (railNow) railNow.textContent = String(perto + 1).padStart(2, "0");
  }

  /* trilho de posição, contínuo como o resto */
  if (railFill) {
    railFill.style.width = `${100 / SLIDES.length}%`;
    railFill.style.left  = `${(v / SLIDES.length) * 100}%`;
  }
}

/* ─── laço: persegue o alvo com folga, é isso que dá o deslize ─── */
function tique() {
  fAlvo = assumiu ? posicaoPara(progresso()) : fAuto;

  const delta = fAlvo - f;
  f += delta * (semMovimento() ? 1 : SUAVIDADE);
  if (Math.abs(delta) < 0.0005) f = fAlvo;

  desenhar(f);

  if (visivel) laco = requestAnimationFrame(tique);
  else laco = null;
}

function acordar() {
  if (!laco && visivel) laco = requestAnimationFrame(tique);
}

/* ═══════════════════════════════════════════════════════════════
   APRESENTAÇÃO — roda sozinha até a pessoa rolar
   ═══════════════════════════════════════════════════════════════ */
function pararAuto() { clearTimeout(timerAuto); timerAuto = null; }

function agendarAuto() {
  pararAuto();
  if (!AUTOPLAY || assumiu || semMovimento() || document.hidden) return;
  timerAuto = setTimeout(() => {
    // mostra só as primeiras fotos e descansa: assim sobra percurso de
    // rolagem de verdade para quem nunca tocou em nada
    if (fAuto >= AUTO_PASSOS) return;
    fAuto += 1;
    acordar();
    agendarAuto();
  }, AUTOPLAY);
}

/* ─── entradas ─── */
function ligarEntradas() {
  /* rolagem: só observa, nunca intercepta */
  window.addEventListener("scroll", () => {
    if (!assumiu && progresso() > 0.001) assumirControle();
    acordar();
  }, { passive: true });

  /* teclado */
  stage.addEventListener("keydown", (e) => {
    const mapa = {
      ArrowLeft: Math.round(f) - 1,
      ArrowRight: Math.round(f) + 1,
      Home: 0,
      End: ultimo(),
    };
    if (!(e.key in mapa)) return;
    e.preventDefault();
    irPara(mapa[e.key]);
  });

  /* arraste lateral: convertido em rolagem, para existir uma só verdade */
  let id = null, ultimoX = 0, moveu = false;
  track.addEventListener("pointerdown", (e) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    id = e.pointerId; ultimoX = e.clientX; moveu = false;
    assumirControle();
    track.classList.add("is-dragging");
    track.setPointerCapture(id);
  });
  track.addEventListener("pointermove", (e) => {
    if (id === null || e.pointerId !== id) return;
    const dx = e.clientX - ultimoX;
    if (Math.abs(dx) > 2) moveu = true;
    ultimoX = e.clientX;
    // um card arrastado equivale ao trecho de rolagem que vale uma foto
    const porFoto = percorrivel() / Math.max(0.001, ultimo() - fTake);
    window.scrollBy(0, (-dx / passo) * porFoto);
  });
  const soltar = (e) => {
    if (id === null || e.pointerId !== id) return;
    if (track.hasPointerCapture(id)) track.releasePointerCapture(id);
    id = null;
    track.classList.remove("is-dragging");
    if (moveu) {
      frames.forEach((el) => { el.dataset.arrastou = "1"; });
      setTimeout(() => frames.forEach((el) => delete el.dataset.arrastou), 0);
    }
  };
  track.addEventListener("pointerup", soltar);
  track.addEventListener("pointercancel", soltar);

  /* o laço só roda com o hero em cena */
  new IntersectionObserver(([e]) => {
    visivel = e.isIntersecting;
    if (visivel) acordar();
  }, { threshold: 0 }).observe(scrub);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) pararAuto(); else agendarAuto();
  });

  new ResizeObserver(medir).observe(stage);
}

/* ═══════════════════════════════════════════════════════════════
   Revelação no scroll — fallback.
   O CSS resolve nativamente onde há scroll-driven animations.
   Isto só entra onde não há suporte (hoje: Firefox).
   ═══════════════════════════════════════════════════════════════ */
function ligarReveal() {
  const nativo = CSS.supports("(animation-timeline: view()) and (animation-range: entry)");
  if (nativo || semMovimento()) return;

  document.documentElement.classList.add("js-reveal");
  const obs = new IntersectionObserver((entradas) => {
    for (const entrada of entradas) {
      if (!entrada.isIntersecting) continue;
      entrada.target.classList.add("is-in");
      obs.unobserve(entrada.target);
    }
  }, { rootMargin: "0px 0px -12% 0px", threshold: 0.1 });

  document.querySelectorAll(".reveal").forEach((el) => obs.observe(el));
}

/* ─── contagem dos números ─── */
function ligarContagem() {
  const alvos = document.querySelectorAll("[data-count]");
  if (!alvos.length) return;

  if (semMovimento()) {
    alvos.forEach((el) => { el.textContent = el.dataset.count; });
    return;
  }

  const obs = new IntersectionObserver((entradas) => {
    for (const entrada of entradas) {
      if (!entrada.isIntersecting) continue;
      const el = entrada.target;
      const fim = Number(el.dataset.count);
      const t0 = performance.now();
      const tick = (t) => {
        const p = Math.min(1, (t - t0) / 1100);
        el.textContent = String(Math.round(fim * (1 - Math.pow(1 - p, 3))));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      obs.unobserve(el);
    }
  }, { threshold: 0.6 });

  alvos.forEach((el) => { el.textContent = "0"; obs.observe(el); });
}

/* ─── links, menu e botão flutuante ─── */
function ligarInterface() {
  const wa = `https://wa.me/${MARCA.whatsapp}?text=${encodeURIComponent(MARCA.mensagem)}`;
  const ig = `https://www.instagram.com/${MARCA.instagram}/`;

  document.querySelectorAll("#waBtn, #waFloat, #waHero").forEach((a) => {
    a.href = wa;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
  });
  const igBtn = document.getElementById("igBtn");
  if (igBtn) igBtn.href = ig;

  const ano = document.getElementById("year");
  if (ano) ano.textContent = String(new Date().getFullYear());

  const burger = document.getElementById("burger");
  const menu = document.getElementById("menu");
  if (burger && menu) {
    const alternar = (abrir) => {
      burger.setAttribute("aria-expanded", String(abrir));
      menu.hidden = !abrir;
    };
    burger.addEventListener("click", () =>
      alternar(burger.getAttribute("aria-expanded") !== "true")
    );
    menu.addEventListener("click", (e) => {
      if (e.target.tagName === "A") alternar(false);
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") alternar(false);
    });
  }

  const flutuante = document.getElementById("waFloat");
  const conteudo = document.getElementById("conteudo");
  if (flutuante && conteudo) {
    new IntersectionObserver(
      ([e]) => flutuante.classList.toggle("is-on", e.isIntersecting),
      { threshold: 0.02 }
    ).observe(conteudo);
  }
}

/* ─── partida ─── */
function iniciar() {
  if (scrub && stage && track) {
    montar();
    medir();
    // se a página abriu já rolada (recarga no meio), a rolagem manda desde já
    if (progresso() > 0.001) { assumiu = true; fTake = 0; }
    f = fAlvo = assumiu ? posicaoPara(progresso()) : 0;
    desenhar(f);
    ligarEntradas();
    agendarAuto();
    acordar();
  }
  ligarReveal();
  ligarContagem();
  ligarInterface();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", iniciar);
} else {
  iniciar();
}
