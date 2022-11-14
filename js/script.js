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
  console.log(mySlider);

  const DATA_URL = 'https://main-shop-fake-server.herokuapp.com/db';
  const data = await fetchJson(DATA_URL);
  //console.table(data);


})();
