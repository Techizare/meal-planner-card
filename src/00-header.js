/* meal-planner-card + shopping-list-card  (v1.1, 30 October): the Meals page
 *
 * v1.1: tapping a planned night opens that night, with Remove on each meal,
 * so a meal can be taken off any day, past ones included. The meal sheet
 * keeps its Open button.
 *
 * v1.2: meal ideas can be dragged onto a night in the week strip. With a
 * mouse, press and move; on a touchscreen, hold for a moment, then drag, so
 * an ordinary swipe still scrolls the page. A tap still opens the meal.
 *
 * v1.3: the quick-add chips on the shopping list are editable. They live in
 * a third Local To-do list, todo.staples, one item per chip, so they can be
 * changed from the card (✎ at the end of the row) or the HA app. Without that
 * list the card falls back to quick_add from the config.
 *
 * v1.4: a Send button on the shopping list writes the open items out as plain
 * text in aisle order, to share (phone share sheet) or copy (the panel), for
 * pasting into a supermarket app, a message or notes.
 *
 * v1.5: a much bigger choice of meal pictures, plus a box to type or paste
 * any emoji at all.
 *
 * v1.6: a tap outside the meal or item editor no longer closes it once you have
 * changed something, and unsaved meal edits are kept in this browser until
 * Save or Cancel, so they come back if the editor closes another way. Meals
 * with no ingredients offer built-in suggested ingredients to check and tweak.
 *
 * v1.7: no double-ups on the shopping list. Planning reads the list fresh and
 * one meal at a time, and the shopping card merges any two open lines for the
 * same thing (however they got there) into one, keeping both meals' amounts.
 * Pantry-aisle ingredients and ⭐ staples are no longer added when a meal is
 * planned. The shopping list shows them under "Check the pantry": tick what is
 * in the cupboard (remembered on that screen), or ＋ List to add what isn't.
 *
 * v1.8: tap the Meal ideas heading to fold the library away or bring it back
 * (remembered on each screen).
 *
 * v1.9: under the shopping list's count, a row of nights shows which planned
 * dinners the list is buying for. Tap a night to see only its items; a night
 * that has been and gone is marked ⌛ and can be taken off the list.
 *
 * v1.10: tap as many nights as you like (say Tonight to Sunday) to shop for
 * just those; tap a night again to drop it from the selection. Nights come
 * from the meal plan too, so a planned meal whose ingredients aren't on the
 * list yet (planned before its ingredients were typed in) shows with a ＋ and
 * an Add button. Saving a planned meal's ingredients now updates the list.
 *
 * v1.11: the ticked nights decide what the list adds up to: quantities count
 * only those nights (plus anything added by hand), and Send and Check the
 * pantry follow them. The choice is remembered on each screen. The quick-add
 * row and the nights row fade at the edge, with a › nudge, when they scroll.
 *
 * v1.12: the list works by shops. "Next shop" runs from the first night the
 * last shop didn't cover to an end night you tap (tap the first night to
 * trim it, tap outside to stretch). "Done shopping" (also in Send) clears the
 * ticked items and records the range as the last shop; anything not ticked
 * stays. Open items for nights the last shop covered come back as top-ups.
 * The shop lives in input_text.meals_shop (JSON), so every screen agrees.
 *
 * v1.26: the week's day tiles show each meal's health pill, and the week
 * heading shows the average rating of the meals planned that week. Changing an
 * ingredient's aisle in the editor now also moves it in every other meal that
 * uses it and on the shopping list (lines kept the aisle they were made with).
 *
 * v1.25: 🩺 health rating and macro ring. Each meal with ingredients gets a
 * holistic 1-10 rating worked out from its ingredient list (processed meat,
 * red meat, veg and fruit, plant variety, fibre, beans, whole grains, oily
 * fish, fried or ultra-processed items, rich dairy, added sugar, a very big
 * serve), shown on the idea tiles and, with the reason for every point, in the
 * meal sheet. "Rate it myself" stores your own number as "health: N" in the
 * header; it wins until "Use the estimate". The sheet also shows a ring of the
 * protein / carbs / fat split by calories and the kcal a serve. All of it is an
 * estimate from a built-in table of typical values (NUT), said so on screen.
 * Fix: the ingredient Aisle box was hidden on phones; it now sits on a second
 * line under each ingredient.
 *
 * v1.24: ✨ Fill my week. A button by the week drafts dinners for the shown
 * week's empty nights (today on): nothing had or planned the week before or
 * already this week, quick meals on nights Cherisha's work calendar says she is
 * working in the evening, meals with ❄️ ingredients only on nights the 06:00
 * defrost reminder can still catch, least recently had first. Each night can be
 * swapped, chosen from a list or left empty before "Plan N nights" plans them
 * (shopping list and all, as if planned by hand). Options: busy_calendars
 * (default [calendar.cherisha_work]), busy_label, busy_from / busy_to (evening
 * window, default 16:00 to 19:30), quick_mins (default 30, or a Quick/Fast/Easy
 * tag), defrost_time (default 06:00).
 *
 * v1.14: an ingredient can be marked ❄️ (needs defrosting; line prefix "❄ ",
 * after any * or !). The planner shows "Take out of the freezer" on the morning
 * of a planned night, with ❄️ on that night's tile; an HA automation also sends
 * a phone reminder. A meal sheet's ✓ now means this meal's own share, so it can
 * be unticked even when another meal has the same thing on the list.
 * v1.20: Spices and Condiments aisles. Like Pantry, their ingredients count as
 * cupboard stock and show under Check the pantry rather than going on the list.
 *
 * v1.19: typing an ingredient name in Edit suggests the ones already used in
 * other meals (and on the list), picks up their aisle, and on Save "butter" takes
 * the spelling the other meals use ("Butter"), so the list doesn't double up.
 *
 * v1.18: unticking an item in Check the pantry works again when it was ticked
 * by a "we have it" line (✕ on the list): unticking now clears that line too.
 *
 * v1.17: servings. A meal's "Serves" is what its ingredient amounts are for. Any
 * planned night can be set to more or fewer people (the stepper on that night's
 * sheet); its share of the shopping list, the pantry check and the defrost
 * reminder scale to match, and the night's tile shows 👥 and the count. Stored
 * per night in the meal header as "servings: 2026-11-04=6" (planned nights only).
 * v1.13: any list or pantry item can be switched between "⭐ Pantry staple"
 * (check the cupboard) and "Always on the list". The switch changes that
 * ingredient in every meal that uses it. An ingredient line starting "! "
 * is never a staple, even in the Pantry aisle.
 *
 * Two cards in one module, meant to sit side by side on the 24" panel and
 * stack on a phone:
 *
 *   custom:meal-planner-card   Tonight, this week's dinners, and the meal
 *                              library (thumbnails, ingredients, edit).
 *   custom:shopping-list-card  the shopping list, grouped by aisle, editable.
 *
 * Planning a meal for a night adds its ingredients to the shopping list, and
 * un-planning it takes them off again (only the share that meal put there,
 * and never anything already ticked). Two meals that both need an onion make
 * one line, "2", with both meals shown on it.
 *
 * Everything is stored in two Local To-do lists, so nothing leaves the house:
 *
 *   todo.meals      one item per meal. The description is a header, the
 *                   ingredients, then free notes, separated by "---":
 *
 *                       emoji: 🍝
 *                       img: /local/meals/bolognese.jpg   (optional photo)
 *                       tags: Pasta, Family
 *                       serves: 4
 *                       mins: 40
 *                       plan: 2026-11-02, 2026-11-09      (nights it is planned)
 *                       servings: 2026-11-09=6            (a night cooked for more or fewer)
 *                       cooked: 2026-10-20                (last time it was had)
 *                       ---
 *                       500 g | Beef mince | Meat & Fish
 *                       1 | Brown onion | Produce
 *                       * 2 tbsp | Olive oil | Pantry     (* = pantry staple, not added)
 *                   Pantry-aisle ingredients and * staples are not added when a
 *                   meal is planned; the shopping card lists them under
 *                   "Check the pantry" to tick off or add.
 *                       ---
 *                       Notes, method, where the recipe is.
 *
 *   todo.shopping   one item per thing to buy. Name is the summary; the
 *                   description holds
 *
 *                       qty: 2 L                          (typed by hand)
 *                       aisle: Dairy & Eggs
 *                       for: Butter Chicken@2026-10-29=300 ml; Pizza@2026-10-31=1
 *
 *                   so the HA app on a phone still shows something readable.
 *                   The built-in "Shopping List" integration cannot store a
 *                   description, which is why this wants a Local To-do list.
 *
 * Dates are plain YYYY-MM-DD strings in local time, as on the task list.
 *
 * Config (meal-planner-card):
 *   meals_entity:     todo.meals     (required)
 *   shopping_entity:  todo.shopping  (required for planning to fill the list)
 *   aisles:           optional list of { name, icon, colour }, in shop order
 *   title:            optional heading
 *   busy_calendars, busy_label, busy_from, busy_to, quick_mins, defrost_time:
 *                     Fill my week (see v1.24 above)
 * Config (shopping-list-card):
 *   entity:           todo.shopping  (required)
 *   meals_entity:     todo.meals     (optional: meal emoji on each line)
 *   aisles, title
 *   staples_entity:   todo.staples   (default; the editable quick-add chips)
 *   quick_add:        chips to show when there is no staples list (default Milk, Bread, Eggs ...)
 *   shop_entity:      input_text.meals_shop (default; next and last shop, max 255)
 */

