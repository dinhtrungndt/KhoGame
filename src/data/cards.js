import attack from '../assets/meono/coban/Attack-Bear-o-Dactyl.jpg';
import beardCat from '../assets/meono/coban/Beard-Cat.jpg';
import defuse from '../assets/meono/coban/Defuse-Via-3AM-Flatulence.jpg';
import explodingKitten from '../assets/meono/coban/Exploding-Kitten-Alien.jpg';
import favor from '../assets/meono/coban/Favor-Fall-So-Deeply-in-Love.jpg';
import nope from '../assets/meono/coban/Nope-A-Jackanope-Bounds-into-the-Room.jpg';
import seeTheFuture from '../assets/meono/coban/See-the-Future-Ask-the-All-Seeing-Goat-Wizard.jpg';
import shuffle from '../assets/meono/coban/Shuffle-A-Kraken-Emerges-and-Hes-Super-Upset.jpg';
import skip from '../assets/meono/coban/Skip-Commandeer-a-Bunnyraptor.jpg';
import cattermelon from '../assets/meono/coban/Cattermelon.jpg';
import hairypotato from '../assets/meono/coban/Hairy-Potato-Cat.jpg';
import tacocat from '../assets/meono/coban/Tacocat.jpg';
import rainbowCat from '../assets/meono/coban/Rainbow-Ralphing-Cat.jpg';

export const cards = {
  attack: { name: 'Attack', image: attack, category: 'action' },
  beardCat: { name: 'Beard Cat', image: beardCat, category: 'cat' },
  defuse: { name: 'Defuse', image: defuse, category: 'action' },
  explodingKitten: { name: 'Exploding Kitten', image: explodingKitten, category: 'hazard' },
  favor: { name: 'Favor', image: favor, category: 'action' },
  nope: { name: 'Nope', image: nope, category: 'action' },
  seeTheFuture: { name: 'See the Future', image: seeTheFuture, category: 'action' },
  shuffle: { name: 'Shuffle', image: shuffle, category: 'action' },
  skip: { name: 'Skip', image: skip, category: 'action' },
  cattermelon: { name: 'Cattermelon', image: cattermelon, category: 'cat' },
  hairyPotato: { name: 'Hairy Potato Cat', image: hairypotato, category: 'cat' },
  tacocat: { name: 'Tacocat', image: tacocat, category: 'cat' },
  rainbowCat: { name: 'Rainbow Ralphing Cat', image: rainbowCat, category: 'cat' },
};

export const demoHand = [
  cards.seeTheFuture,
  cards.beardCat,
  cards.shuffle,
  cards.favor,
  cards.tacocat,
  cards.skip,
];

