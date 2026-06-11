import { ImageSourcePropType } from 'react-native';

type DishLabels = {
    ru: string;
    en: string;
    image: ImageSourcePropType;
};

const FALLBACK = require('../../assets/dishes/greek-salad.jpg');

export const DISH_LABELS: Record<string, DishLabels> = {
    'Омлет с овощами':                { ru: 'Омлет с овощами', en: 'Vegetable omelette', image: require('../../assets/dishes/omelette.jpg') },
    'Яичница с помидорами':           { ru: 'Яичница с помидорами', en: 'Tomato fried eggs', image: require('../../assets/dishes/tomato-eggs.jpg') },
    'Окрошка на минералке':           { ru: 'Окрошка на минералке', en: 'Okroshka cold soup', image: require('../../assets/dishes/okroshka.jpg') },
    'Салат «Витаминный»':             { ru: 'Салат «Витаминный»', en: 'Vitamin cabbage-carrot salad', image: require('../../assets/dishes/vitamin-salad.jpg') },
    'Свекольный салат с чесноком':    { ru: 'Свекольный салат с чесноком', en: 'Beetroot garlic salad', image: require('../../assets/dishes/beetroot-salad.jpg') },
    'Тёртая морковь с яблоком':       { ru: 'Тёртая морковь с яблоком', en: 'Carrot apple slaw', image: require('../../assets/dishes/carrot-apple.jpg') },
    'Греческий салат':                { ru: 'Греческий салат', en: 'Greek salad', image: require('../../assets/dishes/greek-salad.jpg') },
    'Салат Капрезе':                  { ru: 'Салат Капрезе', en: 'Caprese salad', image: require('../../assets/dishes/caprese.jpg') },
    'Салат с лососем и шпинатом':     { ru: 'Салат с лососем и шпинатом', en: 'Salmon and spinach salad', image: require('../../assets/dishes/spinach-salad.jpg') },
    'Брускетта с томатами':           { ru: 'Брускетта с томатами', en: 'Tomato bruschetta', image: require('../../assets/dishes/bruschetta.jpg') },
    'Смузи ягодный':                  { ru: 'Смузи ягодный', en: 'Berry smoothie', image: require('../../assets/dishes/berry-smoothie.jpg') },
    'Смузи зелёный':                  { ru: 'Смузи зелёный', en: 'Green smoothie', image: require('../../assets/dishes/green-smoothie.jpg') },
    'Фруктовый салат':                { ru: 'Фруктовый салат', en: 'Fruit salad', image: require('../../assets/dishes/fruit-salad.jpg') },
    'Арбузный салат с фетой':         { ru: 'Арбузный салат с фетой', en: 'Watermelon feta salad', image: require('../../assets/dishes/watermelon-feta.jpg') },
    'Брокколи с чесноком на пару':    { ru: 'Брокколи с чесноком на пару', en: 'Steamed garlic broccoli', image: require('../../assets/dishes/broccoli-garlic.jpg') },
    'Спаржа на гриле':                { ru: 'Спаржа на гриле', en: 'Grilled asparagus', image: require('../../assets/dishes/asparagus-grilled.jpg') },
    'Грибы с луком на сковороде':     { ru: 'Грибы с луком на сковороде', en: 'Pan-fried mushrooms with onion', image: require('../../assets/dishes/mushrooms-onion.jpg') },
    'Жареные кабачки':                { ru: 'Жареные кабачки', en: 'Pan-fried courgettes', image: require('../../assets/dishes/fried-courgettes.jpg') },
    'Бутерброды с сыром и помидором': { ru: 'Бутерброды с сыром и помидором', en: 'Cheese tomato sandwiches', image: require('../../assets/dishes/cheese-tomato-toast.jpg') },
    'Йогурт с ягодами и мёдом':       { ru: 'Йогурт с ягодами и мёдом', en: 'Berry yoghurt parfait', image: require('../../assets/dishes/yoghurt-parfait.jpg') },

    'Борщ':                              { ru: 'Борщ', en: 'Borscht', image: require('../../assets/dishes/borscht.jpg') },
    'Щи из свежей капусты':              { ru: 'Щи из свежей капусты', en: 'Cabbage shchi', image: require('../../assets/dishes/shchi.jpg') },
    'Куриный суп с лапшой':              { ru: 'Куриный суп с лапшой', en: 'Chicken noodle soup', image: require('../../assets/dishes/chicken-noodle.jpg') },
    'Рассольник':                        { ru: 'Рассольник', en: 'Rassolnik pickle soup', image: require('../../assets/dishes/rassolnik.jpg') },
    'Винегрет':                          { ru: 'Винегрет', en: 'Vinegret beet salad', image: require('../../assets/dishes/vinegret.jpg') },
    'Оливье с курицей':                  { ru: 'Оливье с курицей', en: 'Olivier salad with chicken', image: require('../../assets/dishes/olivier.jpg') },
    'Сельдь под шубой':                  { ru: 'Сельдь под шубой', en: 'Herring under fur coat', image: require('../../assets/dishes/herring-fur-coat.jpg') },
    'Голубцы':                           { ru: 'Голубцы', en: 'Stuffed cabbage rolls', image: require('../../assets/dishes/golubtsy.jpg') },
    'Драники с сметаной':                { ru: 'Драники с сметаной', en: 'Potato pancakes with sour cream', image: require('../../assets/dishes/draniki.jpg') },
    'Запеченная курица с картошкой':     { ru: 'Запеченная курица с картошкой', en: 'Roast chicken with potatoes', image: require('../../assets/dishes/roast-chicken.jpg') },
    'Овощное рагу':                      { ru: 'Овощное рагу', en: 'Vegetable stew', image: require('../../assets/dishes/veg-stew.jpg') },
    'Тыквенный крем-суп':                { ru: 'Тыквенный крем-суп', en: 'Pumpkin cream soup', image: require('../../assets/dishes/pumpkin-soup.jpg') },
    'Картофельное пюре с грибами':       { ru: 'Картофельное пюре с грибами', en: 'Mashed potatoes with mushrooms', image: require('../../assets/dishes/mash-mushrooms.jpg') },
    'Шакшука':                           { ru: 'Шакшука', en: 'Shakshuka', image: require('../../assets/dishes/shakshuka.jpg') },
    'Рататуй':                           { ru: 'Рататуй', en: 'Ratatouille', image: require('../../assets/dishes/ratatouille.jpg') },
    'Паста с грибами':                   { ru: 'Паста с грибами', en: 'Mushroom pasta', image: require('../../assets/dishes/mushroom-pasta.jpg') },
    'Паста Помодоро':                    { ru: 'Паста Помодоро', en: 'Pasta pomodoro', image: require('../../assets/dishes/pasta-pomodoro.jpg') },
    'Ризотто с грибами':                 { ru: 'Ризотто с грибами', en: 'Mushroom risotto', image: require('../../assets/dishes/mushroom-risotto.jpg') },
    'Куриный карри':                     { ru: 'Куриный карри', en: 'Chicken curry', image: require('../../assets/dishes/chicken-curry.jpg') },
    'Жареный рис с яйцом':               { ru: 'Жареный рис с яйцом', en: 'Egg fried rice', image: require('../../assets/dishes/egg-fried-rice.jpg') },
    'Минестроне':                        { ru: 'Минестроне', en: 'Minestrone', image: require('../../assets/dishes/minestrone.jpg') },
    'Греческая мусака':                  { ru: 'Греческая мусака', en: 'Greek moussaka', image: require('../../assets/dishes/moussaka.jpg') },
    'Куриный салат с яблоком':           { ru: 'Куриный салат с яблоком', en: 'Chicken apple salad', image: require('../../assets/dishes/chicken-apple.jpg') },
    'Запеканка из цветной капусты':      { ru: 'Запеканка из цветной капусты', en: 'Cauliflower bake', image: require('../../assets/dishes/cauli-bake.jpg') },
    'Шарлотка с яблоками':               { ru: 'Шарлотка с яблоками', en: 'Apple charlotte', image: require('../../assets/dishes/apple-charlotte.jpg') },

    'Бефстроганов':                       { ru: 'Бефстроганов', en: 'Beef Stroganoff', image: require('../../assets/dishes/beef-stroganoff.jpg') },
    'Говяжий стейк с овощами':            { ru: 'Говяжий стейк с овощами', en: 'Beef steak with vegetables', image: require('../../assets/dishes/beef-steak.jpg') },
    'Узбекский плов с курицей':           { ru: 'Узбекский плов с курицей', en: 'Uzbek chicken plov', image: require('../../assets/dishes/plov.jpg') },
    'Лазанья болоньезе':                  { ru: 'Лазанья болоньезе', en: 'Lasagne bolognese', image: require('../../assets/dishes/lasagne.jpg') },
    'Фаршированные перцы':                { ru: 'Фаршированные перцы', en: 'Stuffed peppers', image: require('../../assets/dishes/stuffed-peppers.jpg') },
    'Утка с яблоками и апельсином':       { ru: 'Утка с яблоками и апельсином', en: 'Duck with apples and orange', image: require('../../assets/dishes/duck-apple.jpg') },
    'Паэлья с курицей':                   { ru: 'Паэлья с курицей', en: 'Chicken paella', image: require('../../assets/dishes/paella.jpg') },
    'Запеченные баклажаны пармиджано':    { ru: 'Запеченные баклажаны пармиджано', en: 'Aubergine parmigiana', image: require('../../assets/dishes/parmigiana.jpg') },
    'Баклажанные роллы с сыром':          { ru: 'Баклажанные роллы с сыром', en: 'Aubergine cheese rolls', image: require('../../assets/dishes/aubergine-rolls.jpg') },
    'Киш-лорен с беконом и луком':        { ru: 'Киш-лорен с беконом и луком', en: 'Quiche Lorraine', image: require('../../assets/dishes/quiche.jpg') },
};

export function translateDish(title: string, lang: 'ru' | 'en'): string {
    const entry = DISH_LABELS[title];
    return entry ? entry[lang] : title;
}

export function dishImage(title: string): ImageSourcePropType {
    const entry = DISH_LABELS[title];
    return entry ? entry.image : FALLBACK;
}
