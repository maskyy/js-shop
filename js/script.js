'use strict';
(async () => {
  const fetchJson = async url => {
      const response = await fetch(url);
      const data = await response.json();
      return data;
  }

  const initMap = () => {
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);
  }

  const updateItem = (selector, text) => {
    popup.querySelector(selector).textContent = text;
  }

  const updateMap = ({coordinates}, address) => {
    map.setView(coordinates, 15);
    mapMarker = L.marker(coordinates).addTo(map);
    mapMarker.bindPopup(address);
  }

  const updateSellerIcon = rating => {
    const seller = popup.querySelector('.seller');
    const levels = {
      good: 'seller--good',
      bad: 'seller--bad',
    };
    Object.values(levels).forEach(x => seller.classList.remove(x));
    if (rating >= 4.8) {
      seller.classList.add(levels.good);
    } else if (rating < 4) {
      seller.classList.add(levels.bad);
    }
  }

  const updateGallery = ({photos}) => {
    console.log(photos);
  }

  const updateChars = ({filters}) => {
    console.log(filters);
  }

  const updatePopup = product => {
    updateItem('.popup__date', formatDate(product['publish-date']));
    updateItem('.popup__title', product.name);
    updateItem('.popup__price', formatPrice(product.price));
    updateItem('.popup__description > p', product.description);
    const addr = Object.values(product.address).join(', ');
    updateItem('.popup__address', addr);
    updateMap(product, addr);

    updateItem('.seller__name', product.seller.fullname);
    updateItem('.seller__rating > span', RATING_FORMAT.format(product.seller.rating));
    updateSellerIcon(product.seller.rating);

    updateGallery(product);
    updateChars(product);
  }

  const openPopup = (e, index) => {
    e.preventDefault();

    updatePopup(products[index]);
    popup.classList.add('popup--active');
  }

  const closePopup = e => {
    mapMarker.remove();
    popup.classList.remove('popup--active');
  }

  const mySlider = new rSlider({
    target: '#sampleSlider',
    values: {min: 10000, max: 1000000},
    range: true,
    tooltip: true,
    scale: true,
    labels: false,
    step: 10000
  });

  const DATA_URL = 'https://main-shop-fake-server.herokuapp.com/db';
  const MAX_PHOTOS = 5;
  const CURRENCY_FORMAT = new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0
  });
  const RATING_FORMAT = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  });
  const DATE_FORMAT = new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'long'
  });

  const products = (await fetchJson(DATA_URL)).products;
  const resultsList = document.querySelector('.results__list');
  const favTemplate = document.getElementById('fav-button').content.children[0];
  const map = L.map('map');
  let mapMarker;

  const popup = document.querySelector('.popup');
  const popupClose = popup.querySelector('.popup__close');

  const makeElement = (tag, className, text) => {
    const el = document.createElement(tag);
    if (className) {
      el.className = className;
    }
    if (text) {
      el.textContent = text;
    }
    return el;
  }

  const setAttributes = (el, attributes) => {
    for (const k in attributes) {
        el.setAttribute(k, attributes[k]);
    }
  }

  const getPlural = (number, one, two, many) => {
    number = Math.floor(number);
    const mod10 = number % 10, mod100 = number % 100;

    if ((mod100 >= 11 && mod100 <= 20) || mod10 > 5) {
      return many;
    }
    if (mod10 === 1) {
      return one;
    }
    if (mod10 >= 2 && mod10 <= 4) {
      return two;
    }

    return many;
  }

  const createFavButton = () => {
    const fav = favTemplate.cloneNode(true);
    fav.addEventListener('click', onFavClick);
    return fav;
  }

  const onFavClick = e => {
    e.preventDefault();

    console.log('aaa');
  }

  const addImage = (name, photo) => {
    const img = makeElement('img', 'hidden');
    setAttributes(img, {
      src: photo,
      alt: name,
    });

    return img;
  }

  const onNavItemOver = (e, active, photos, len) => {
    e.preventDefault();

    photos.slice(0, len).forEach(p => p.classList.add('hidden'));
    photos[active].classList.remove('hidden');
  }

  const highlightNavItem = e => {
    if (e.target.tagName !== 'SPAN') {
      return;
    }
    const item = e.target;
    Array.from(item.parentNode.children).forEach(el => {
      el.classList.remove('product__navigation-item--active');
    });
    item.classList.add('product__navigation-item--active');
  }

  const addNavigation = photoElements => {
    const navigation = makeElement('div', 'product__image-navigation');
    const photosLen = photoElements.length;

    photoElements.forEach((_, i) => {
      const navItem = makeElement('span', 'product__navigation-item');
      navItem.addEventListener('mouseover', e => onNavItemOver(e, i, photoElements, photosLen));
      navigation.appendChild(navItem);
    });
    navigation.addEventListener('mouseover', highlightNavItem);
    navigation.children[0].classList.add('product__navigation-item--active');

    return navigation;
  }

  const addImageElements = ({name, photos}) => {
    const result = [];
    photos.slice(0, MAX_PHOTOS).forEach(p => result.push(addImage(name, p)));
    result[0].classList.remove('hidden');

    if (photos.length > 1) {
      result.push(addNavigation(result));
    }
    if (photos.length > MAX_PHOTOS) {
      const morePhotos = makeElement('div', 'product__image-more-photo hidden', `+${photos.length - MAX_PHOTOS} фото`);
      const navigation = result.at(-1);
      const navItems = Array.from(navigation.children);
      navItems.slice(0, navItems.length - 1).forEach(item => {
        item.addEventListener('mouseover', () => morePhotos.classList.add('hidden'));
      })
      navItems.at(-1).addEventListener('mouseover', () => morePhotos.classList.remove('hidden'));

      result.push(morePhotos);
    }

    return result;
  }

  const formatPrice = price => CURRENCY_FORMAT.format(price);

  const formatAddress = address => {
    let result = address.city;
    if (address.street) {
      result += ', ' + address.street;
    }
    return result;
  }

  const formatDate = timestamp => {
    const dayDiff = (Date.now() - timestamp) / (24 * 60 * 60 * 1000);
    if (dayDiff < 1) {
      const hours = Math.floor(dayDiff / 24);
      return `${hours} ${getPlural(hours, 'час', 'часа', 'часов')} назад`;
    }
    if (dayDiff < 7) {
      const days = Math.floor(dayDiff);
      return `${days} ${getPlural(days, 'день', 'дня', 'дней')} назад`;
    }
    let fullDate = DATE_FORMAT.format(timestamp).slice(0, -3);
    if (fullDate.endsWith(new Date().getFullYear())) {
      fullDate = fullDate.slice(0, -5);
    }
    return fullDate;
  }

  const addContentElements = ({name, price, address}, date) => {
    const result = [];
    result.push(makeElement('h3', 'product__title'));
    const title = makeElement('a', '', name);
    title.href = '#';
    result[0].appendChild(title);

    const data = [
      ['product__price', formatPrice, price],
      ['product__address', formatAddress, address],
      ['product__date', formatDate, date],
    ];
    data.forEach(item => {
      result.push(makeElement('div', item[0], item[1](item[2])));
    });

    return result;
  }

  const addProduct = (data, index) => {
    const li = makeElement('li', 'results__item product');
  
    const fav = createFavButton();
  
    const image = makeElement('div', 'product__image');
    addImageElements(data).forEach(el => image.appendChild(el));
    Array.from(image.getElementsByTagName('img')).forEach(el => {
      el.addEventListener('click', e => openPopup(e, index));
    });
    const content = makeElement('div', 'product__content');
    const publish_date = data['publish-date'];
    addContentElements(data, publish_date).forEach(el => content.appendChild(el));
    content.querySelector('h3').addEventListener('click', e => openPopup(e, index));

    [fav, image, content].forEach(el => li.appendChild(el));

    return li;
  }

  const test = () => {
    resultsList.innerHTML = '';
    products.forEach((item, i) => resultsList.appendChild(addProduct(item, i)));
  }

  popupClose.addEventListener('click', closePopup);
  console.log(products);
  test();
  initMap();
})();
