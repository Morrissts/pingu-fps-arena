(() => {
  'use strict';

  const ITEMS = {
    heal: { label: 'Läkning', icon: '✚', hint: 'Återställer hälsa' },
    rapid: { label: 'Snabbkast', icon: '»', hint: 'Kasta snabbare' },
    shield: { label: 'Issköld', icon: '◇', hint: 'Skyddar mot skada' }
  };
  const MAX_STACK = 3;
  const slots = [null, null, null];
  let selected = 0;
  let root = null;
  let toastTimer = 0;

  function isGameActive() {
    const menu = document.getElementById('overlay');
    return !menu || menu.classList.contains('hidden');
  }

  function injectStyles() {
    if (document.getElementById('pingu-inventory-style')) return;
    const style = document.createElement('style');
    style.id = 'pingu-inventory-style';
    style.textContent = `
      .inventory-hud {
        position: fixed; right: 28px; bottom: 96px; z-index: 5;
        display: flex; align-items: end; gap: 7px; color: #fff8e9;
        font-family: "Trebuchet MS", "Segoe UI", system-ui, sans-serif; text-shadow: 0 2px 8px #10132b;
        transition: opacity .16s ease, transform .16s ease;
      }
      .inventory-hud.menu-hidden { opacity: 0; pointer-events: none; transform: translateY(5px); }
      .inventory-label {
        position: absolute; right: 0; bottom: calc(100% + 7px); color: #ffd878;
        font-size: 9px; font-weight: 800; letter-spacing: .16em; text-transform: uppercase;
        white-space: nowrap;
      }
      .inventory-slots { display: flex; align-items: end; gap: 7px; }
      .inventory-slot {
        position: relative; min-width: 0; width: 58px; height: 59px; padding: 5px 4px 4px;
        display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1px;
        border: 2px solid #aaa4dc; border-radius: 13px; color: #e8e7fb;
        background: linear-gradient(145deg, #292c59ed, #171a3ded); cursor: pointer;
        box-shadow: 0 4px 0 #10132b, 0 8px 20px #10132b55; backdrop-filter: blur(8px);
        transition: border-color .14s ease, background .14s ease, transform .14s ease;
      }
      .inventory-slot:hover { transform: translateY(-3px); border-color: #ffd878; }
      .inventory-slot.selected { border-color: #8af2d0; background: linear-gradient(145deg, #35596c, #29274f); box-shadow: 0 0 16px #8af2d055, 0 4px 0 #10132b; }
      .inventory-slot.empty { color: #aaa9cc; border-style: dashed; background: #171a3dd9; }
      .inventory-key { position: absolute; top: 4px; left: 6px; color: #b4a5ff; font-size: 8px; font-weight: 900; }
      .inventory-icon { font-size: 18px; line-height: 19px; font-weight: 900; color: #ffd878; }
      .inventory-name { max-width: 100%; overflow: hidden; color: #fff1d7; font-size: 8px; letter-spacing: .02em; white-space: nowrap; }
      .inventory-count { position: absolute; right: 5px; top: 3px; color: #8af2d0; font-size: 10px; font-weight: 900; }
      .inventory-help { position: absolute; right: 0; top: calc(100% + 5px); color: #d0d6f1; font-size: 8px; letter-spacing: .08em; text-align: right; white-space: nowrap; }
      .inventory-toast { position: absolute; right: 0; bottom: calc(100% + 7px); padding: 8px 11px; border: 1px solid #ffd878; border-radius: 11px; background: #24264feF; color: #fff1c7; font-size: 10px; font-weight: 800; letter-spacing: .04em; white-space: nowrap; opacity: 0; transform: translateY(4px); pointer-events: none; transition: opacity .16s, transform .16s; box-shadow: 0 4px 0 #10132b; }
      .inventory-toast.show { opacity: 1; transform: translateY(0); }
      @media (max-width: 540px) {
        .inventory-hud { right: 14px; bottom: 76px; gap: 5px; }
        .inventory-slots { gap: 5px; }
        .inventory-slot { width: 48px; height: 52px; min-width: 0; border-radius: 7px; }
        .inventory-label { font-size: 7px; } .inventory-help { display: none; }
      }
    `;
    document.head.appendChild(style);
  }

  function createHud() {
    if (root || !document.body) return;
    injectStyles();
    root = document.createElement('div');
    root.className = 'inventory-hud';
    root.setAttribute('aria-label', 'Föremål');
    root.innerHTML = '<div class="inventory-label">Föremål</div><div class="inventory-slots"></div><div class="inventory-help">1–3 välj · E använd</div><div class="inventory-toast" role="status" aria-live="polite"></div>';
    document.body.appendChild(root);
    root.addEventListener('click', (event) => {
      const button = event.target.closest('[data-slot]');
      if (button) select(Number(button.dataset.slot));
    });

    const menu = document.getElementById('overlay');
    if (menu && window.MutationObserver) {
      const observer = new MutationObserver(() => syncMenuVisibility());
      observer.observe(menu, { attributes: true, attributeFilter: ['class'] });
    }
    syncMenuVisibility();
    render();
  }

  function syncMenuVisibility() {
    if (!root) return;
    const menu = document.getElementById('overlay');
    root.classList.toggle('menu-hidden', !!menu && !menu.classList.contains('hidden'));
  }

  function render() {
    if (!root) return;
    const host = root.querySelector('.inventory-slots');
    host.replaceChildren();
    slots.forEach((stack, index) => {
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'inventory-slot';
      button.classList.toggle('selected', index === selected);
      button.classList.toggle('empty', !stack);
      button.dataset.slot = String(index);
      button.setAttribute('aria-pressed', String(index === selected));
      const item = stack && ITEMS[stack.type];
      button.setAttribute('aria-label', item ? `${item.label}, ${stack.count} stycken, plats ${index + 1}` : `Tom plats ${index + 1}`);
      button.innerHTML = `<span class="inventory-key">${index + 1}</span>${item ? `<span class="inventory-icon" aria-hidden="true">${item.icon}</span><span class="inventory-name">${item.label}</span><span class="inventory-count">${stack.count}</span>` : '<span class="inventory-icon" aria-hidden="true">·</span><span class="inventory-name">Tom</span>'}`;
      host.appendChild(button);
    });
  }

  function notify(message) {
    if (!root) return;
    const toast = root.querySelector('.inventory-toast');
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 1800);
  }

  function select(index) {
    if (!Number.isInteger(index) || index < 0 || index >= slots.length) return false;
    selected = index; render(); return true;
  }

  function add(type, amount = 1) {
    if (!ITEMS[type] || !Number.isFinite(amount) || amount <= 0) return Math.max(0, amount || 0);
    const requested = Math.floor(amount);
    let remaining = requested;
    for (const stack of slots) {
      if (stack?.type === type && stack.count < MAX_STACK) {
        const added = Math.min(MAX_STACK - stack.count, remaining);
        stack.count += added; remaining -= added;
        if (!remaining) break;
      }
    }
    for (let i = 0; i < slots.length && remaining > 0; i++) {
      if (!slots[i]) {
        const added = Math.min(MAX_STACK, remaining);
        slots[i] = { type, count: added }; remaining -= added;
      }
    }
    render();
    const added = requested - remaining;
    if (added) notify(`+${added} ${ITEMS[type].label}`);
    if (remaining) notify('Föremålsfacken är fulla');
    return remaining;
  }

  function useSelected() {
    if (!isGameActive()) return false;
    const stack = slots[selected];
    if (!stack?.count) return false;
    const type = stack.type;
    const event = new CustomEvent('pingu:item-use', { detail: { id: type, type, slot: selected + 1 }, cancelable: true });
    if (!window.dispatchEvent(event)) return false;
    stack.count--;
    if (!stack.count) slots[selected] = null;
    render();
    return true;
  }

  function clear() { slots.fill(null); selected = 0; render(); }

  window.PinguInventory = {
    add,
    select,
    useSelected,
    clear,
    notify,
    getState: () => ({ selected: selected + 1, slots: slots.map(stack => stack ? { ...stack } : null) }),
    items: Object.freeze(Object.keys(ITEMS))
  };

  document.addEventListener('keydown', (event) => {
    if (event.repeat || !isGameActive()) return;
    if (event.code === 'Digit1' || event.code === 'Numpad1') { select(0); event.preventDefault(); }
    else if (event.code === 'Digit2' || event.code === 'Numpad2') { select(1); event.preventDefault(); }
    else if (event.code === 'Digit3' || event.code === 'Numpad3') { select(2); event.preventDefault(); }
    else if (event.code === 'KeyE') { useSelected(); event.preventDefault(); }
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', createHud, { once: true });
  else createHud();
})();

