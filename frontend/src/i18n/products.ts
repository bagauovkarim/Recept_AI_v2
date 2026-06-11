type ProductLabels = { ru: string; en: string };

export const PRODUCT_LABELS: Record<string, ProductLabels> = {
    apple: { ru: 'Яблоко', en: 'Apple' },
    asparagus: { ru: 'Спаржа', en: 'Asparagus' },
    aubergine: { ru: 'Баклажан', en: 'Aubergine' },
    banana: { ru: 'Банан', en: 'Banana' },
    basil: { ru: 'Базилик', en: 'Basil' },
    beef: { ru: 'Говядина', en: 'Beef' },
    'bell pepper': { ru: 'Болгарский перец', en: 'Bell pepper' },
    blueberries: { ru: 'Голубика', en: 'Blueberries' },
    broccoli: { ru: 'Брокколи', en: 'Broccoli' },
    cabbage: { ru: 'Капуста', en: 'Cabbage' },
    carrot: { ru: 'Морковь', en: 'Carrot' },
    cauliflower: { ru: 'Цветная капуста', en: 'Cauliflower' },
    celery: { ru: 'Сельдерей', en: 'Celery' },
    cheese: { ru: 'Сыр', en: 'Cheese' },
    cherry: { ru: 'Вишня', en: 'Cherry' },
    chicken: { ru: 'Курица', en: 'Chicken' },
    chillies: { ru: 'Чили', en: 'Chillies' },
    coriander: { ru: 'Кинза', en: 'Coriander' },
    corn: { ru: 'Кукуруза', en: 'Corn' },
    courgettes: { ru: 'Кабачки', en: 'Courgettes' },
    cucumber: { ru: 'Огурец', en: 'Cucumber' },
    dates: { ru: 'Финики', en: 'Dates' },
    dill: { ru: 'Укроп', en: 'Dill' },
    egg: { ru: 'Яйцо', en: 'Egg' },
    fish: { ru: 'Рыба', en: 'Fish' },
    flour: { ru: 'Мука', en: 'Flour' },
    garlic: { ru: 'Чеснок', en: 'Garlic' },
    ginger: { ru: 'Имбирь', en: 'Ginger' },
    'green chilies': { ru: 'Зелёный чили', en: 'Green chilies' },
    'green grapes': { ru: 'Зелёный виноград', en: 'Green grapes' },
    lemon: { ru: 'Лимон', en: 'Lemon' },
    lettuce: { ru: 'Салат', en: 'Lettuce' },
    lime: { ru: 'Лайм', en: 'Lime' },
    mango: { ru: 'Манго', en: 'Mango' },
    mint: { ru: 'Мята', en: 'Mint' },
    mushroom: { ru: 'Грибы', en: 'Mushroom' },
    olive: { ru: 'Оливки', en: 'Olive' },
    onion: { ru: 'Лук', en: 'Onion' },
    orange: { ru: 'Апельсин', en: 'Orange' },
    parsley: { ru: 'Петрушка', en: 'Parsley' },
    peppers: { ru: 'Перец', en: 'Peppers' },
    pomegranate: { ru: 'Гранат', en: 'Pomegranate' },
    potato: { ru: 'Картофель', en: 'Potato' },
    pumpkin: { ru: 'Тыква', en: 'Pumpkin' },
    'red grapes': { ru: 'Красный виноград', en: 'Red grapes' },
    'red onion': { ru: 'Красный лук', en: 'Red onion' },
    rice: { ru: 'Рис', en: 'Rice' },
    shallot: { ru: 'Шалот', en: 'Shallot' },
    spinach: { ru: 'Шпинат', en: 'Spinach' },
    'spring onion': { ru: 'Зелёный лук', en: 'Spring onion' },
    strawberry: { ru: 'Клубника', en: 'Strawberry' },
    'sweet potato': { ru: 'Батат', en: 'Sweet potato' },
    'swiss butter': { ru: 'Сливочное масло', en: 'Swiss butter' },
    'swiss jam': { ru: 'Джем', en: 'Swiss jam' },
    'swiss yoghurt': { ru: 'Йогурт', en: 'Swiss yoghurt' },
    sausage: { ru: 'Сосиски', en: 'Sausage' },
    sugar: { ru: 'Сахар', en: 'Sugar' },
    tomato: { ru: 'Помидор', en: 'Tomato' },
    walnuts: { ru: 'Грецкий орех', en: 'Walnuts' },
    watermelon: { ru: 'Арбуз', en: 'Watermelon' },
    'beans': { ru: 'Фасоль', en: 'Beans' },
    'green beans': { ru: 'Стручковая фасоль', en: 'Green beans' },
};

export function translateProduct(technicalName: string, lang: 'ru' | 'en'): string {
    const entry = PRODUCT_LABELS[technicalName.toLowerCase().trim()];
    if (!entry) {
        return technicalName.charAt(0).toUpperCase() + technicalName.slice(1);
    }
    return entry[lang];
}

const REVERSE_PRODUCT_INDEX: Map<string, string> = (() => {
    const m = new Map<string, string>();
    for (const [techId, labels] of Object.entries(PRODUCT_LABELS)) {
        m.set(techId.toLowerCase(), techId);
        m.set(labels.ru.toLowerCase(), techId);
        m.set(labels.en.toLowerCase(), techId);
    }
    return m;
})();

export function resolveProductId(input: string): string {
    const trimmed = input.trim().toLowerCase();
    return REVERSE_PRODUCT_INDEX.get(trimmed) || trimmed;
}
