// ═══════════════════════════════════════════════════════════════
//  script.js — Bolo de Cenoura com Cobertura de Chocolate
//  Funcionalidades:
//    1. Contador de visualizações (localStorage)
//    2. Passos do preparo como checklist (clique para riscar)
//    3. Ingredientes como lista de compras (localStorage)
//    4. Avaliação por estrelas (localStorage)
//    5. Ajuste de porções com recálculo de quantidades
//    6. Tema claro / escuro (localStorage)
//    7. Cronômetro de cozinha com presets
//    8. Conversor de medidas
//    9. Comentários da sessão
//   10. Alerta "Bom apetite!"
// ═══════════════════════════════════════════════════════════════

document.addEventListener("DOMContentLoaded", function () {

  // ────────────────────────────────────────────────────────────
  // 1. CONTADOR DE VISUALIZAÇÕES
  // ────────────────────────────────────────────────────────────
  const spanVisitas = document.getElementById("visitas");

  if (spanVisitas) {
    let visitas = parseInt(localStorage.getItem("bolo_visitas") || "0") + 1;
    localStorage.setItem("bolo_visitas", visitas);
    spanVisitas.textContent = visitas;
  }

  // ────────────────────────────────────────────────────────────
  // 2. PASSOS DO PREPARO — CHECKLIST CLICÁVEL
  // ────────────────────────────────────────────────────────────
  const todasOls = document.querySelectorAll("ol");

  todasOls.forEach(function (ol) {
    const passos = ol.querySelectorAll("li");
    passos.forEach(function (li, idx) {
      li.title = "Clique para marcar como feito";

      li.addEventListener("click", function () {
        if (!li.classList.contains("feito")) {
          li.classList.add("feito");
          li.title = "Passo concluído ✔";
        }
      });
    });
  });

  // ────────────────────────────────────────────────────────────
  // 3. INGREDIENTES — MARCAR COMO COMPRADO (localStorage)
  // ────────────────────────────────────────────────────────────
  const todasUls = document.querySelectorAll("ul#lista-bolo, ul#lista-cobertura");

  todasUls.forEach(function (ul) {
    const itens = ul.querySelectorAll("li[data-id]");

    itens.forEach(function (li) {
      const id = li.dataset.id;

      // Restaurar estado salvo
      if (localStorage.getItem("bolo_ingr_" + id) === "1") {
        li.classList.add("comprado");
      }

      li.title = "Clique para marcar como comprado";

      li.addEventListener("click", function () {
        li.classList.toggle("comprado");
        const comprado = li.classList.contains("comprado") ? "1" : "0";
        localStorage.setItem("bolo_ingr_" + id, comprado);
      });
    });
  });

  // ────────────────────────────────────────────────────────────
  // 4. AVALIAÇÃO POR ESTRELAS
  // ────────────────────────────────────────────────────────────
  const estrelas    = document.querySelectorAll(".estrela");
  const mediaTexto  = document.getElementById("media-texto");

  // Carregar avaliações salvas
  let avaliacoes = JSON.parse(localStorage.getItem("bolo_avaliacoes") || "[]");

  function atualizarEstrelas(notaAtiva) {
    estrelas.forEach(function (e) {
      if (parseInt(e.dataset.val) <= notaAtiva) {
        e.classList.add("ativa");
      } else {
        e.classList.remove("ativa");
      }
    });
  }

  function atualizarMedia() {
    if (avaliacoes.length === 0) {
      mediaTexto.textContent = "Sem avaliações ainda. Clique para avaliar!";
      return;
    }
    const soma  = avaliacoes.reduce(function (a, b) { return a + b; }, 0);
    const media = (soma / avaliacoes.length).toFixed(1);
    mediaTexto.textContent =
      "Média: " + media + " ★ (" + avaliacoes.length + " avaliação" + (avaliacoes.length > 1 ? "ões" : "") + ")";
  }

  // Mostrar nota já salva do usuário
  const notaSalva = parseInt(localStorage.getItem("bolo_minha_nota") || "0");
  if (notaSalva > 0) atualizarEstrelas(notaSalva);
  atualizarMedia();

  estrelas.forEach(function (estrela) {
    // Hover
    estrela.addEventListener("mouseenter", function () {
      const val = parseInt(estrela.dataset.val);
      estrelas.forEach(function (e) {
        e.classList.toggle("hover", parseInt(e.dataset.val) <= val);
      });
    });

    estrela.addEventListener("mouseleave", function () {
      estrelas.forEach(function (e) { e.classList.remove("hover"); });
    });

    // Clique — registrar nota
    estrela.addEventListener("click", function () {
      const nota = parseInt(estrela.dataset.val);

      // Só permite nova nota se ainda não avaliou nesta sessão
      if (!localStorage.getItem("bolo_avaliou_hoje")) {
        avaliacoes.push(nota);
        localStorage.setItem("bolo_avaliacoes", JSON.stringify(avaliacoes));
        localStorage.setItem("bolo_minha_nota", nota);
        localStorage.setItem("bolo_avaliou_hoje", "1");
        atualizarEstrelas(nota);
        atualizarMedia();
      } else {
        // Permite alterar nota na mesma sessão
        const idxAnt = avaliacoes.length - 1;
        if (idxAnt >= 0) avaliacoes[idxAnt] = nota;
        localStorage.setItem("bolo_avaliacoes", JSON.stringify(avaliacoes));
        localStorage.setItem("bolo_minha_nota", nota);
        atualizarEstrelas(nota);
        atualizarMedia();
      }
    });
  });

  // ────────────────────────────────────────────────────────────
  // 5. AJUSTE DE PORÇÕES / RECÁLCULO DE QUANTIDADES
  // ────────────────────────────────────────────────────────────
  const BASE_FATIAS = 4; // receita base é para 4 fatias
  let fatorAtual = 1;

  // Dados originais dos ingredientes (quantidades base)
  const dadosIngredientes = {
    "b1": { qtd: 3,   unit: "cenouras médias (±300 g), descascadas e picadas" },
    "b2": { qtd: 3,   unit: "ovos inteiros" },
    "b3": { qtd: 1,   unit: "xícara de óleo de milho" },
    "b4": { qtd: 2,   unit: "xícaras de açúcar refinado" },
    "b5": { qtd: 2,   unit: "xícaras de farinha de trigo" },
    "b6": { qtd: 1,   unit: "colher de sopa de fermento em pó" },
    "b7": { qtd: 1,   unit: "pitada de sal" },
    "c1": { qtd: 5,   unit: "colheres de sopa de achocolatado em pó" },
    "c2": { qtd: 5,   unit: "colheres de sopa de açúcar" },
    "c3": { qtd: 3,   unit: "colheres de sopa de manteiga" },
    "c4": { qtd: 0.5, unit: "xícara de leite integral" }
  };

  function formatarQtd(n) {
    if (n === 0.5) return "½";
    if (n === 1.5) return "1 ½";
    if (n === 2.5) return "2 ½";
    if (Number.isInteger(n)) return String(n);
    return parseFloat(n.toFixed(2)).toString();
  }

  function aplicarFator(fator) {
    fatorAtual = fator;
    document.querySelectorAll("li[data-id]").forEach(function (li) {
      const id   = li.dataset.id;
      const dado = dadosIngredientes[id];
      if (!dado) return;

      const novaQtd = dado.qtd * fator;
      li.childNodes[0].textContent = formatarQtd(novaQtd) + " " + dado.unit;
    });
  }

  // Botões de porção
  document.querySelectorAll(".btn-porcao").forEach(function (btn) {
    btn.addEventListener("click", function () {
      document.querySelectorAll(".btn-porcao").forEach(function (b) { b.classList.remove("ativo"); });
      btn.classList.add("ativo");

      const fator = parseFloat(btn.dataset.fator);
      const inputPessoas = document.getElementById("input-pessoas");
      if (inputPessoas) inputPessoas.value = Math.round(BASE_FATIAS * fator);
      aplicarFator(fator);
    });
  });

  // Campo numérico de fatias
  const inputPessoas = document.getElementById("input-pessoas");
  if (inputPessoas) {
    inputPessoas.addEventListener("input", function () {
      const fatias = parseInt(inputPessoas.value) || 1;
      const fator  = fatias / BASE_FATIAS;
      document.querySelectorAll(".btn-porcao").forEach(function (b) { b.classList.remove("ativo"); });
      aplicarFator(fator);
    });
  }

  // ────────────────────────────────────────────────────────────
  // 6. TEMA CLARO / ESCURO
  // ────────────────────────────────────────────────────────────
  const btnTema = document.getElementById("btn-tema");
  const body    = document.body;

  // Restaurar preferência
  if (localStorage.getItem("bolo_tema") === "escuro") {
    body.classList.replace("tema-claro", "tema-escuro");
    if (btnTema) btnTema.textContent = "☀️ Tema Claro";
  }

  if (btnTema) {
    btnTema.addEventListener("click", function () {
      const escuro = body.classList.toggle("tema-escuro");
      body.classList.toggle("tema-claro", !escuro);
      btnTema.textContent = escuro ? "☀️ Tema Claro" : "🌙 Tema Escuro";
      localStorage.setItem("bolo_tema", escuro ? "escuro" : "claro");
    });
  }

  // ────────────────────────────────────────────────────────────
  // 7. CRONÔMETRO DE COZINHA
  // ────────────────────────────────────────────────────────────
  const display   = document.getElementById("cronometro-display");
  const btnInic   = document.getElementById("btn-iniciar");
  const btnPaus   = document.getElementById("btn-pausar");
  const btnZer    = document.getElementById("btn-zerar");

  let cronSegundos = 0;
  let cronInterval = null;
  let cronRodando  = false;

  function formatarTempo(seg) {
    const h = Math.floor(seg / 3600);
    const m = Math.floor((seg % 3600) / 60);
    const s = seg % 60;
    return (
      String(h).padStart(2, "0") + ":" +
      String(m).padStart(2, "0") + ":" +
      String(s).padStart(2, "0")
    );
  }

  function atualizarDisplay() {
    if (display) display.textContent = formatarTempo(cronSegundos);
  }

  if (btnInic) {
    btnInic.addEventListener("click", function () {
      if (cronRodando) return;
      cronRodando = true;
      btnInic.disabled = true;
      btnPaus.disabled = false;
      btnZer.disabled  = false;

      cronInterval = setInterval(function () {
        cronSegundos++;
        atualizarDisplay();
      }, 1000);
    });
  }

  if (btnPaus) {
    btnPaus.addEventListener("click", function () {
      clearInterval(cronInterval);
      cronRodando = false;
      btnInic.disabled = false;
      btnPaus.disabled = true;
    });
  }

  if (btnZer) {
    btnZer.addEventListener("click", function () {
      clearInterval(cronInterval);
      cronRodando  = false;
      cronSegundos = 0;
      atualizarDisplay();
      btnInic.disabled = false;
      btnPaus.disabled = true;
      btnZer.disabled  = true;
    });
  }

  // Presets de tempo
  document.querySelectorAll(".btn-preset").forEach(function (btn) {
    btn.addEventListener("click", function () {
      // Zera e configura
      clearInterval(cronInterval);
      cronRodando  = false;
      cronSegundos = parseInt(btn.dataset.seg) || 0;
      atualizarDisplay();
      if (btnInic) btnInic.disabled = false;
      if (btnPaus) btnPaus.disabled = true;
      if (btnZer)  btnZer.disabled  = false;
    });
  });

  // ────────────────────────────────────────────────────────────
  // 8. CONVERSOR DE MEDIDAS
  // Densidade dos ingredientes (g por ml)
  // ────────────────────────────────────────────────────────────
  const densidades = {
    acucar:   0.85,   // g/ml
    farinha:  0.55,
    leite:    1.03,
    manteiga: 0.91,
    oleo:     0.92
  };

  // Volume em ml de cada unidade
  const volUnd = {
    xicara:      240,
    colher_sopa: 15,
    colher_cha:  5,
    ml:          1
  };

  function converterMedida(ingrediente, qtd, de, para) {
    const dens = densidades[ingrediente] || 1;

    // Converte tudo para ml primeiro
    let ml;
    if (de === "gramas") {
      ml = qtd / dens;
    } else {
      ml = qtd * (volUnd[de] || 1);
    }

    // Converte de ml para a unidade de destino
    let resultado;
    if (para === "gramas") {
      resultado = ml * dens;
    } else {
      resultado = ml / (volUnd[para] || 1);
    }

    return parseFloat(resultado.toFixed(2));
  }

  const nomeIngred = {
    acucar:   "Açúcar",
    farinha:  "Farinha de trigo",
    leite:    "Leite",
    manteiga: "Manteiga",
    oleo:     "Óleo de milho"
  };

  const nomeUnid = {
    xicara:      "xícara(s) de 240 ml",
    colher_sopa: "colher(es) de sopa",
    colher_cha:  "colher(es) de chá",
    gramas:      "g",
    ml:          "ml"
  };

  const btnConv   = document.getElementById("btn-converter");
  const convResult = document.getElementById("conversor-resultado");

  if (btnConv) {
    btnConv.addEventListener("click", function () {
      const ingrediente = document.getElementById("conv-ingrediente").value;
      const qtd         = parseFloat(document.getElementById("conv-qtd").value) || 1;
      const de          = document.getElementById("conv-de").value;
      const para        = document.getElementById("conv-para").value;

      if (de === para) {
        convResult.textContent = "As unidades são iguais! Escolha unidades diferentes.";
        return;
      }

      const resultado = converterMedida(ingrediente, qtd, de, para);

      convResult.innerHTML =
        "<strong>" + qtd + " " + nomeUnid[de] + "</strong> de " +
        "<strong>" + nomeIngred[ingrediente] + "</strong>" +
        " equivale a " +
        "<strong>" + resultado + " " + nomeUnid[para] + "</strong>.";
    });
  }

  // ────────────────────────────────────────────────────────────
  // 9. COMENTÁRIOS (sem backend — só na sessão)
  // ────────────────────────────────────────────────────────────
  const btnComentar     = document.getElementById("btn-comentar");
  const listaComs       = document.getElementById("lista-comentarios");
  const inputNome       = document.getElementById("com-nome");
  const inputTexto      = document.getElementById("com-texto");

  if (btnComentar) {
    btnComentar.addEventListener("click", function () {
      const nome  = (inputNome.value  || "").trim();
      const texto = (inputTexto.value || "").trim();

      if (!nome) {
        inputNome.focus();
        inputNome.placeholder = "⚠️ Insira seu nome!";
        return;
      }

      if (!texto) {
        inputTexto.focus();
        inputTexto.placeholder = "⚠️ Escreva um comentário!";
        return;
      }

      const agora = new Date();
      const hora  = agora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
      const data  = agora.toLocaleDateString("pt-BR");

      const li = document.createElement("li");
      li.innerHTML =
        "<span class='com-nome'>" + nome + "</span>" +
        "<span class='com-data'>" + data + " às " + hora + "</span>" +
        "<br/>" + texto;

      listaComs.prepend(li);

      // Limpar form
      inputNome.value  = "";
      inputTexto.value = "";
      inputNome.placeholder  = "Seu nome";
      inputTexto.placeholder = "Deixe seu comentário sobre esta receita...";
    });
  }

  // ────────────────────────────────────────────────────────────
  // 10. BOTÃO "BOM APETITE"
  // ────────────────────────────────────────────────────────────
  const btnApetite = document.getElementById("btn-apetite");
  if (btnApetite) {
    btnApetite.addEventListener("click", function () {
      alert("Bom apetite! Prepare o café! ☕🥕🍫");
    });
  }

  // ────────────────────────────────────────────────────────────
  // Log de confirmação
  // ────────────────────────────────────────────────────────────
  console.log("🥕 Bolo de Cenoura carregado! Todas as funcionalidades ativas.");

}); // fim DOMContentLoaded
