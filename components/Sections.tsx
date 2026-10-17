import Image from 'next/image';
import { CAPACITY } from '@/lib/layouts';
import { SERVICES, TARIFFS } from '@/lib/pricing';
import { LogoFull } from './Logo';

export function About() {
  return (
    <section className="block" id="about">
      <div className="wrap about">
        <div className="about-text">
          <div className="eyebrow">Об АРКА 123</div>
          <h2>Пространство, куда приятно приглашать</h2>
          <p className="lead">АРКА 123 — зал для мастер-классов, тренингов и семинаров в доме на Мстиславца, 10. Два высоких дома соединены аркой, и через неё с променада видна Национальная библиотека. Из наших окон — тоже.</p>
          <p className="muted">Вы приходите к готовому залу: мебель расставлена, проектор настроен, кофе-зона работает. Администратор встретит гостей и поможет с техникой.</p>
          <div className="facts">
            <div><b>123 м²</b><span>площадь зала</span></div>
            <div><b>4,5 м</b><span>высота потолка</span></div>
            <div><b>4 × 3,5</b><span>метра — каждое из двух окон</span></div>
            <div><b>{CAPACITY.lecture}</b><span>места в формате «лекция»</span></div>
          </div>
        </div>
        <div className="arch-photo">
          <Image src="/img/window-library.webp" alt="Арочное окно зала с видом на Национальную библиотеку" fill sizes="(max-width: 900px) 100vw, 45vw" />
          <span className="tag">вид из окна зала</span>
        </div>
      </div>
    </section>
  );
}

export function Prices() {
  return (
    <section className="block" id="prices">
      <div className="wrap">
        <div className="head">
          <div className="eyebrow">Тарифы и услуги</div>
          <h2>Платите за время, а не за лишние метры</h2>
          <p className="lead">В каждый тариф входят мебель, расстановка, Wi-Fi, кухня-зона и помощь администратора.</p>
        </div>
        <div className="tariffs">
          {TARIFFS.map(t => (
            <article key={t.id} className={`tariff${'featured' in t && t.featured ? ' featured' : ''}`}>
              <h3>{t.title}</h3>
              <div className="price">{t.price}<small>{t.unit}</small></div>
              <p className="muted">{t.note}</p>
              <ul>{t.perks.map(p => <li key={p}>{p}</li>)}</ul>
            </article>
          ))}
        </div>
        <div className="services">
          {SERVICES.map(s => (
            <div className="svc" key={s.title}><b>{s.title}</b><span className="p">{s.price}</span><small>{s.note}</small></div>
          ))}
        </div>
      </div>
    </section>
  );
}

const REVIEWS = [
  { text: '«Проводили мастер-класс по керамической росписи. Свет из окон такой, что фото работ не пришлось обрабатывать.»', name: 'Ольга', role: 'студия керамики' },
  { text: '«Собрали митап на 70 человек. Проектор и микрофоны уже стояли, когда мы пришли. Гости фотографировались у окон с Библиотекой.»', name: 'Дмитрий', role: 'организатор IT-митапов' },
  { text: '«Беру зал каждую среду под тренинги. Высокий потолок — не душно даже на четырёхчасовых занятиях.»', name: 'Анастасия', role: 'тренер по публичным выступлениям' },
];

export function Reviews() {
  return (
    <section className="block" id="reviews" style={{ paddingTop: 0 }}>
      <div className="wrap">
        <div className="head">
          <div className="eyebrow">Отзывы</div>
          <h2>Что говорят организаторы</h2>
        </div>
        <div className="reviews">
          {REVIEWS.map(r => (
            <figure className="review" key={r.name}>
              <blockquote>{r.text}</blockquote>
              <figcaption><b>{r.name}</b><span>{r.role}</span></figcaption>
            </figure>
          ))}
        </div>
        <p className="demo-note">Отзывы-примеры для демонстрационного сайта.</p>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer>
      <div className="wrap cols">
        <LogoFull className="full" />
        <div className="small">
          Минск, ул. Мстиславца, 10 · ежедневно 8:00–23:00<br />
          Демонстрационный сайт, выполненный как тестовое задание. Компания вымышленная; контакты, цены и отзывы — примеры.
        </div>
      </div>
    </footer>
  );
}
