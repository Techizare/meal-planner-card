# Meal Planner Card

The Home Assistant dashboard cards `custom:meal-planner-card` and `custom:shopping-list-card`.
The Home Assistant Marketplace installs the built file `dist/meal-planner-card.js`; `src/` is the readable source.

## Install

In Home Assistant go to **Settings › Marketplace › Add from link**, enter `Techizare/meal-planner-card` (type **Dashboard**) and install **Meal Planner Card**. It adds the dashboard resource `/local/community/meal-planner-card/meal-planner-card.js`. Hard refresh the browser afterwards.

The 🛒 Trolley button needs the Woolies Bridge add-on from [Techizare/ha-addons](https://github.com/Techizare/ha-addons).

## Layout

The source is plain script split into parts that are joined in name order (no imports):

| File | What's in it |
|---|---|
| `00-header.js` | Overview, storage formats and the version history |
| `10-dates-aisles.js` | Version, date helpers, aisles and aisle guessing |
| `20-quantities.js` | Quantities, servings scaling, pantry rules, popular |
| `30-health.js` | Health rating and macros |
| `40-formats-feed.js` | Meal and shopping item description formats, the to-do feed |
| `50-base.js` | Shared styles, sheets, drafts, the base card class |
| `60-planner-style-data.js` | Planner styles, emoji, suggested ingredients, example meals |
| `70-planner.js` | The meal planner card |
| `80-shopping-style.js` | Shopping list styles |
| `90-shopping.js` | The shopping list card |
| `95-trolley.js` | 🛒 Woolworths trolley (mixed into the shopping list card; needs the Woolies Bridge add-on) |
| `99-register.js` | Registers both cards |

## Making a change

1. Edit the parts in `src/`, bump `MP_VERSION` in `10-dates-aisles.js`, add a line to the history in `00-header.js`.
2. Run `./build.sh` (needs Node). It checks the syntax and writes `dist/meal-planner-card.js`.
3. Commit `src/` and `dist/` together and push to `main`. The repo has no releases, so the Marketplace follows `main` and offers each new commit as an update (Settings › Updates).
