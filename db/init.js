const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '..', 'data', 'avito.db');
let db = null;
let wrapper = null;

function persist() {
  if (!db) return;
  try {
    const data = db.export();
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DB_PATH, Buffer.from(data));
  } catch (e) {
    console.error('Ошибка сохранения БД:', e.message);
  }
}

function createWrapper() {
  return {
    prepare(sql) {
      return {
        all(...params) {
          const stmt = db.prepare(sql);
          stmt.bind(params);
          const rows = [];
          while (stmt.step()) rows.push(stmt.getAsObject());
          stmt.free();
          return rows;
        },
        get(...params) {
          const stmt = db.prepare(sql);
          stmt.bind(params);
          const row = stmt.step() ? stmt.getAsObject() : null;
          stmt.free();
          return row;
        },
        run(...params) {
          db.run(sql, params);
          persist();
          const idRes = db.exec('SELECT last_insert_rowid() as id');
          const chRes = db.exec('SELECT changes() as c');
          const lastInsertRowid = idRes.length && idRes[0].values.length ? idRes[0].values[0][0] : 0;
          const changes = chRes.length && chRes[0].values.length ? chRes[0].values[0][0] : 0;
          return { lastInsertRowid, changes };
        },
      };
    },
  };
}

function initSchema() {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL DEFAULT '',
      email TEXT NOT NULL UNIQUE,
      phone TEXT NOT NULL DEFAULT '',
      passwordHash TEXT NOT NULL,
      avatarUrl TEXT NOT NULL DEFAULT '',
      role TEXT NOT NULL DEFAULT 'user',
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      price INTEGER NOT NULL DEFAULT 0,
      category TEXT NOT NULL DEFAULT 'Другое',
      location TEXT NOT NULL DEFAULT 'Не указан',
      image TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      ownerId INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      viewCount INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (ownerId) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS favorites (
      userId INTEGER NOT NULL,
      itemId INTEGER NOT NULL,
      PRIMARY KEY (userId, itemId),
      FOREIGN KEY (userId) REFERENCES users(id),
      FOREIGN KEY (itemId) REFERENCES items(id)
    );

    CREATE TABLE IF NOT EXISTS chats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      itemId INTEGER NOT NULL,
      buyerId INTEGER NOT NULL,
      sellerId INTEGER NOT NULL,
      createdAt TEXT NOT NULL,
      lastMessageAt TEXT,
      FOREIGN KEY (itemId) REFERENCES items(id),
      FOREIGN KEY (buyerId) REFERENCES users(id),
      FOREIGN KEY (sellerId) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chatId INTEGER NOT NULL,
      authorId INTEGER NOT NULL,
      text TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      isRead INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (chatId) REFERENCES chats(id),
      FOREIGN KEY (authorId) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS calls (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      itemId INTEGER NOT NULL,
      callerId INTEGER NOT NULL,
      sellerId INTEGER NOT NULL,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (itemId) REFERENCES items(id),
      FOREIGN KEY (callerId) REFERENCES users(id),
      FOREIGN KEY (sellerId) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_items_owner_status ON items(ownerId, status);
    CREATE INDEX IF NOT EXISTS idx_items_created ON items(createdAt);
    CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(userId);
    CREATE INDEX IF NOT EXISTS idx_messages_chat ON messages(chatId);
  `);
}

const DEFAULT_USER = {
  name: 'Demo Seller',
  email: 'seller@avito.local',
  phone: '+7 900 111-11-11',
  passwordHash: '$2a$10$FQe8zmqM6v5M6He6u3CVLuhBfXh8Vf0IJV4t95I2xqP8fJc8Qn4c6',
  avatarUrl: '',
  role: 'user',
};

const DEFAULT_ITEMS = [
  { title: 'iPhone 13 Pro Max 256GB', price: 85000, category: 'Электроника', location: 'Москва', image: '/img/iphone 13 pro max.png', description: 'Смартфон в отличном состоянии. Полная комплектация: зарядное устройство, кабель, коробка. Батарея держит целый день. Экран без царапин, плёнка с момента покупки. Продажа в связи с переходом на новую модель.', ownerId: 1 },
  { title: '2-комнатная квартира, 54 м²', price: 9900000, category: 'Недвижимость', location: 'Санкт-Петербург', image: 'https://avatars.mds.yandex.net/get-metarealty/15060664/b9033297-1a6e-417a-907e-956529e06a77/XXL_height', description: 'Квартира в жилом комплексе с закрытой территорией. Рядом метро 5 минут пешком. Свежий евроремонт, встроенная кухня, санузел с плиткой. Подходит под ипотеку. Свободная продажа.', ownerId: 1 },
  { title: 'Toyota Camry 2018', price: 2200000, category: 'Авто', location: 'Казань', image: 'https://avatars.mds.yandex.net/get-autoru-vos/6219917/e363facbaedb856f6bb0b735362f0b21/1200x900', description: 'Один владелец по ПТС. Без ДТП, полная сервисная история у официального дилера. Комплектация престиж: кожа, подогревы, камера. Пробег 45 000 км. Торг уместен.', ownerId: 1 },
  { title: 'Настройка и ремонт ноутбуков', price: 1500, category: 'Услуги', location: 'Москва', image: 'https://avatars.mds.yandex.net/i?id=286f784130efdd7acadef16f815b0b18ebf00d90-4698303-images-thumbs&n=13', description: 'Установка Windows, замена термопасты, чистка от пыли, замена матрицы и клавиатуры. Выезд в день обращения. Гарантия на все виды работ. Работаю более 10 лет.', ownerId: 1 },
  { title: 'MacBook Air M1 2020', price: 75000, category: 'Электроника', location: 'Москва', image: 'https://avatars.mds.yandex.net/i?id=296a8968021cad0285dc4c4417e2e29ee9073458-5287703-images-thumbs&n=13', description: 'Ноутбук Apple в идеальном состоянии. 8 ГБ RAM, 256 ГБ SSD. Батарея 95% здоровья. Без царапин, в чехле с первого дня. Зарядка и коробка в наличии.', ownerId: 1 },
  { title: 'Студия 28 м² в новостройке', price: 6200000, category: 'Недвижимость', location: 'Новосибирск', image: 'https://avatars.mds.yandex.net/get-verba/997355/2a0000018856e5aca8db9de23d96182397b9/housearch_thumb_1830x1152', description: 'Студия с отделкой от застройщика. Большие окна, высокие потолки. Раздельная планировка кухни и зоны отдыха. Дом сдан, ключи на руках. Ипотека одобрена.', ownerId: 1 },
  { title: 'Honda Civic 2016', price: 1350000, category: 'Авто', location: 'Екатеринбург', image: 'https://avatars.mds.yandex.net/get-autoru-vos/4364158/b04357751e88b91bd55cda722662cde8/1200x900', description: 'Японская сборка. Два ключа, полная история ТО. Кондиционер, круиз-контроль, мультимедиа. Пробег 78 000 км. Масло и фильтры недавно заменены.', ownerId: 1 },
  { title: 'Клининг квартир и домов', price: 2500, category: 'Услуги', location: 'Санкт-Петербург', image: 'https://avatars.mds.yandex.net/i?id=610d8e84ba112494c9e96dcb4aaa5478_l-5224693-images-thumbs&n=13', description: 'Генеральная и поддерживающая уборка. Своя бытовая химия. Выезд в удобное время. Опыт 5 лет. Отзывы и портфолио пришлю по запросу.', ownerId: 1 },
  { title: 'Наушники Sony WH-1000XM4', price: 18500, category: 'Электроника', location: 'Казань', image: 'https://avatars.mds.yandex.net/i?id=9019597e957ae22e134cc8f35e5007c4_l-5480364-images-thumbs&n=13', description: 'Беспроводные наушники с шумоподавлением. Зарядка до 30 часов. Чехол и кабель в комплекте. Покупались полгода назад, пользуюсь аккуратно.', ownerId: 1 },
  { title: 'Дом 120 м² с участком 6 соток', price: 8500000, category: 'Недвижимость', location: 'Краснодар', image: 'https://avatars.mds.yandex.net/i?id=484d51f8c4ee17d8408b794dec1cc80fd4e6cb3a-10233716-images-thumbs&n=13', description: 'Кирпичный дом в тихом районе. Газ, центральная вода, септик. Три спальни, кухня-гостиная, два санузла. Участок огорожен, есть место под машину.', ownerId: 1 },
  { title: 'Volkswagen Polo 2019', price: 980000, category: 'Авто', location: 'Ростов-на-Дону', image: 'https://avatars.mds.yandex.net/i?id=f1fb7aa5851091242876fffb65cfaf026fbfa996-5175041-images-thumbs&n=13', description: 'Комплектация High. Кондиционер, подогрев зеркал и сидений, парктроники. Один владелец, пробег 52 000 км. Без вложений, всё исправно.', ownerId: 1 },
  { title: 'PlayStation 5 + 2 геймпада', price: 42000, category: 'Электроника', location: 'Самара', image: 'https://10.img.avito.st/image/1/1.vZocz7a4EXMqZtN2aqG26jBuE3WibpN7amsTcaxmGXmq.hCr0BYwqzqF-NeD9FlcEVkohL3Q6HuOvbnbdtJBS-EI', description: 'Консоль с дисководом. В комплекте два DualSense, зарядная станция, диск Spider-Man. Всё в рабочем состоянии, коробки сохранены.', ownerId: 1 },
  { title: '1-комнатная квартира 38 м²', price: 5200000, category: 'Недвижимость', location: 'Нижний Новгород', image: 'https://avatars.mds.yandex.net/i?id=b5374607d95a5746c062e063503d474c9fc779c8-4599933-images-thumbs&n=13', description: 'Удобная планировка, балкон застеклён. Ремонт 2 года назад. Район развитый: школы, садики, магазины рядом. Собственник, документы готовы.', ownerId: 1 },
  { title: 'Kia Rio 2020', price: 1150000, category: 'Авто', location: 'Воронеж', image: 'https://avatars.mds.yandex.net/i?id=526f4d6e5ef681e14461308245e7afe52090deb3-4836432-images-thumbs&n=13', description: 'Комплектация Prestige. Полная комплектация, один владелец. Пробег 34 000 км. Резина летняя и зимняя в подарок. Обмен не рассматриваю.', ownerId: 1 },
  { title: 'Перевозка грузов Газель', price: 1500, category: 'Услуги', location: 'Москва', image: 'https://avatars.mds.yandex.net/i?id=e081140e120fa5e014f3bef758c70da573446ebf-12154353-images-thumbs&n=13', description: 'Грузоперевозки по Москве и области. Газель 4 м, грузчики по желанию. Оплата по факту. Звоните — подъеду в удобное время.', ownerId: 1 },
  { title: 'Видеокарта RTX 3060', price: 22000, category: 'Электроника', location: 'Екатеринбург', image: 'https://avatars.mds.yandex.net/i?id=ffcdc9fcef79548e5ec5225395c1c64357fe3d4a-5231753-images-thumbs&n=13', description: 'Видеокарта в отличном состоянии. Использовалась для игр, майнинга не было. Упаковка и гарантийный талон. Причина продажи — апгрейд.', ownerId: 1 },
  { title: 'Комната 18 м² в 3-комнатной', price: 2800000, category: 'Недвижимость', location: 'Москва', image: 'https://avatars.mds.yandex.net/i?id=7cd7a836baa70347ec680cae64139ade875df39c-9203684-images-thumbs&n=13', description: 'Продаётся комната в трёхкомнатной квартире. Раздельные лицевые счета. Кухня и санузел общие. Район тихий, рядом метро 10 минут.', ownerId: 1 },
  { title: 'Hyundai Solaris 2021', price: 1250000, category: 'Авто', location: 'Краснодар', image: 'https://avatars.mds.yandex.net/i?id=e320e295d3823cd4fc2406fa5f07765f748d65a8-8497452-images-thumbs&n=13', description: 'Комплектация с полным набором опций. Пробег 21 000 км. Один владелец, сервис у дилера. Состояние как новый. Торг при осмотре.', ownerId: 1 },
  { title: 'Фотосессия портретная', price: 3500, category: 'Услуги', location: 'Санкт-Петербург', image: 'https://avatars.mds.yandex.net/i?id=f4b706ed5961aef15914acd634f9dd9582716d93-12420722-images-thumbs&n=13', description: 'Студийная или выездная фотосессия. Обработка 30–50 кадров, срок 5–7 дней. Опыт 8 лет. Примеры работ в профиле. Запись на удобную дату.', ownerId: 1 },
];

function seedIfEmpty() {
  const userCount = wrapper.prepare('SELECT COUNT(*) as c FROM users').get();
  if (userCount && userCount.c === 0) {
    const now = new Date().toISOString();
    wrapper.prepare(
      `INSERT INTO users (name, email, phone, passwordHash, avatarUrl, role, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(DEFAULT_USER.name, DEFAULT_USER.email, DEFAULT_USER.phone, DEFAULT_USER.passwordHash, DEFAULT_USER.avatarUrl, DEFAULT_USER.role, now);
  }

  const itemCount = wrapper.prepare('SELECT COUNT(*) as c FROM items').get();
  if (itemCount && itemCount.c === 0) {
    const now = new Date().toISOString();
    const ins = wrapper.prepare(
      `INSERT INTO items (title, price, category, location, image, description, ownerId, status, viewCount, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'active', 0, ?)`
    );
    for (const row of DEFAULT_ITEMS) {
      ins.run(row.title, row.price, row.category, row.location, row.image, row.description, row.ownerId, now);
    }
  }
}

async function initDb() {
  if (db) return;
  const SQL = await initSqlJs({
    locateFile: (file) => path.join(__dirname, '..', 'node_modules', 'sql.js', 'dist', file),
  });
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (fs.existsSync(DB_PATH)) {
    const buf = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buf);
  } else {
    db = new SQL.Database();
  }
  wrapper = createWrapper();
  initSchema();
  seedIfEmpty();
  persist();
  return db;
}

function getDb() {
  if (!wrapper) throw new Error('БД не инициализирована. Вызовите await initDb() при старте сервера.');
  return wrapper;
}

module.exports = { initDb, getDb };
