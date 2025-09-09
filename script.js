// هذا الملف يجب أن يكون في نفس مجلد ملف index.html
let productsData = {};
const orders = {
    "74562341": { status: "Shipped", img: "images/my-shipped.png" },
    "12345678": { status: "Delivered", img: "images/my-delivered.png" },
    "87654321": { status: "Processing", img: "images/my-processing.png" },
    "10101010": { status: "Out for Delivery", img: "images/my-outfordelivery.png" }
};

const formspreeEndpoints = {
    vodafone: 'https://formspree.io/f/mandayql',
    paypal: 'https://formspree.io/f/mandayql',
    feedback: 'https://formspree.io/f/mqazqjjo'
};

const discountCodes = {
    "DISCORD10": { percentage: 10 },
    "BERLIN5": { percentage: 5 },
    "GOE": { percentage: 6 }
};

let currentProduct = null;
let cart = JSON.parse(localStorage.getItem('cart')) || {};
let paymentTimerInterval = null;
let appliedDiscount = null;

async function initializeApp() {
    try {
        const response = await fetch('products.json');
        if (!response.ok) {
            throw new Error('Network response was not ok ' + response.statusText);
        }
        productsData = await response.json();

        initializeFakeRatings();

        loadGamesToHome();
        loadValorantToHome();
        loadSubscriptionsToHome();
        loadSteamGiftCardsToHome();
        loadSteamPointsToHome();
        updateCartCount();
        setupStarRatingInput();

        document.getElementById('vodafoneForm').addEventListener('submit', handlePaymentSubmit);
        document.getElementById('paypalForm').addEventListener('submit', handlePaymentSubmit);

        const navbar = document.getElementById('navbar');
        window.addEventListener('scroll', () => {
            if (window.scrollY > 10) {
                navbar.classList.add('navbar-scrolled');
            } else {
                navbar.classList.remove('navbar-scrolled');
            }
        });

        handleRouting();
        window.addEventListener('hashchange', handleRouting);

    } catch (error) {
        console.error('Failed to load products data:', error);
        document.body.innerHTML = '<h2 style="text-align: center; color: white;">فشل تحميل بيانات المنتجات. يرجى المحاولة مرة أخرى لاحقًا.</h2>';
    }
}

function initializeFakeRatings() {
    const productIds = Object.keys(productsData);
    productIds.forEach(id => {
        const storageKey = `comments_${id}`;
        if (!localStorage.getItem(storageKey)) {
            const fakeComments = [];
            const reviewCount = Math.floor(Math.random() * 10) + 1;
            for (let i = 0; i < reviewCount; i++) {
                fakeComments.push({
                    name: `عميل #${i + 1}`,
                    text: "منتج ممتاز وخدمة سريعة!",
                    rating: 5,
                    date: new Date().toISOString(),
                    helpfulCount: 0
                });
            }
            localStorage.setItem(storageKey, JSON.stringify(fakeComments));
        }
    });
}

function handlePaymentSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const loadingSection = document.getElementById('loading');
    const loadingText = document.getElementById('loading-text');
    const confirmationSection = document.getElementById('confirmationMessage');

    form.closest('.modal-content-section').classList.remove('is-visible');
    loadingText.textContent = "يتم مراجعة الدفع...";
    loadingSection.classList.add('is-visible');

    const formData = new FormData(form);
    const formAction = form.action;

    setTimeout(() => {
        fetch(formAction, {
            method: 'POST',
            body: formData,
            headers: { 'Accept': 'application/json' }
        })
            .then(response => {
                if (response.ok) {
                    loadingSection.classList.remove('is-visible');
                    confirmationSection.innerHTML = `<h2>شكرا لشرائك من Berlin Store</h2>`;
                    confirmationSection.classList.add('is-visible');
                    cart = {};
                    localStorage.setItem('cart', JSON.stringify(cart));
                    updateCartCount();
                    setTimeout(() => closeModal('paymentModal'), 2500);
                } else {
                    throw new Error('Network response was not ok.');
                }
            })
            .catch(error => {
                loadingText.textContent = "حدث خطأ. يرجى المحاولة مرة أخرى.";
                console.error('Form submission error:', error);
                setTimeout(() => closeModal('paymentModal'), 2000);
            });
    }, 2000);
}

function showToast(message) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        toast.addEventListener('transitionend', () => toast.remove());
    }, 3000);
}

document.addEventListener('DOMContentLoaded', initializeApp);

function setupStarRatingInput() {
    const starsContainer = document.getElementById('ratingStars');
    if (!starsContainer) return;
    const ratingInput = document.getElementById('commentRating');
    const stars = starsContainer.querySelectorAll('.star');
    stars.forEach(star => {
        star.addEventListener('click', () => {
            const value = star.dataset.value;
            ratingInput.value = value;
            starsContainer.dataset.rating = value;
        });
    });
}

