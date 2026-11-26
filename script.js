// Albor América · comportamento da página

// WhatsApp do treino: o P&D informa o número antes do encontro 1.
// Formato: só números, com 55 e DDD. Ex.: "5512900000000".
// Enquanto estiver vazio, o botão abre o WhatsApp com a mensagem pronta
// e a pessoa escolhe o contato.
const NUMERO_WHATSAPP = "";
const MENSAGEM_WHATSAPP = "Olá! Quero saber mais sobre o Albor América.";

const raiz = document.documentElement;
const menosMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

/* =========================================================
   Entrada: os textos são digitados no branco e, em seguida,
   as nuvens se abrem e a câmera pousa na torre.
   ========================================================= */
(function entrada() {
  if (!raiz.classList.contains("entrada")) return; // pediu menos movimento

  // troca a segurança do cabeçalho por uma mais folgada, agora que o script carregou
  clearTimeout(window.__entradaSeguranca);
  window.__entradaSeguranca = setTimeout(() => terminar(), 20000);

  const COR = "246, 244, 239"; // o off-white da página
  const NUVENS_MS = 3600;
  const textos = [
    { el: document.querySelector(".abertura__lugar"), ms: 32 },
    { el: document.querySelector("#abertura-titulo"), ms: 62 },
    { el: document.querySelector(".abertura__apoio"), ms: 20 },
  ];
  let pulou = false;
  let acabou = false;

  // guarda o texto e o espaço de cada linha, para a página não pular enquanto digita
  async function preparar() {
    await Promise.race([document.fonts ? document.fonts.ready : Promise.resolve(), esperar(1500)]);
    textos.forEach((t) => {
      t.texto = t.el.textContent;
      t.el.style.minHeight = t.el.offsetHeight + "px";
      t.el.setAttribute("aria-label", t.texto);
      t.el.textContent = "";
    });
    raiz.classList.add("pronta");
  }

  async function digitar() {
    await preparar();
    await esperar(400);
    for (const t of textos) {
      t.el.classList.add("digitando");
      for (let i = 1; i <= t.texto.length && !pulou; i++) {
        t.el.textContent = t.texto.slice(0, i);
        await esperar(t.ms);
      }
      t.el.textContent = t.texto;
      if (!pulou) await esperar(380);
      t.el.classList.remove("digitando");
    }
    if (!pulou) await esperar(450);
  }

  /* ---------- nuvens ---------- */
  const tela = document.getElementById("nuvens");
  const ctx = tela.getContext("2d");

  // desenha uma nuvem macia (vários círculos esfumados) num quadro à parte, uma vez só
  function moldeDeNuvem(semente) {
    const t = 256;
    const c = document.createElement("canvas");
    c.width = c.height = t;
    const g = c.getContext("2d");
    const blocos = 9 + Math.floor(semente * 5);
    for (let i = 0; i < blocos; i++) {
      const ang = (i / blocos) * Math.PI * 2 + semente * 3;
      const dist = 30 + Math.random() * 40;
      const x = t / 2 + Math.cos(ang) * dist;
      const y = t / 2 + Math.sin(ang) * dist * 0.6;
      const r = 50 + Math.random() * 40;
      const grad = g.createRadialGradient(x, y - r * 0.15, 0, x, y, r);
      grad.addColorStop(0, `rgba(255, 255, 255, .95)`);
      grad.addColorStop(0.55, `rgba(${COR}, .75)`);
      grad.addColorStop(1, `rgba(${COR}, 0)`);
      g.fillStyle = grad;
      g.beginPath();
      g.arc(x, y, r, 0, Math.PI * 2);
      g.fill();
    }
    // miolo cheio, para a nuvem não ficar oca
    const miolo = g.createRadialGradient(t / 2, t / 2, 0, t / 2, t / 2, t * 0.42);
    miolo.addColorStop(0, `rgba(255, 255, 255, 1)`);
    miolo.addColorStop(0.6, `rgba(${COR}, .6)`);
    miolo.addColorStop(1, `rgba(${COR}, 0)`);
    g.fillStyle = miolo;
    g.fillRect(0, 0, t, t);
    return c;
  }

  let nuvens = [];
  let moldes = [];
  function prepararNuvens() {
    const caixa = tela.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    tela.width = Math.round(caixa.width * dpr);
    tela.height = Math.round(caixa.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const W = caixa.width, H = caixa.height;
    moldes = [0.1, 0.45, 0.8].map(moldeDeNuvem);

    // um tapete de nuvens cobrindo a tela inteira, maiores perto das bordas
    const quantidade = Math.round(Math.min(90, Math.max(40, (W * H) / 22000)));
    const cx = W / 2, cy = H * 0.45;
    nuvens = Array.from({ length: quantidade }, (_, i) => {
      const x = Math.random() * W * 1.2 - W * 0.1;
      const y = Math.random() * H * 1.2 - H * 0.1;
      const dx = x - cx, dy = y - cy;
      const d = Math.hypot(dx, dy) || 1;
      return {
        x, y,
        dirX: dx / d, dirY: dy / d,
        tamanho: Math.max(W, H) * (0.28 + Math.random() * 0.32),
        velocidade: 0.7 + Math.random() * 0.7,
        atraso: Math.random() * 0.25,
        molde: moldes[i % moldes.length],
        giro: Math.random() * Math.PI * 2,
      };
    });
    desenhar(0);
    tela.style.background = "transparent";
  }

  // p vai de 0 (tudo coberto) a 1 (céu aberto)
  function desenhar(p) {
    const W = tela.clientWidth, H = tela.clientHeight;
    ctx.clearRect(0, 0, W, H);
    // fundo liso que some primeiro, deixando só as nuvens
    const fundo = Math.max(0, 1 - p * 3.2);
    if (fundo > 0) {
      ctx.fillStyle = `rgba(${COR}, ${fundo})`;
      ctx.fillRect(0, 0, W, H);
    }
    const alcance = Math.max(W, H) * 1.1;
    for (const n of nuvens) {
      const q = Math.min(1, Math.max(0, (p - n.atraso) / (1 - n.atraso)));
      const anda = q * q * alcance * n.velocidade; // acelera ao abrir, como atravessar a nuvem
      const escala = 1 + q * 1.2;
      const alfa = Math.max(0, 1 - q * 1.15);
      if (alfa <= 0) continue;
      const s = n.tamanho * escala;
      ctx.globalAlpha = alfa;
      ctx.save();
      ctx.translate(n.x + n.dirX * anda, n.y + n.dirY * anda - q * 40);
      ctx.rotate(n.giro);
      ctx.drawImage(n.molde, -s / 2, -s / 2, s, s);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  function abrirNuvens(duracao) {
    return new Promise((resolver) => {
      let inicio = null;
      const passo = (agora) => {
        if (inicio === null) inicio = agora;
        const t = Math.min((agora - inicio) / duracao, 1);
        const suave = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        desenhar(suave);
        if (t < 1 && !acabou) requestAnimationFrame(passo);
        else resolver();
      };
      requestAnimationFrame(passo);
    });
  }

  function terminar() {
    if (acabou) return;
    acabou = true;
    clearTimeout(window.__entradaSeguranca);
    raiz.classList.remove("entrada", "nuvens", "pronta");
    textos.forEach((t) => {
      if (t.texto) t.el.textContent = t.texto;
      t.el.style.minHeight = "";
      t.el.removeAttribute("aria-label");
      t.el.classList.remove("digitando");
    });
    ["wheel", "touchstart", "keydown", "pointerdown"].forEach((ev) => window.removeEventListener(ev, pular));
  }

  // quem tem pressa pode pular: rolar, tocar ou apertar uma tecla acelera tudo
  function pular() { pulou = true; }
  ["wheel", "touchstart", "keydown", "pointerdown"].forEach((ev) => window.addEventListener(ev, pular, { passive: true }));

  const foto = document.querySelector(".abertura__imagem");
  const fotoPronta = (foto.decode ? foto.decode() : Promise.resolve()).catch(() => {});

  (async () => {
    prepararNuvens();
    await digitar();
    await Promise.race([fotoPronta, esperar(2500)]);
    raiz.classList.add("nuvens");
    await abrirNuvens(pulou ? 1400 : NUVENS_MS);
    terminar();
  })();
})();

/* =========================================================
   Rolagem: foto da abertura em paralaxe, texto saindo,
   o arco que sobe e cresce, e o trilho de progresso.
   ========================================================= */
const topo = document.getElementById("topo");
const foto = document.getElementById("abertura-foto");
const conteudo = document.getElementById("abertura-conteudo");
const elevacao = document.getElementById("elevacao");
const diferenciais = document.getElementById("diferenciais");
const arco = document.getElementById("arco");
const arcoTexto = arco.querySelector("text");
const trilho = document.getElementById("trilho-progresso");

if (!menosMovimento && "CSS" in window && CSS.supports("clip-path", "circle(10px at 50% 50%)")) {
  raiz.classList.add("arco-ativo");
}

let pedido = false;
function aoRolar() {
  pedido = false;
  const y = window.scrollY;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  topo.classList.toggle("is-rolado", y > 40);

  const total = document.documentElement.scrollHeight - vh;
  trilho.style.setProperty("--progresso", total > 0 ? (y / total).toFixed(4) : 0);

  if (menosMovimento) return;

  // a foto anda mais devagar que a página; o texto sobe e se apaga
  if (y < vh * 1.2) {
    foto.style.transform = `translate3d(0, ${y * 0.35}px, 0)`;
    const saida = Math.min(y / (vh * 0.6), 1);
    conteudo.style.transform = `translate3d(0, ${-y * 0.18}px, 0)`;
    conteudo.style.opacity = (1 - saida).toFixed(3);
    elevacao.style.opacity = (1 - saida).toFixed(3);
  }

  // o arco: nasce escondido na base da foto, sobe e cresce até cobrir tudo
  if (raiz.classList.contains("arco-ativo")) {
    const sobe = parseFloat(getComputedStyle(diferenciais).marginTop) * -1 || vh * 0.45;
    const p = Math.min(Math.max(y / (vh * 0.85), 0), 1);
    const e = p * p * (3 - 2 * p);
    const r0 = Math.max(vw * 0.62, 300);
    const r1 = Math.hypot(vw, vh) * 3;
    const raio = r0 + (r1 - r0) * Math.pow(e, 2.2);
    const alto = (1 - e) * sobe;            // onde fica o topo do arco, dentro da parte
    diferenciais.style.setProperty("--raio", `${raio}px`);
    diferenciais.style.setProperty("--cy", `${alto + raio}px`);
    diferenciais.classList.toggle("is-aberta", p >= 1);

    // a frase curva acompanha o topo do arco e some à medida que ele cresce
    const largura = Math.max((r0 - 46) * 1000 / 420, 360);
    const s = largura / 1000;
    arco.style.width = `${largura}px`;
    arco.style.height = `${220 * s}px`;
    arco.style.top = `${alto + 64 - 50 * s}px`;
    arcoTexto.style.fontSize = `${(vw < 700 ? 15 : 21) / s}px`;
    arco.style.opacity = Math.max(0, 1 - e * 1.5).toFixed(3);
  }
}

function pedirQuadro() {
  if (!pedido) { pedido = true; requestAnimationFrame(aoRolar); }
}
aoRolar();
window.addEventListener("scroll", pedirQuadro, { passive: true });
window.addEventListener("resize", pedirQuadro);

/* ---------- imagens que se revelam ao entrar na tela ---------- */
if (!menosMovimento && "IntersectionObserver" in window) {
  raiz.classList.add("revela-ativo");
  const observador = new IntersectionObserver((entradas) => {
    entradas.forEach((ent) => {
      if (!ent.isIntersecting) return;
      const irmaos = [...ent.target.parentElement.children];
      const ordem = Math.max(0, irmaos.indexOf(ent.target)) % 4;
      ent.target.style.transitionDelay = `${ordem * 90}ms`;
      ent.target.querySelectorAll("img, .cartao__foto, button").forEach((el) => {
        el.style.transitionDelay = `${ordem * 90}ms`;
      });
      ent.target.classList.add("visivel");
      observador.unobserve(ent.target);
    });
  }, { rootMargin: "0px 0px -12% 0px", threshold: 0.08 });
  document.querySelectorAll(".revela").forEach((el) => observador.observe(el));
}

/* ---------- menu do celular ---------- */
const menu = document.getElementById("menu");
const abrirMenu = document.getElementById("menu-abrir");
abrirMenu.addEventListener("click", () => {
  const aberto = menu.classList.toggle("is-aberto");
  abrirMenu.setAttribute("aria-expanded", aberto);
});
menu.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => {
  menu.classList.remove("is-aberto");
  abrirMenu.setAttribute("aria-expanded", "false");
}));

/* ---------- WhatsApp com mensagem pronta ---------- */
document.getElementById("whatsapp").href =
  `https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent(MENSAGEM_WHATSAPP)}`;

/* ---------- galeria em tela cheia ---------- */
const imagens = [...document.querySelectorAll(".mosaico img")];
const tela = document.getElementById("tela-cheia");
const telaImg = document.getElementById("tela-cheia-imagem");
const telaLegenda = document.getElementById("tela-cheia-legenda");
let atual = 0;

function mostrar(indice) {
  atual = (indice + imagens.length) % imagens.length;
  const img = imagens[atual];
  telaImg.src = img.currentSrc || img.src;
  telaImg.alt = img.alt;
  telaLegenda.textContent = `${img.alt} (${atual + 1} de ${imagens.length})`;
  telaImg.style.animation = "none";
  void telaImg.offsetWidth; // reinicia a aproximação suave a cada imagem
  telaImg.style.animation = "";
}

imagens.forEach((img, i) => {
  img.closest("button").addEventListener("click", () => {
    mostrar(i);
    tela.showModal();
  });
});

document.getElementById("tela-cheia-fechar").addEventListener("click", () => tela.close());
document.getElementById("tela-cheia-anterior").addEventListener("click", () => mostrar(atual - 1));
document.getElementById("tela-cheia-proxima").addEventListener("click", () => mostrar(atual + 1));

// Esc fecha (o próprio dialog cuida disso); setas passam
tela.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") mostrar(atual - 1);
  if (e.key === "ArrowRight") mostrar(atual + 1);
});
tela.addEventListener("click", (e) => { if (e.target === tela) tela.close(); });
tela.addEventListener("close", () => imagens[atual].closest("button").focus({ preventScroll: true }));

