const botao = document.querySelector('[data-menu]');

const menu = document.querySelector('.nav-links');

if (botao && menu) {
  botao.addEventListener('click', () => {
    menu.classList.toggle('open');
  });
}

document
  .querySelectorAll('[data-confirmar]')
  .forEach((item) =>
    item.addEventListener('submit', (evento) => {
      if (
        !window.confirm(
          item.dataset.confirmar || 'Confirma esta ação?'
        )
      ) {
        evento.preventDefault();
      }
    })
  );