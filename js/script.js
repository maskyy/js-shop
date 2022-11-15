'use strict';
(async () => {
  const fetchJson = async url => {
      const response = await fetch(url);
      const data = await response.json();
      return data;
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
  const products = (await fetchJson(DATA_URL)).products;
  //console.log(data);
  const resultsList = document.querySelector('.results__list');
  const favTemplate = document.getElementById('fav-button').content.children[0];
  console.log(favTemplate);

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
      width: 318,
      height: 220
    });
    return img;
  }

  const onNavItemClick = (e, active, photos, len) => {
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
      navItem.addEventListener('click', e => onNavItemClick(e, i, photoElements, photosLen));
      navigation.appendChild(navItem);
    });
    navigation.addEventListener('click', highlightNavItem);
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
        item.addEventListener('click', () => morePhotos.classList.add('hidden'));
      })
      navItems.at(-1).addEventListener('click', () => morePhotos.classList.remove('hidden'));

      result.push(morePhotos);
    }

    return result;
  }

  const addProduct = data => {
    const li = makeElement('li', 'results__item product');
  
    const fav = createFavButton();
  
    const image = makeElement('div', 'product__image');
    addImageElements(data).forEach(el => image.appendChild(el));
    const content = makeElement('div', 'product__content');

    [fav, image, content].forEach(el => li.appendChild(el));

    return li;
  }

  const test = () => {
    resultsList.innerHTML = '';
    products.forEach(item => resultsList.appendChild(addProduct(item)));
  }
  console.log(products);
  test();
})();
