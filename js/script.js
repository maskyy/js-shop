'use strict';
(async () => {
  const fetchJson = async url => {
      const response = await fetch(url);
      const data = await response.json();
      return data;
  }

  const zip = (...rows) => [...rows[0]].map((_, c) => rows.map(row => row[c]));

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

  const addPopupImage = (alt, src, width, height) => {
    const img = document.createElement('img');
    setAttributes(img, {
      src,
      alt,
      width,
      height,
    });
    return img;
  }

  const selectPopupImage = (e, items, main) => {
    e.preventDefault();

    const img = e.target;
    items.forEach(el => el.classList.remove('gallery__item--active'));
    img.parentNode.classList.add('gallery__item--active');
    main.src = img.src;
  }

  const updateGallery = ({name, photos}) => {
    const mainContainer = popup.querySelector('.gallery__main-pic');
    const gallery = popup.querySelector('.gallery__list');
    mainContainer.innerHTML = gallery.innerHTML = '';

    const mainPic = addPopupImage(name, photos[0], 520, 340);
    mainContainer.appendChild(mainPic);

    let galleryItems = [];
    photos.forEach((p, i) => {
      const li = makeElement('li', 'gallery__item');
      const img = addPopupImage(name, p, 124, 80);
      li.appendChild(img);
      galleryItems.push(li);
    });
    galleryItems[0].classList.add('gallery__item--active');

    galleryItems.forEach(el => {
      el.addEventListener('click', e => selectPopupImage(e, galleryItems, mainPic));
      gallery.appendChild(el);
    });
  }

  const addCharItem = (name, value) => {
    const li = makeElement('li', 'chars__item');
    li.appendChild(makeElement('div', 'chars__name', name));
    li.appendChild(makeElement('div', 'chars__value', value));
    return li;
  }

  const updateChars = ({filters}) => {
    console.log(filters);

    const chars = popup.querySelector('.chars');
    chars.innerHTML = '';
    Object.entries(filters).forEach(([k, v]) => {
      if (v === '-') {
        return;
      }
      const suffix = k in CHARS_SUFFIXES ? CHARS_SUFFIXES[k] : '';
      k = k in CHARS_TYPES ? CHARS_TYPES[k] : k;
      v = (v in CHARS_NAMES ? CHARS_NAMES[v] : v) + suffix;
      chars.appendChild(addCharItem(k, v));
    });
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

  const openPopup = (e, product) => {
    e.preventDefault();

    updatePopup(product);
    popup.classList.add('popup--active');
  }

  const closePopup = e => {
    mapMarker.remove();
    popup.classList.remove('popup--active');
  }

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
  const CHARS_TYPES = {
    // Недвижимость
    type: 'Тип',
    area: 'Площадь',
    'rooms-count': 'Кол-во комнат',

    // Ноутбуки (тип выше)
    'ram-value': 'ОЗУ',
    'screen-size': 'Диагональ',
    'cpu-type': 'Тип ЦП',

    // Фотоаппараты (тип выше)
    'matrix-resolution': 'Разрешение матрицы',
    supporting: 'Разрешение видео',

    // Автомобили
    'production-year': 'Год выпуска',
    transmission: 'Коробка передач',
    'body-type': 'Тип кузова',
  };

  // Значение '-' добавлять не нужно
  const CHARS_NAMES = {
    // Недвижимость
    flat: 'Квартира',
    apartment: 'Апартаменты',
    house: 'Дом',

    // Ноутбуки
    ultrabook: 'Ультрабук',
    home: 'Домашний',
    gaming: 'Игровой',
    i3: 'Intel Core i3',
    i5: 'Intel Core i5',
    i7: 'Intel Core i7',

    // Фотоаппараты
    // Тип
    slr: 'Зеркальный',
    digital: 'Цифровой',
    mirrorless: 'Беззеркальный',
  
    // Разрешение
    hd: 'HD',
    'full-hd': 'Full HD',

    // Автомобили
    // Коробка передач
    auto: 'Автомат',
    mechanic: 'Механика',
    // Тип кузова
    sedan: 'Седан',
    universal: 'Универсал',
    hatchback: 'Хэтчбэк',
    suv: 'Внедорожник',
    coupe: 'Купэ',
  };

  // Единицы измерений
  const CHARS_SUFFIXES = {
    area: ' м<sup>2</sup>',
    'ram-value': ' Гб',
    'screen-size': '<sup>″</sup>',
    'matrix-resolution': ' МП',
  };
  const DEFAULT_COUNT = 7;
  const FILTER_CATEGORIES = ['estate', 'camera', 'laptop', 'car'];
  const CATEGORY_TRANSLATIONS = {
    Недвижимость: 'estate',
    Фотоаппарат: 'camera',
    Ноутбук: 'laptop',
    Автомобиль: 'car',
  };
  const SLIDER_SETTINGS = {
    target: '#range',
    values: {min: 9000, max: 30000000},
    range: true,
    tooltip: true,
    scale: true,
    labels: false,
    step: 10000,
    width: 280,
  };

  // Сравнение разрешений видео
  const SUPPORTING_ORDER = ['hd', 'full-hd', '4K', '5K'];

  const products = (await fetchJson(DATA_URL)).products;
  const resultsList = document.querySelector('.results__list');
  const favTemplate = document.getElementById('fav-button').content.children[0];
  const map = L.map('map');

  const popup = document.querySelector('.popup');
  const popupClose = popup.querySelector('.popup__close');

  const sortingForm = document.querySelector('.sorting__form');
  const filterForm = document.querySelector('.filter__form');
  const categorySelect = document.getElementById('categories');
  const filterSubmit = filterForm.querySelector('.filter__button');
  const categoryElements = FILTER_CATEGORIES.map(c => {
    return filterForm.querySelector('.filter__' + c);
  });

  let mapMarker;
  let slider = new rSlider(SLIDER_SETTINGS);
  // Ключи для фильтрации
  let filters = {category: 'all'};
  let sorting = 'popular';
  let showFavourites = false;

  const makeElement = (tag, className, html) => {
    const el = document.createElement(tag);
    if (className) {
      el.className = className;
    }
    if (html) {
      el.innerHTML = html;
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

  const addProduct = data => {
    const li = makeElement('li', 'results__item product');
  
    const fav = createFavButton();
  
    const image = makeElement('div', 'product__image');
    addImageElements(data).forEach(el => image.appendChild(el));
    Array.from(image.getElementsByTagName('img')).forEach(el => {
      el.addEventListener('click', e => openPopup(e, data));
    });
    const content = makeElement('div', 'product__content');
    const publish_date = data['publish-date'];
    addContentElements(data, publish_date).forEach(el => content.appendChild(el));
    content.querySelector('h3').addEventListener('click', e => openPopup(e, data));

    [fav, image, content].forEach(el => li.appendChild(el));

    return li;
  }

  const showProducts = results => {
    resultsList.innerHTML = '';

    if (results.length === 0) {
      const li = makeElement('li', 'results__item',
        'Мы не нашли товары по вашему запросу. Попробуйте поменять фильтры настройки объявлений в блоке слева');
      resultsList.appendChild(li);
      return;
    }

    results.forEach((r, i) => {
      resultsList.appendChild(addProduct(r, i));
    });
  }

  const onSortingChange = e => {
    e.preventDefault();

    sorting = sortingForm['sorting-order'].value;
    showFavourites = sortingForm.favourites.checked;
    updateProductView();
  }

  const onCategoryChange = e => {
    e.preventDefault();

    const category = categorySelect.value;
    categoryElements.forEach(el => {
      if (el.classList.contains('filter__' + category)) {
        el.classList.remove('hidden');
      } else {
        el.classList.add('hidden');
      }
    });

    filters = {category};
    updateSlider(category);
    updateProductView();
  }

  const getCheckedTypes = types => {
    let result = [];
    for (const t of types) {
      if (filterForm[t].checked) {
        result.push(t);
      }
    }
    return result;
  }

  const addTypeFilter = (types, filters, key = 'type') => {
    const checked_types = getCheckedTypes(types);
    if (checked_types.length > 0) {
      filters[key] = checked_types;
    }
  }

  const addOptionFilter = (name, filters, key = name) => {
    let value = filterForm[name].value;
    if (value && value !== 'any') {
      if (!isNaN(value)) {
        value -= 0;
      }
      filters[key] = value;
    }
  }

  const getFilters = category => {
    const price_range = slider.getValue().split(',').map(x => x - 0);
    let result = Object.fromEntries(zip(['min', 'max'], price_range));
    result.category = category;

    switch (category) {
      case 'estate':
        addTypeFilter(['house', 'flat', 'apartment'], result);
        const area = filterForm.square.value;
        if (area && area > 0) {
          result.area = area - 0;
        }
        addOptionFilter('rooms', result, 'rooms-count');
        break;
      case 'camera':
        addTypeFilter(['slr', 'digital', 'mirrorless'], result);
        addOptionFilter('resolution-matrix', result, 'matrix-resolution');
        addOptionFilter('resolution-video', result, 'supporting');
        break;
      case 'laptop':
        addTypeFilter(['ultrabook', 'home', 'gaming'], result);
        addOptionFilter('ram', result, 'ram-value');
        addOptionFilter('diagonal', result, 'screen-size');
        addTypeFilter(['i3', 'i5', 'i7'], result, 'cpu-type');
        break;
      case 'car':
        addOptionFilter('car_year', result, 'production-year');
        addOptionFilter('transmission', result);
        addTypeFilter(['sedan', 'universal', 'hatchback', 'suv', 'cupe'], result, 'body-type');
        break;
    }

    console.log(result);
    return result;
  }

  const onFilterSubmit = e => {
    e.preventDefault();

    filters = getFilters(filters.category);
    updateProductView();
  }

  const addEvents = () => {
    popupClose.addEventListener('click', closePopup);
    sortingForm.addEventListener('change', onSortingChange);

    categoryElements.forEach(el => el.classList.add('hidden'));
    categorySelect.addEventListener('change', onCategoryChange);
    filterSubmit.addEventListener('click', onFilterSubmit);
  }

  const getProductsByCategory = category => {
    if (category === 'all') {
      return products;
    }
    return products.filter(x => category === CATEGORY_TRANSLATIONS[x.category]);
  }

  const getSliderStep = category => {
    if (category === 'estate' || category === 'car') {
      return 10000;
    }
    return 1000;
  }

  const updateSlider = category => {
    const items = getProductsByCategory(category);
    const prices = items.map(x => x.price);
    const range = {
      min: Math.min.apply(null, prices),
      max: Math.max.apply(null, prices),
    };
    let settings = SLIDER_SETTINGS;
    settings.values = range;
    settings.step = getSliderStep(category);

    slider.destroy();
    slider = new rSlider(settings);
  }

  const checkFilter = (key, value, filters) => {
        // Фильтра на ключ нет
        if (!(key in filters)) {
          return true;
        }

        // Пропущенные данные
        if (value === '-') {
          return false;
        }

        const rule = filters[key];
        // Массив - проверка на вхождение
        if (rule instanceof Array) {
          return rule.includes(value);
        }

        // Проверка одного значения
        switch (key) {
          // Фотоаппарат - минимальное разрешение (HD < Full HD и т.д.)
          case 'supporting':
            return SUPPORTING_ORDER.indexOf(value) >= SUPPORTING_ORDER.indexOf(rule);
          // Проверка чисел
          case 'area':
          case 'ram-value':
          case 'screen-size':
          case 'matrix-resolution':
          case 'production-year':
            return value >= rule;
          // 5+ комнат - принимать 5 и больше, иначе равенство
          case 'rooms-count':
            if (rule === '5+') {
              return value >= 5;
            }
            // fallthrough
          // По умолчанию. Проверка на === с опцией
          default:
            return value === rule;
        }
  }

  const filterProducts = () => {
    const f = filters;
    let data = getProductsByCategory(filters.category);
    let missingData = [];
    data = data.filter(item => {
      let add = true, missing = false;
      if (item.price === 0 || isNaN(item.price)) {
        missing = true;
      }
      if (f.hasOwnProperty('min') && item.price < f.min) {
        add = false;
      }
      if (f.hasOwnProperty('max') && item.price > f.max) {
        add = false;
      }
      for (const [k, v] of Object.entries(item.filters)) {
        if (!checkFilter(k, v, f)) {
          if (v === '-') {
            missing = true;
            continue;
          }
          return false;
        }
      }
      if (!add && missing) {
        missingData.push(item);
      }
      return add;
    });
    return data.concat(missingData);
  }

  const priceSort = (lhs, rhs) => lhs.price > rhs.price ? 1 : -1;
  const dateSort = (lhs, rhs) => lhs['publish-date'] < rhs['publish-date'] ? 1 : -1;

  const updateProductView = () => {
    let result = filterProducts();
    if (sorting === 'cheap') {
      result.sort(priceSort);
    } else if (sorting === 'new') {
      result.sort(dateSort);
    }

    showProducts(result.slice(0, DEFAULT_COUNT));
  }

  const run = () => {
    initMap();
    addEvents();

    updateProductView();
  }

  console.log(products);
  run();
})();