function handleRouting() {
    const hash = window.location.hash || '#home';
    const [section, param] = hash.substring(1).split('/');
    if (section === 'product' && param && productsData[param]) {
        showProductPage(param);
    } else if (document.getElementById(section)) {
        showSection(section);
        switch (section) {
            case 'products': loadProducts(); break;
            case 'subscriptions': loadSubscriptions(); break;
            case 'valorantPoints': loadValorantPoints(); break;
            case 'steamPoints': loadSteamPoints(); break;
            case 'steamGiftCards': loadSteamGiftCards(); break;
        }
    } else {
        showSection('home');
    }
}

function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(s => s.style.display = 'none');
    document.getElementById(sectionId).style.display = 'block';
    window.scrollTo(0, 0);
}

function showModal(modalId) {
    const modal = document.getElementById(modalId);
    const overlay = document.getElementById('overlay');
    modal.classList.add('is-visible');
    overlay.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeModal(modalId) {
    const modals = document.querySelectorAll('.modal');
    const overlay = document.getElementById('overlay');
    if (modalId === 'all') {
        modals.forEach(m => m.classList.remove('is-visible'));
    } else {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.remove('is-visible');
    }
    overlay.style.display = 'none';
    document.body.style.overflow = 'auto';
    clearInterval(paymentTimerInterval);
    document.querySelectorAll('.confirm-payment-btn').forEach(btn => btn.disabled = false);
    const paymentModal = document.getElementById('paymentModal');
    if (paymentModal) {
        paymentModal.querySelectorAll('.modal-content-section').forEach(s => s.classList.remove('is-visible'));
        document.getElementById('modalCommonContent').classList.add('is-visible');
    }
    if (modalId === 'cartModal' || modalId === 'all') {
        document.getElementById('discountMessage').textContent = '';
        document.getElementById('discountCodeInput').value = '';
        appliedDiscount = null;
    }
}

function addToCartHandler(event, productId, quantity) {
    flyToCart(event);
    showToast("تمت إضافة المنتج للسلة بنجاح!");
    cart[productId] ? cart[productId].quantity += quantity : cart[productId] = { ...productsData[productId], quantity: quantity };
    localStorage.setItem('cart', JSON.stringify(cart));
    setTimeout(() => {
        updateCartCount();
        const cartButton = document.querySelector('.fixed-cart-button');
        cartButton.classList.add('added');
        setTimeout(() => cartButton.classList.remove('added'), 400);
    }, 500);
}

function flyToCart(event) {
    const cartBtn = document.querySelector('.fixed-cart-button');
    if (!cartBtn || !event) return;
    const productCard = event.target.closest('.product-item, .subscription-item');
    let sourceImageElement = productCard ? productCard.querySelector('.product-image-wrapper img, .sub-image-wrapper img') : document.getElementById('productPageImage');
    if (!sourceImageElement) return;
    const sourceRect = sourceImageElement.getBoundingClientRect();
    const cartRect = cartBtn.getBoundingClientRect();
    const flyingImg = document.createElement('img');
    flyingImg.src = sourceImageElement.src;
    flyingImg.className = 'product-image-fly';
    document.body.appendChild(flyingImg);
    flyingImg.style.cssText = `left: ${sourceRect.left}px; top: ${sourceRect.top}px; width: ${sourceRect.width}px; height: ${sourceRect.height}px;`;
    requestAnimationFrame(() => {
        flyingImg.style.cssText += `left: ${cartRect.left + cartRect.width / 2}px; top: ${cartRect.top + cartRect.height / 2}px; width: 0; height: 0; opacity: 0.5; transform: rotate(180deg);`;
    });
    setTimeout(() => flyingImg.remove(), 800);
}

function renderProductItem(product, container, sectionType, showRating) {
    const item = document.createElement('div');
    item.className = product.options ? 'subscription-item' : `product-item glass-card ${sectionType === 'valorant' ? 'valorant-item' : ''}`;

    const clickHandler = `window.location.hash = 'product/${product.id}'`;
    let ratingHTML = '';
    if (showRating) {
        const comments = JSON.parse(localStorage.getItem(`comments_${product.id}`)) || [];
        const ratingCount = comments.length;
        let starsHTML = '';
        if (ratingCount > 0) {
            const averageRating = comments.reduce((total, c) => total + (c.rating || 0), 0) / ratingCount;
            const roundedRating = Math.round(averageRating);
            for (let i = 1; i <= 5; i++) starsHTML += `<span class="star ${i <= roundedRating ? 'filled' : ''}">&#9733;</span>`;
        } else {
            for (let i = 1; i <= 5; i++) starsHTML += `<span class="star">&#9734;</span>`;
        }
        ratingHTML = `<div class="product-card-rating">${starsHTML}<span class="rating-count">(${ratingCount})</span></div>`;
    }

    if (product.options) {
        const priceDisplay = `يبدأ من ${product.price} ج.م`;
        item.innerHTML = `
            <div class="sub-image-wrapper" onclick="${clickHandler}">
                <div class="sub-description-overlay">${product.shortDescription}</div>
                <img src="${product.image}" alt="${product.title}" loading="lazy" onerror="this.onerror=null;this.src='./images/placeholder.png';">
            </div>
            <div class="sub-content">
                <h3 onclick="${clickHandler}">${product.title}</h3>
                ${ratingHTML}
                <div class="sub-footer">
                    <span class="sub-price">${priceDisplay}</span>
                    <button onclick="openPaymentModal('${product.id}')" class="subscribe-btn"><img src="./images/cartt.png" alt="Cart Icon"><span>اشترك الآن</span></button>
                </div>
            </div>`;
    } else {
        let platformIconHTML = '';
        if (product.platform) {
            const platforms = { steam: 'steam.png', microsoft: 'microsoft.png', riot: 'riotgames.png' };
            if (platforms[product.platform]) platformIconHTML = `<div class="platform-icon"><img src="./images/${platforms[product.platform]}" alt="${product.platform} Icon"></div>`;
        }
        const badgesHTML = product.badges ? product.badges.map(b => `<div class="product-badge ${b.toLowerCase().includes('bestseller') ? 'bestseller' : ''}">${b}</div>`).join('') : '';
        const descriptionHTML = product.shortDescription ? `<p class="product-description-text">${product.shortDescription}</p>` : '';
        const priceDisplay = `${product.price} ج.م`;
        const buttonsHTML = `
            <div class="product-buttons-container">
                <button onclick="openPaymentModal('${product.id}')" class="buy-btn">شراء الآن</button>
                <button onclick="addToCartHandler(event, '${product.id}', 1)" class="add-to-cart-btn"><img src="./images/cartt.png" alt="Add to cart icon"></button>
            </div>`;

        item.innerHTML = `
            <div class="product-badge-container">${badgesHTML}</div>
            ${platformIconHTML}
            <div class="product-image-wrapper" onclick="${clickHandler}">
                <img src="${product.image}" alt="${product.title}" loading="lazy" onerror="this.onerror=null;this.src='./images/placeholder.png';">
            </div>
            <h3 onclick="${clickHandler}">${product.title}</h3>
            ${ratingHTML}
            ${descriptionHTML}
            <p>السعر: ${priceDisplay}</p>
            ${buttonsHTML}`;
    }
    container.appendChild(item);
}

function loadDataToContainer(ids, containerId, type, showRating) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    ids.forEach(id => {
        if (productsData[id]) renderProductItem(productsData[id], container, type, showRating);
    });
}

