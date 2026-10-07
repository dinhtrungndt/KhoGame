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
  attack: { name: 'Attack', image: attack, category: 'action', description: 'Kết thúc lượt hiện tại mà không rút bài. Người tiếp theo phải thực hiện hai lượt.' },
  beardCat: { name: 'Beard Cat', image: beardCat, category: 'cat', description: 'Lá mèo không có hiệu ứng riêng. Ghép hai lá cùng loại để lấy ngẫu nhiên một lá của người khác.' },
  defuse: { name: 'Defuse', image: defuse, category: 'action', description: 'Dùng ngay khi rút Mèo Nổ để tránh bị loại, rồi bí mật đặt Mèo Nổ trở lại chồng rút.' },
  explodingKitten: { name: 'Exploding Kitten', image: explodingKitten, category: 'hazard', description: 'Nếu rút lá này mà không có Gỡ Bom, bạn bị loại khỏi ván.' },
  favor: { name: 'Favor', image: favor, category: 'action', description: 'Chọn một người chơi. Họ phải tự chọn một lá trên tay để đưa cho bạn.' },
  nope: { name: 'Nope', image: nope, category: 'action', description: 'Chặn một hành động vừa được chơi. Có thể dùng để chặn Nope khác.' },
  seeTheFuture: { name: 'See the Future', image: seeTheFuture, category: 'action', description: 'Bí mật xem ba lá trên cùng của chồng rút rồi đặt lại đúng thứ tự.' },
  shuffle: { name: 'Shuffle', image: shuffle, category: 'action', description: 'Xào lại chồng bài rút.' },
  skip: { name: 'Skip', image: skip, category: 'action', description: 'Kết thúc lượt của bạn mà không rút bài. Khi chịu Attack, một Skip chỉ bỏ một lượt.' },
  cattermelon: { name: 'Cattermelon', image: cattermelon, category: 'cat', description: 'Lá mèo không có hiệu ứng riêng. Ghép hai lá cùng loại để lấy ngẫu nhiên một lá của người khác.' },
  hairyPotato: { name: 'Hairy Potato Cat', image: hairypotato, category: 'cat', description: 'Lá mèo không có hiệu ứng riêng. Ghép hai lá cùng loại để lấy ngẫu nhiên một lá của người khác.' },
  tacocat: { name: 'Tacocat', image: tacocat, category: 'cat', description: 'Lá mèo không có hiệu ứng riêng. Ghép hai lá cùng loại để lấy ngẫu nhiên một lá của người khác.' },
  rainbowCat: { name: 'Rainbow Ralphing Cat', image: rainbowCat, category: 'cat', description: 'Lá mèo không có hiệu ứng riêng. Ghép hai lá cùng loại để lấy ngẫu nhiên một lá của người khác.' },
};

export const demoHand = [
  cards.seeTheFuture,
  cards.beardCat,
  cards.shuffle,
  cards.favor,
  cards.tacocat,
  cards.skip,
];

