-- Кухнята — примерни рецепти, само за локално тестване на приложението.
-- Пусни СЛЕД schema.sql и seed.sql, ако искаш да видиш нещо в /recipes
-- преди да имаш истинско съдържание. ИЗТРИЙ преди реален launch:
--   delete from recipes;
--
-- Първите 2 рецепти са точните примерни редове от
-- recipe-production-tracker.xlsx (лист "Рецепти"); останалите 6 идват
-- от recipe-app-prototype.html, с тагове преномерирани към фиксираната
-- листа от 50-те тага.

do $$
declare v_id bigint;
begin
  if exists (select 1 from recipes where title = 'Пилешко със сладки картофи на фурна') then
    return;
  end if;

  insert into recipes (title, time_minutes, servings, kcal, protein_g, carbs_g, fat_g, ingredients, steps, video_url, photo_url, is_locked, batch_number)
  values ('Пилешко със сладки картофи на фурна', 35, 2, 420, 38, 30, 14,
    '2 пилешки гърди; 2 сладки картофа; зехтин; чубрица, черен пипер, риган',
    '1. Наряжи картофите на кубчета, задушвам с олио и подправки.
2. Пека на 200° за 25 мин.
3. Пилето на скара 6-7 мин на страна, добавяй последните 10 мин към картофите.',
    'https://www.tiktok.com/@kuhnyata/video/placeholder1', '/sample/recipe-1.jpg', false, 1)
  returning id into v_id;
  insert into recipe_tags (recipe_id, tag_id) values
    (v_id, (select id from tags where name = 'пиле')),
    (v_id, (select id from tags where name = 'вечеря')),
    (v_id, (select id from tags where name = 'high-protein')),
    (v_id, (select id from tags where name = 'на фурна'));

  insert into recipes (title, time_minutes, servings, kcal, protein_g, carbs_g, fat_g, ingredients, steps, video_url, photo_url, is_locked, batch_number)
  values ('Картофена яхния с кайма', 45, 4, 510, 27, 46, 22,
    '500г кайма; 4 картофа; 1 лук; доматено пюре',
    '1. Задушаваш лука, добавяш каймата.
2. Слагаш картофите на кубчета и доматеното пюре.
3. Къкри на тих огън 30 мин.',
    'https://www.youtube.com/watch?v=UNLISTED_PLACEHOLDER_2', '/sample/recipe-2.jpg', true, 1)
  returning id into v_id;
  insert into recipe_tags (recipe_id, tag_id) values
    (v_id, (select id from tags where name = 'червено месо')),
    (v_id, (select id from tags where name = 'вечеря')),
    (v_id, (select id from tags where name = 'балансирано')),
    (v_id, (select id from tags where name = 'за уикенда'));

  insert into recipes (title, time_minutes, servings, kcal, protein_g, carbs_g, fat_g, ingredients, steps, video_url, photo_url, is_locked, batch_number)
  values ('Овесена каша с банан и фъстъчено масло', 8, 1, 380, 16, 52, 12,
    '50г овесени ядки; 200мл мляко; 1 банан; 1 ч.л. фъстъчено масло',
    '1. Вари овесените ядки с млякото 5 мин.
2. Добави нарязан банан.
3. Завърши с фъстъчено масло отгоре.',
    'https://www.tiktok.com/@kuhnyata/video/placeholder3', '/sample/recipe-3.jpg', false, 1)
  returning id into v_id;
  insert into recipe_tags (recipe_id, tag_id) values
    (v_id, (select id from tags where name = 'закуска')),
    (v_id, (select id from tags where name = 'бързо (<20 мин)')),
    (v_id, (select id from tags where name = 'балансирано'));

  insert into recipes (title, time_minutes, servings, kcal, protein_g, carbs_g, fat_g, ingredients, steps, video_url, photo_url, is_locked, batch_number)
  values ('Салата с киноа и печени зеленчуци', 20, 2, 340, 11, 44, 13,
    '1 чаша киноа; тиквички; чушки; зехтин; лимон',
    '1. Свари киноата 15 мин.
2. Изпечи зеленчуците на тиган.
3. Смеси всичко със зехтин и лимон.',
    'https://www.tiktok.com/@kuhnyata/video/placeholder4', '/sample/recipe-4.jpg', false, 1)
  returning id into v_id;
  insert into recipe_tags (recipe_id, tag_id) values
    (v_id, (select id from tags where name = 'обяд')),
    (v_id, (select id from tags where name = 'вегетарианско')),
    (v_id, (select id from tags where name = 'нискокалорично'));

  insert into recipes (title, time_minutes, servings, kcal, protein_g, carbs_g, fat_g, ingredients, steps, video_url, photo_url, is_locked, batch_number)
  values ('Протеинови палачинки', 12, 1, 310, 28, 24, 9,
    '2 яйца; 1 банан; 30г протеин на прах',
    '1. Разбий всичко в блендер.
2. Печи на тиган по 1 мин на страна.
3. Поднеси с мед или боровинки.',
    'https://www.youtube.com/watch?v=UNLISTED_PLACEHOLDER_5', '/sample/recipe-5.jpg', true, 1)
  returning id into v_id;
  insert into recipe_tags (recipe_id, tag_id) values
    (v_id, (select id from tags where name = 'закуска')),
    (v_id, (select id from tags where name = 'high-protein')),
    (v_id, (select id from tags where name = 'бързо (<20 мин)'));

  insert into recipes (title, time_minutes, servings, kcal, protein_g, carbs_g, fat_g, ingredients, steps, video_url, photo_url, is_locked, batch_number)
  values ('Пиле теряки с ориз', 25, 2, 460, 34, 52, 11,
    '300г пилешко филе; соев сос, мед, чесън; 1 чаша ориз',
    '1. Свари ориза.
2. Запържи пилето, добави соса.
3. Къкри 5 мин докато се сгъсти.',
    'https://www.tiktok.com/@kuhnyata/video/placeholder6', '/sample/recipe-6.jpg', false, 1)
  returning id into v_id;
  insert into recipe_tags (recipe_id, tag_id) values
    (v_id, (select id from tags where name = 'пиле')),
    (v_id, (select id from tags where name = 'вечеря')),
    (v_id, (select id from tags where name = 'бързо (<20 мин)'));

  insert into recipes (title, time_minutes, servings, kcal, protein_g, carbs_g, fat_g, ingredients, steps, video_url, photo_url, is_locked, batch_number)
  values ('Картофено пюре с чеснов сос', 30, 3, 280, 6, 42, 9,
    '5 картофа; мляко, масло; 2 скилидки чесън',
    '1. Свари картофите.
2. Разбий с мляко и масло.
3. Добави настъргания чесън.',
    'https://www.youtube.com/watch?v=UNLISTED_PLACEHOLDER_7', '/sample/recipe-7.jpg', true, 1)
  returning id into v_id;
  insert into recipe_tags (recipe_id, tag_id) values
    (v_id, (select id from tags where name = 'вечеря')),
    (v_id, (select id from tags where name = 'за начинаещи'));

  insert into recipes (title, time_minutes, servings, kcal, protein_g, carbs_g, fat_g, ingredients, steps, video_url, photo_url, is_locked, batch_number)
  values ('Шакшука с фета', 15, 2, 320, 18, 14, 21,
    '4 яйца; 2 домата; 1 чушка; фета сирене',
    '1. Задуши чушката и доматите.
2. Направи трапчинки, счупи яйцата вътре.
3. Похлупи 6-7 мин, поръси с фета.',
    'https://www.tiktok.com/@kuhnyata/video/placeholder8', '/sample/recipe-8.jpg', false, 1)
  returning id into v_id;
  insert into recipe_tags (recipe_id, tag_id) values
    (v_id, (select id from tags where name = 'закуска')),
    (v_id, (select id from tags where name = 'вегетарианско')),
    (v_id, (select id from tags where name = 'бързо (<20 мин)'));
end $$;