function loadGamesToHome() { loadDataToContainer(['gta', 'minecraft', 'splitfiction', 'mafia', 'rust'], 'gamesContainer', 'games', true); }
function loadValorantToHome() { loadDataToContainer(['valorant475', 'valorant1000', 'valorant2050', 'valorant3650', 'valorant5350', 'valorant11000'], 'valorantContainer', 'valorant', true); }
function loadSubscriptionsToHome() { loadDataToContainer(['netflix', 'disney', 'crunchyroll', 'gamepass', 'entertainment-bundle'], 'homeSubscriptionsContainer', 'subscriptions', true); }
function loadSteamPointsToHome() { loadDataToContainer(['steam20k', 'steam50k'], 'steamPointsContainer', 'steam', true); }
function loadSteamGiftCardsToHome() { loadDataToContainer(['steamGift5', 'steamGift10', 'steamGift20', 'steamGift50', 'steamGift100'], 'steamGiftCardsHomeContainer', 'steam', true); }
function loadProducts() { loadDataToContainer(Object.keys(productsData).filter(id => !productsData[id].options && !id.startsWith('valorant') && !id.startsWith('steam')), 'productsContainer', 'games', false); }
function loadSubscriptions() { loadDataToContainer(Object.keys(productsData).filter(id => productsData[id].options), 'subscriptionsContainer', 'subscriptions', false); }
function loadValorantPoints() { loadDataToContainer(Object.keys(productsData).filter(id => id.startsWith('valorant')), 'valorantPointsPageContainer', 'valorant', true); }
function loadSteamPoints() { loadDataToContainer(['steam20k', 'steam50k'], 'steamPointsPageContainer', 'steam', false); }
function loadSteamGiftCards() { loadDataToContainer(Object.keys(productsData).filter(id => id.startsWith('steamGift')), 'steamGiftCardsPageContainer', 'steam', false); }

