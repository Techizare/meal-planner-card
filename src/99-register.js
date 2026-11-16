customElements.define("meal-planner-card", MealPlannerCard);
customElements.define("shopping-list-card", ShoppingListCard);
window.customCards = window.customCards || [];
window.customCards.push(
  { type: "meal-planner-card", name: "Meal planner", description: "Tonight, this week's dinners and the meal library, on a Local To-do list." },
  { type: "shopping-list-card", name: "Shopping list (aisles)", description: "Shopping list grouped by aisle, filled from planned meals." }
);
console.info("%c meal-planner-card %c v" + MP_VERSION + " ", "background:#ee8455;color:#fff;border-radius:3px 0 0 3px", "background:#444;color:#fff;border-radius:0 3px 3px 0");
