import back from './assets/uno/back.png';
import unoLogo from './assets/uno/uno!.png';

const colors = ['blue', 'green', 'red', 'yellow'];

const unoCards = {};

colors.forEach(color => {
  for (let i = 0; i <= 9; i++) {
    unoCards[`${color}_${i}`] = {
      key: `${color}_${i}`,
      color: color,
      type: 'number',
      value: i,
      name: `${color.toUpperCase()} ${i}`,
      image: new URL(`./assets/uno/${color}${i}.png`, import.meta.url).href
    };
  }
  
  unoCards[`${color}_reverse`] = {
    key: `${color}_reverse`,
    color: color,
    type: 'reverse',
    name: `${color.toUpperCase()} Đảo chiều`,
    image: new URL(`./assets/uno/${color}10.png`, import.meta.url).href
  };

  unoCards[`${color}_skip`] = {
    key: `${color}_skip`,
    color: color,
    type: 'skip',
    name: `${color.toUpperCase()} Cấm lượt`,
    image: new URL(`./assets/uno/${color}11.png`, import.meta.url).href
  };

  unoCards[`${color}_draw2`] = {
    key: `${color}_draw2`,
    color: color,
    type: 'draw2',
    name: `${color.toUpperCase()} +2`,
    image: new URL(`./assets/uno/${color}12.png`, import.meta.url).href
  };
});

unoCards['wild'] = {
  key: 'wild',
  color: 'black',
  type: 'wild',
  name: 'Đổi màu',
  image: new URL('./assets/uno/wild13.png', import.meta.url).href
};

unoCards['wild_draw4'] = {
  key: 'wild_draw4',
  color: 'black',
  type: 'wild_draw4',
  name: 'Đổi màu +4',
  image: new URL('./assets/uno/wild14.png', import.meta.url).href
};

export { unoCards, back, unoLogo };