function searchProducts() {
    const query = document.getElementById('productSearch').value.toLowerCase();
    document.querySelectorAll('#productsContainer .product-item, #subscriptionsContainer .product-item').forEach(item => {
        item.style.display = item.querySelector('h3').textContent.toLowerCase().includes(query) ? 'block' : 'none';
    });
}

function checkOrder() {
    const orderCode = document.getElementById('orderCode').value;
    const resultText = document.getElementById('resultText');
    const statusImage = document.getElementById('statusImage');
    const order = orders[orderCode];
    if (order) {
        resultText.textContent = `حالة الطلب: ${order.status}`;
        statusImage.src = order.img;
        statusImage.style.display = 'block';
        resultText.style.color = '#00ff00';
    } else {
        resultText.textContent = "عذراً، لم يتم العثور على هذا الطلب.";
        statusImage.style.display = 'none';
        resultText.style.color = 'red';
    }
    resultText.style.opacity = 1;
    statusImage.style.opacity = 1;
}

function showProductPage(productId) {
    if (`#product/${productId}` !== window.location.hash) {
        window.location.hash = `product/${productId}`;
        return;
    }
    currentProduct = productsData[productId];
    const imagePlaceholder = document.querySelector('#mainImageContainer .main-image-placeholder');
    const mainImage = document.getElementById('productPageImage');
    imagePlaceholder.style.display = 'flex';
    mainImage.style.display = 'none';
    mainImage.onload = () => {
        imagePlaceholder.style.display = 'none';
        mainImage.style.display = 'block';
    };
    mainImage.src = currentProduct.image;
    document.getElementById('productPageTitle').textContent = currentProduct.title;
    document.getElementById('productPagePrice').textContent = `${currentProduct.price} ج.م`;
    document.getElementById('productPageShortDescription').textContent = currentProduct.shortDescription || '';
    document.getElementById('productPageFullDescription').innerHTML = `<h2>الوصف</h2>${currentProduct.fullDescription || ''}`;
    document.getElementById('specs').innerHTML = currentProduct.specs || '<p>لا توجد مواصفات متاحة حاليًا لهذا المنتج.</p>';

    const stockContainer = document.getElementById('productPageStock');
    stockContainer.innerHTML = currentProduct.stock ? `🔥 ${currentProduct.stock} قطع فقط متبقية!` : '';

    const platformContainer = document.getElementById('productPagePlatform');
    platformContainer.innerHTML = '';
    if (currentProduct.platform) {
        const platforms = { steam: 'steam.png', microsoft: 'microsoft.png', riot: 'riotgames.png' };
        const platformName = { steam: 'Steam', microsoft: 'Microsoft', riot: 'Riot Games' };
        if (platforms[currentProduct.platform]) {
            platformContainer.innerHTML = `<span>المنصة:</span><img src="./images/${platforms[currentProduct.platform]}" alt="${platformName[currentProduct.platform]} Logo"><strong>${platformName[currentProduct.platform]}</strong>`;
        }
    }

    const badgeElement = document.getElementById('productPageBadge');
    badgeElement.innerHTML = '';
    if (currentProduct.badges && currentProduct.badges.length > 0) {
        const badge = currentProduct.badges[0];
        badgeElement.className = `product-detail-badge ${badge.toLowerCase().includes('bestseller') ? 'bestseller' : 'special'}`;
        badgeElement.textContent = badge;
    }

    const quantityInput = document.getElementById('productPageQuantity');
    quantityInput.value = 1;
    document.getElementById('decreaseProductPageQuantity').onclick = () => { if (quantityInput.value > 1) quantityInput.value--; };
    document.getElementById('increaseProductPageQuantity').onclick = () => { quantityInput.value++; };
    document.getElementById('addToCartBtn').onclick = (event) => addToCartHandler(event, currentProduct.id, parseInt(quantityInput.value));

    setupTabs();
    loadComments(productId);
    updateProductPageAverageRating(productId);
    renderRelatedProducts(productId);
    showSection('productPage');
}

function renderRelatedProducts(productId) {
    const container = document.getElementById('relatedProductsContainer');
    container.innerHTML = '';
    const relatedIds = productsData[productId]?.related || [];
    if (relatedIds.length > 0) {
        loadDataToContainer(relatedIds, 'relatedProductsContainer', 'related', true);
        document.getElementById('related-products-section').style.display = 'block';
    } else {
        document.getElementById('related-products-section').style.display = 'none';
    }
}

