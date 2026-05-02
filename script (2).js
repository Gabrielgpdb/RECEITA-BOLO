// Aguarda o carregamento do HTML para garantir que os elementos existam na página.
document.addEventListener('DOMContentLoaded', function () {
  // Seleciona os principais elementos da interface.
  const botaoBomApetite = document.getElementById('btn-bom-apetite');
  const botaoTema = document.getElementById('btn-tema');
  const contadorVisitas = document.getElementById('contador-visitas');
  const itensIngredientes = document.querySelectorAll('#lista-ingredientes li');
  const body = document.body;

  // Incrementa o contador de visualizações ao carregar a página.
  if (contadorVisitas) {
    const valorAtual = parseInt(contadorVisitas.innerText, 10) || 0;
    contadorVisitas.innerText = valorAtual + 1;
  }

  // Exibe um alerta amigável ao clicar no botão principal.
  if (botaoBomApetite) {
    botaoBomApetite.addEventListener('click', function () {
      alert('Bom apetite! Prepare o café! ☕');
    });
  }

  // Permite marcar ingredientes como comprados com um clique.
  itensIngredientes.forEach(function (item) {
    item.addEventListener('click', function () {
      item.classList.toggle('comprado');
    });
  });

  // Recupera o tema salvo anteriormente, se existir.
  const temaSalvo = localStorage.getItem('tema-preferido');

  if (temaSalvo === 'tema-escuro') {
    body.classList.remove('tema-claro');
    body.classList.add('tema-escuro');
    botaoTema.setAttribute('aria-pressed', 'true');
  } else {
    body.classList.remove('tema-escuro');
    body.classList.add('tema-claro');
    botaoTema.setAttribute('aria-pressed', 'false');
  }

  // Alterna entre tema claro e escuro e salva a preferência no navegador.
  if (botaoTema) {
    botaoTema.addEventListener('click', function () {
      const ativouTemaEscuro = body.classList.toggle('tema-escuro');
      body.classList.toggle('tema-claro', !ativouTemaEscuro);

      const temaAtual = ativouTemaEscuro ? 'tema-escuro' : 'tema-claro';
      localStorage.setItem('tema-preferido', temaAtual);
      botaoTema.setAttribute('aria-pressed', String(ativouTemaEscuro));
    });
  }
});
