function syncGiftInData() {
  if (!window.tcart || !Array.isArray(tcart.products)) return;
  
  console.log('Синхронизация подарка:', tcart.products); // Для отладки
  
  const hasOil = tcart.products.some(p => OIL_REGEXP.test(p.name));
  const hasGift = tcart.products.some(p => p.id === GIFT_ID);

  console.log('Есть масло:', hasOil, 'Есть подарок:', hasGift); // Для отладки

  if (hasOil && !hasGift) {
    console.log('Добавляем подарок...'); // Для отладки
    
    // Пробуем разные способы добавления товара
    const giftProduct = { 
      id: GIFT_ID, 
      name: GIFT_NAME, 
      price: 0, 
      quantity: 1, 
      sku: '', 
      img: GIFT_IMG 
    };
    
    // Сначала пробуем tcart.addProduct
    if (typeof tcart.addProduct === 'function') {
      tcart.addProduct(giftProduct);
    }
    // Если не работает, пробуем tcart__addProduct
    else if (typeof tcart__addProduct === 'function') {
      tcart__addProduct(giftProduct);
    }
    // Если и это не работает, добавляем напрямую в массив
    else {
      tcart.products.push(giftProduct);
    }
  }
  
  if (!hasOil && hasGift) {
    console.log('Удаляем подарок...'); // Для отладки
    tcart.deleteProduct(GIFT_ID);
  }
}

/* — Перерисовываем UI корзины — */
function redrawCartUI() {
  // Добавляем небольшую задержку для корректной перерисовки
  setTimeout(() => {
    if (typeof tcart__reDrawProducts === 'function') tcart__reDrawProducts();
    if (typeof tcart__reDrawTotal === 'function') tcart__reDrawTotal();
    if (typeof tcart__reDrawCartIcon === 'function') tcart__reDrawCartIcon();
  }, 100);
}

/* — Ставим «0 р.» в DOM у подарка — */
function fixGiftPriceInUI() {
  // Добавляем задержку, чтобы DOM успел обновиться
  setTimeout(() => {
    document.querySelectorAll('.t706__cartwin-products .t706__cartwin-product').forEach(prod => {
      const title = prod.querySelector('.t706__product-title')?.textContent.trim();
      if (title === GIFT_NAME) {
        const priceEl = prod.querySelector('.t706__product-price');
        if (priceEl) priceEl.textContent = '0 р.';
      }
    });
  }, 200);
}

/* — Всё вместе — */
function syncAndRedraw() {
  syncGiftInData();
  redrawCartUI();
  fixGiftPriceInUI();
}

/* === Monkey-patch tcart.addProduct/deleteProduct === */
document.addEventListener('DOMContentLoaded', () => {
  const iv = setInterval(() => {
    if (window.tcart && typeof tcart.addProduct === 'function') {
      clearInterval(iv);
      
      console.log('Корзина инициализирована'); // Для отладки
      
      // обёртка addProduct
      const origAdd = tcart.addProduct.bind(tcart);
      tcart.addProduct = function(item) {
        console.log('Добавляется товар:', item); // Для отладки
        const result = origAdd(item);
        syncAndRedraw();
        return result;
      };
      
      // обёртка deleteProduct
      const origDel = tcart.deleteProduct.bind(tcart);
      tcart.deleteProduct = function(id) {
        console.log('Удаляется товар:', id); // Для отладки
        const result = origDel(id);
        syncAndRedraw();
        return result;
      };
      
      // стартовая инициализация
      syncAndRedraw();
    }
  }, 50);
});

// Дополнительная проверка при изменении корзины
if (typeof MutationObserver !== 'undefined') {
  const observer = new MutationObserver(() => {
    fixGiftPriceInUI();
  });
  
  setTimeout(() => {
    const cartContainer = document.querySelector('.t706__cartwin-products');
    if (cartContainer) {
      observer.observe(cartContainer, { childList: true, subtree: true });
    }
  }, 1000);
}