function setupTabs() {
    document.querySelectorAll('.tab-button').forEach(button => {
        button.onclick = () => {
            document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.toggle('active', content.id === button.dataset.tab);
            });
        };
    });
}

function updateSteamProductTotal() {
    if (!currentProduct || !currentProduct.id.startsWith('steam')) return;
    const quantityInput = document.getElementById('quantityInput');
    let quantity = parseInt(quantityInput.value);
    if (isNaN(quantity) || quantity < 1) quantity = 1;
    quantityInput.value = quantity;
    const totalPrice = currentProduct.price * quantity;
    document.getElementById('totalPriceDisplay').textContent = totalPrice;
    const finalTitle = `${currentProduct.title} (x${quantity})`;
    document.getElementById('vodafone_product_price').value = totalPrice;
    document.getElementById('paypal_product_price').value = totalPrice;
    document.getElementById('vodafone_product_name').value = finalTitle;
    document.getElementById('paypal_product_name').value = finalTitle;
}

function openPaymentModal(productId) {
    currentProduct = productsData[productId];
    const modal = document.getElementById('paymentModal');
    modal.classList.toggle('valorant-modal', productId.startsWith('valorant'));
    document.getElementById('modalImage').src = currentProduct.image;
    document.getElementById('modalTitle').textContent = currentProduct.title;

    const infoContainer = document.getElementById('modalProductInfo');
    infoContainer.innerHTML = '';
    let platformHTML = '';
    if (currentProduct.platform) {
        const platforms = { steam: { name: 'Steam', icon: 'steam.png' }, microsoft: { name: 'Microsoft', icon: 'microsoft.png' }, riot: { name: 'Riot Games', icon: 'riotgames.png' } };
        if (platforms[currentProduct.platform]) {
            platformHTML = `<div class="platform-display"><span>المنصة:&nbsp;</span><strong>${platforms[currentProduct.platform].name}</strong><img src="./images/${platforms[currentProduct.platform].icon}" alt="${platforms[currentProduct.platform].name} Logo"></div>`;
        }
    }
    const descriptionHTML = currentProduct.shortDescription ? `<div class="description-display">${currentProduct.shortDescription}</div>` : '';
    if (platformHTML || descriptionHTML) infoContainer.innerHTML = platformHTML + descriptionHTML;

    const riotIdElements = [document.getElementById('riotIdLabel'), document.getElementById('riotIdInput')];
    riotIdElements.forEach(el => el.style.display = currentProduct.id.startsWith('valorant') ? 'block' : 'none');
    document.getElementById('riotIdInput').required = currentProduct.id.startsWith('valorant');

    const priceDisplay = document.getElementById('modalPrice'), subLabel = document.getElementById('subscriptionLabel'), subSelect = document.getElementById('subscriptionPeriod'), qtySelector = document.getElementById('steamProductQuantitySelector'), actionBtn = document.getElementById('modal-action-button');
    [subLabel, subSelect, qtySelector].forEach(el => el.style.display = 'none');
    priceDisplay.style.display = 'block';

    if (currentProduct.options) {
        actionBtn.textContent = 'اذهب للدفع';
        actionBtn.onclick = goToPaymentDetails;
        subLabel.style.display = 'block';
        subSelect.style.display = 'block';
        subSelect.innerHTML = Object.keys(currentProduct.options).map(key => `<option value="${key}">${currentProduct.options[key].title} (${currentProduct.options[key].price} ج.م)</option>`).join('');
        priceDisplay.style.display = 'none';
        subSelect.value = Object.keys(currentProduct.options)[0];
        updateModalPriceForSubscription();
    } else {
        actionBtn.textContent = 'اذهب للدفع';
        actionBtn.onclick = goToPaymentDetails;
        priceDisplay.textContent = `السعر: ${currentProduct.price} ج.م`;
        ['vodafone', 'paypal'].forEach(p => {
            document.getElementById(`${p}_product_name`).value = currentProduct.title;
            document.getElementById(`${p}_product_price`).value = currentProduct.price;
        });
    }

    const steamUrl = document.getElementById('steamProfileUrl');
    const needsSteamUrl = currentProduct.id.startsWith('steam') && !currentProduct.id.startsWith('steamGift');
    if (steamUrl) {
        steamUrl.style.display = needsSteamUrl ? 'block' : 'none';
        steamUrl.required = needsSteamUrl;
    }
    document.getElementById('vodafoneForm').reset();
    document.getElementById('paypalForm').reset();
    document.querySelectorAll('.modal-content-section').forEach(s => s.classList.remove('is-visible'));
    document.getElementById('modalCommonContent').classList.add('is-visible');
    showModal('paymentModal');
}