// arrastar para o lado, no toque
let toqueX = null;
tela.addEventListener("touchstart", (e) => { toqueX = e.touches[0].clientX; }, { passive: true });
tela.addEventListener("touchend", (e) => {
  if (toqueX === null) return;
  const dx = e.changedTouches[0].clientX - toqueX;
  if (Math.abs(dx) > 50) mostrar(dx < 0 ? atual + 1 : atual - 1);
  toqueX = null;
});

/* ---------- formulário ---------- */
const form = document.getElementById("formulario");
const ok = document.getElementById("formulario-ok");
const telefone = document.getElementById("telefone");

// máscara: (12) 90000-0000
telefone.addEventListener("input", () => {
  const d = telefone.value.replace(/\D/g, "").slice(0, 11);
  let v = d;
  if (d.length > 2) v = `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length > 6) v = `(${d.slice(0, 2)}) ${d.slice(2, d.length - 4)}-${d.slice(-4)}`;
  telefone.value = v;
});

const regras = {
  nome: (el) => el.value.trim().length >= 2 || "Escreva o seu nome.",
  telefone: (el) => {
    const n = el.value.replace(/\D/g, "").length;
    return (n === 10 || n === 11) || "Escreva o telefone com DDD, por exemplo (12) 90000-0000.";
  },
  email: (el) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value.trim()) || "Escreva um e-mail válido, como nome@exemplo.com.",
  aceite: (el) => el.checked || "Marque o aceite para a equipe poder falar com você.",
};

function validar(id) {
  const el = document.getElementById(id);
  const resultado = regras[id](el);
  const erro = document.getElementById(`${id}-erro`);
  const valido = resultado === true;
  erro.textContent = valido ? "" : resultado;
  el.setAttribute("aria-invalid", valido ? "false" : "true");
  if (!valido) el.setAttribute("aria-describedby", erro.id);
  return valido;
}

Object.keys(regras).forEach((id) => {
  const el = document.getElementById(id);
  el.addEventListener(el.type === "checkbox" ? "change" : "blur", () => {
    if (el.getAttribute("aria-invalid") !== null) validar(id);
  });
});

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const ids = Object.keys(regras);
  const resultados = ids.map(validar);
  const primeiroErro = ids.find((id, i) => !resultados[i]);
  if (primeiroErro) {
    document.getElementById(primeiroErro).focus();
    return;
  }
  // no treino, não envia de verdade
  form.hidden = true;
  ok.hidden = false;
  ok.focus();
});