function updateModalPriceForSubscription() {
    const period = document.getElementById('subscriptionPeriod').value;
    const selectedOption = currentProduct.options[period];
    const { price, title } = selectedOption;
    const fullTitle = `${currentProduct.title} (${title})`;
    document.getElementById('modalPrice').textContent = `السعر: ${price} ج.م`;
    ['vodafone', 'paypal'].forEach(p => {
        document.getElementById(`${p}_product_price`).value = price;
        document.getElementById(`${p}_product_name`).value = fullTitle;
    });
}

function startPaymentTimer(duration, display, form) {
    clearInterval(paymentTimerInterval);
    let timer = duration;
    const submitButton = form.querySelector('button[type="submit"]');
    paymentTimerInterval = setInterval(() => {
        let minutes = parseInt(timer / 60, 10).toString().padStart(2, '0');
        let seconds = parseInt(timer % 60, 10).toString().padStart(2, '0');
        display.textContent = `${minutes}:${seconds}`;
        display.classList.remove('expired');
        if (--timer < 0) {
            clearInterval(paymentTimerInterval);
            display.textContent = "انتهت المهلة";
            display.classList.add('expired');
            if (submitButton) submitButton.disabled = true;
        }
    }, 1000);
}

function goToPaymentDetails() {
    const riotIdInput = document.getElementById('riotIdInput');
    if (currentProduct.id.startsWith('valorant') && (!riotIdInput.value || !riotIdInput.value.includes('#'))) {
        alert('الرجاء إدخال Riot ID بشكل صحيح، يجب أن يحتوي على #. مثال: Name#Tag');
        return;
    }
    const method = document.getElementById('modalPaymentMethod').value;
    document.getElementById('modalCommonContent').classList.remove('is-visible');
    const detailsSection = document.getElementById(`${method}Details`);
    const finalPrice = document.getElementById(`${method}_product_price`).value;
    document.getElementById(`${method}TotalAmount`).textContent = `${finalPrice} ج.م`;
    document.getElementById(`${method}_riot_id`).value = riotIdInput.value;
    detailsSection.classList.add('is-visible');
    const form = detailsSection.querySelector('form');
    form.querySelector('button[type="submit"]').disabled = false;
    startPaymentTimer(3600, document.getElementById(`${method}Timer`), form);
}

let allComments = [];
const commentsPerPage = 3;
let commentsLoaded = 0;

function generateStarsHTML(rating) {
    let starsHTML = '';
    for (let i = 1; i <= 5; i++) starsHTML += `<span class="star ${i <= rating ? 'filled' : ''}">&#9733;</span>`;
    return `<div class="comment-rating">${starsHTML}</div>`;
}

function markHelpful(event, productId, commentIndex) {
    const comments = JSON.parse(localStorage.getItem(`comments_${productId}`)) || [];
    if (comments[commentIndex]) {
        comments[commentIndex].helpfulCount = (comments[commentIndex].helpfulCount || 0) + 1;
        localStorage.setItem(`comments_${productId}`, JSON.stringify(comments));
        const button = event.target;
        button.nextElementSibling.textContent = `(${comments[commentIndex].helpfulCount})`;
        button.disabled = true;
    }
}

function loadComments(productId) {
    const commentsContainer = document.getElementById('commentList');
    const loadMoreBtn = document.getElementById('loadMoreComments');
    allComments = JSON.parse(localStorage.getItem(`comments_${productId}`)) || [];
    allComments.sort((a, b) => new Date(b.date) - new Date(a.date));
    commentsContainer.innerHTML = '';
    commentsLoaded = 0;
    if (allComments.length === 0) {
        commentsContainer.innerHTML = `<p style="text-align: center; color: #ccc;">لا توجد تعليقات حتى الآن. كن أول من يعلق!</p>`;
        loadMoreBtn.style.display = 'none';
    } else {
        renderMoreComments();
        loadMoreBtn.style.display = allComments.length > commentsPerPage ? 'block' : 'none';
    }
    loadMoreBtn.onclick = renderMoreComments;
}

function renderMoreComments() {
    const commentsContainer = document.getElementById('commentList');
    const loadMoreBtn = document.getElementById('loadMoreComments');
    const startIndex = commentsLoaded;
    const commentsToLoad = allComments.slice(startIndex, startIndex + commentsPerPage);
    commentsToLoad.forEach((comment, index) => {
        const absoluteIndex = startIndex + index;
        const commentItem = document.createElement('div');
        commentItem.className = 'comment-card';
        commentItem.innerHTML = `
            <div class="comment-card-header">
                <span class="comment-author">${comment.name}</span>
                ${generateStarsHTML(comment.rating || 0)}
            </div>
            <p class="comment-text">${comment.text}</p>
            <div class="comment-footer">
                <span>هل كان هذا التقييم مفيداً؟</span>
                <button class="helpful-btn" onclick="markHelpful(event, '${currentProduct.id}', ${absoluteIndex})">نعم</button>
                <span>(${(comment.helpfulCount || 0)})</span>
            </div>`;
        commentsContainer.appendChild(commentItem);
    });
    commentsLoaded += commentsToLoad.length;
    if (commentsLoaded >= allComments.length) loadMoreBtn.style.display = 'none';
}

function submitComment(event) {
    event.preventDefault();
    const name = document.getElementById('commentName').value, text = document.getElementById('commentText').value, rating = document.getElementById('commentRating').value, productId = currentProduct.id;
    if (!name || parseInt(rating) === 0) {
        alert(!name ? 'الرجاء إدخال اسمك.' : 'الرجاء إضافة تقييم للمنتج.');
        return;
    }
    const newComment = { name, text: text || " ", rating: parseInt(rating), date: new Date().toISOString(), helpfulCount: 0 };
    const comments = JSON.parse(localStorage.getItem(`comments_${productId}`)) || [];
    comments.unshift(newComment);
    localStorage.setItem(`comments_${productId}`, JSON.stringify(comments));
    event.target.reset();
    document.getElementById('ratingStars').dataset.rating = '0';
    loadComments(productId);
    updateProductPageAverageRating(productId);
}

function updateProductPageAverageRating(productId) {
    const ratingContainer = document.getElementById('productPageAverageRating');
    if (!ratingContainer) return;
    const comments = JSON.parse(localStorage.getItem(`comments_${productId}`)) || [];
    if (comments.length === 0) {
        ratingContainer.innerHTML = `<span class="rating-summary">لا توجد تقييمات بعد.</span>`;
        return;
    }
    const averageRating = comments.reduce((sum, c) => sum + (c.rating || 0), 0) / comments.length;
    const roundedAverage = Math.round(averageRating);
    let starsHTML = '';
    for (let i = 1; i <= 5; i++) starsHTML += `<span class="star ${i <= roundedAverage ? '' : 'empty'}">&#9733;</span>`;
    ratingContainer.innerHTML = `<div class="stars">${starsHTML}</div><span class="rating-summary">${averageRating.toFixed(1)} من 5 (${comments.length} تقييم)</span>`;
}

function updateCartCount() {
    document.getElementById('cart-count').textContent = Object.values(cart).reduce((total, item) => total + item.quantity, 0);
}

function applyDiscount() {
    const code = document.getElementById('discountCodeInput').value.toUpperCase();
    const messageEl = document.getElementById('discountMessage');
    if (discountCodes[code]) {
        appliedDiscount = { code, percentage: discountCodes[code].percentage };
        messageEl.textContent = `تم تطبيق خصم ${appliedDiscount.percentage}% بنجاح!`;
        messageEl.className = 'discount-message success';
    } else {
        appliedDiscount = null;
        messageEl.textContent = 'كود الخصم غير صالح أو منتهي الصلاحية.';
        messageEl.className = 'discount-message error';
    }
    renderCart();
}

function renderCart() {
    const cartItemsContainer = document.getElementById('cartItemsContainer');
    const cartTotalContainer = document.getElementById('cartTotalContainer');
    cartItemsContainer.innerHTML = '';
    let total = 0;
    if (Object.keys(cart).length === 0) {
        cartItemsContainer.innerHTML = `<p style="text-align: center; color: #ccc;">سلتك فارغة.</p>`;
        appliedDiscount = null;
        document.getElementById('discountMessage').textContent = '';
    } else {
        for (const productId in cart) {
            const item = cart[productId];
            const itemElement = document.createElement('div');
            itemElement.className = 'cart-modal-item';
            itemElement.innerHTML = `
                <img src="${item.image}" alt="${item.title}">
                <div class="item-details"><h4>${item.title}</h4><p>${item.price} ج.م</p></div>
                <div class="quantity-controls">
                    <button onclick="changeQuantity('${productId}', -1)">-</button>
                    <span>${item.quantity}</span>
                    <button onclick="changeQuantity('${productId}', 1)">+</button>
                </div>
                <button class="remove-btn" onclick="removeFromCart('${productId}')">&times;</button>`;
            cartItemsContainer.appendChild(itemElement);
            total += item.price * item.quantity;
        }
    }
    if (appliedDiscount && total > 0) {
        const discountAmount = total * (appliedDiscount.percentage / 100);
        const discountedTotal = total - discountAmount;
        cartTotalContainer.innerHTML = `الإجمالي: <span class="original-price">${total.toFixed(2)} ج.م</span><span id="cartTotalPrice">${discountedTotal.toFixed(2)}</span> ج.م`;
    } else {
        cartTotalContainer.innerHTML = `الإجمالي: <span id="cartTotalPrice">${total.toFixed(2)}</span> ج.م`;
    }
}

function changeQuantity(productId, change) {
    if (cart[productId]) {
        cart[productId].quantity += change;
        if (cart[productId].quantity <= 0) delete cart[productId];
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartCount();
        renderCart();
    }
}

function removeFromCart(productId) {
    if (cart[productId]) {
        delete cart[productId];
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartCount();
        renderCart();
    }
}

function goToCheckout() {
    if (Object.keys(cart).length === 0) {
        alert('سلة التسوق فارغة!');
        return;
    }
    closeModal('cartModal');
    showModal('checkoutModal');
    renderCheckoutPaymentOptions();
}

function renderCheckoutPaymentOptions() {
    const container = document.getElementById('checkoutPaymentOptionsContainer');
    container.innerHTML = '';
    let total = Object.values(cart).reduce((sum, item) => sum + (item.price * item.quantity), 0);
    if (appliedDiscount) total -= total * (appliedDiscount.percentage / 100);
    ['vodafone', 'paypal'].forEach(method => {
        const card = document.createElement('div');
        card.className = 'payment-method-card';
        card.onclick = () => showPaymentDetails(method, total);
        card.innerHTML = `<h3><img src="./images/${method === 'vodafone' ? 'vf-cash' : 'paypal'}.png" alt="${method} Logo">${method === 'vodafone' ? 'فودافون كاش' : 'بايبال'}</h3><p>الدفع عبر ${method === 'vodafone' ? 'محفظة فودافون كاش' : 'حساب بايبال'}</p>`;
        container.appendChild(card);
    });
}

function showPaymentDetails(method, total) {
    closeModal('checkoutModal');
    showModal('paymentModal');
    const allSections = document.getElementById('paymentModal').querySelectorAll('.modal-content-section');
    allSections.forEach(section => section.classList.remove('is-visible'));
    const detailsSection = document.getElementById(`${method}Details`);
    if (detailsSection) {
        detailsSection.classList.add('is-visible');
        const form = detailsSection.querySelector('form');
        const productSummary = Object.values(cart).map(item => `${item.title} (x${item.quantity})`).join(', ');
        form.querySelector('input[name="product"]').value = productSummary;
        form.querySelector('input[name="price"]').value = total.toFixed(2);
        const totalAmountText = `${total.toFixed(2)} ج.م`;
        const timerDisplay = detailsSection.querySelector('.payment-timer-value');
        const totalAmountSpan = detailsSection.querySelector('.payment-total-amount-value');
        totalAmountSpan.textContent = totalAmountText;
        form.querySelector('button[type="submit"]').disabled = false;
        startPaymentTimer(3600, timerDisplay, form);
        const steamProfileInput = form.querySelector('#steamProfileUrl');
        const needsSteamProfileInCart = Object.keys(cart).some(id => id.startsWith('steam') && !id.startsWith('steamGift'));
        if (steamProfileInput) {
            steamProfileInput.style.display = needsSteamProfileInCart ? 'block' : 'none';
            steamProfileInput.required = needsSteamProfileInCart;
        }
    }
}

function submitFeedback() {
    const name = document.getElementById('feedback-name').value;
    const feedbackText = document.getElementById('feedback-text').value;
    const messageElement = document.getElementById('feedback-message');
    if (!feedbackText.trim()) {
        messageElement.textContent = "من فضلك اكتب ملاحظاتك قبل الإرسال.";
        messageElement.style.color = 'red';
        return;
    }
    const formData = new FormData();
    formData.append('name', name || 'غير محدد');
    formData.append('feedback', feedbackText);
    fetch(formspreeEndpoints.feedback, {
        method: 'POST',
        body: formData,
        headers: { 'Accept': 'application/json' }
    })
        .then(response => {
            if (response.ok) {
                messageElement.textContent = "شكراً لمشاركتك! تم إرسال ملاحظاتك بنجاح.";
                messageElement.style.color = '#00ff00';
                document.getElementById('feedback-name').value = '';
                document.getElementById('feedback-text').value = '';
            } else {
                response.json().then(data => {
                    messageElement.textContent = data.errors ? data.errors.map(error => error.message).join(", ") : "حدث خطأ ما. يرجى المحاولة مرة أخرى.";
                });
                messageElement.style.color = 'red';
            }
        })
        .catch(() => {
            messageElement.textContent = "حدث خطأ في الاتصال. يرجى التحقق من اتصالك بالإنترنت.";
            messageElement.style.color = 'red';
        });
}