const categories = {
  groceries: { label: "Groceries", icon: "▦", color: "#e6f2e8", ink: "#57916a", budget: 500 },
  dining: { label: "Dining out", icon: "◒", color: "#faece1", ink: "#cc8554", budget: 240 },
  transport: { label: "Transport", icon: "↗", color: "#e8eff8", ink: "#6586af", budget: 180 },
  home: { label: "Home & bills", icon: "⌂", color: "#f0eaf7", ink: "#9278b0", budget: 900 },
  health: { label: "Health", icon: "+", color: "#fae9e8", ink: "#c7766f", budget: 120 },
  shopping: { label: "Shopping", icon: "◇", color: "#fbf2d9", ink: "#b4943e", budget: 200 },
  income: { label: "Income", icon: "↑", color: "#e4f2e9", ink: "#4c8b63", budget: 0 },
  other: { label: "Other", icon: "·", color: "#edf0ec", ink: "#758078", budget: 150 }
};
const today = new Date();
const monthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

function dateOffset(daysAgo) {
  const date = new Date();
  date.setDate(date.getDate() + daysAgo);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

const defaultTransactions = [
  { id: "sample-1", description: "Weekly groceries", category: "groceries", amount: 68.42, date: dateOffset(-1), type: "expense" },
  { id: "sample-2", description: "Monthly salary", category: "income", amount: 4200, date: dateOffset(-2), type: "income" },
  { id: "sample-3", description: "Coffee & brunch", category: "dining", amount: 24.8, date: dateOffset(-3), type: "expense" },
  { id: "sample-4", description: "Metro pass", category: "transport", amount: 42, date: dateOffset(-4), type: "expense" },
  { id: "sample-5", description: "Electricity bill", category: "home", amount: 83.16, date: dateOffset(-5), type: "expense" },
  { id: "sample-6", description: "Pharmacy", category: "health", amount: 18.5, date: dateOffset(-6), type: "expense" },
  { id: "sample-7", description: "Dinner with friends", category: "dining", amount: 46, date: dateOffset(-7), type: "expense" },
  { id: "sample-8", description: "Household supplies", category: "home", amount: 32.75, date: dateOffset(-8), type: "expense" },
  { id: "sample-9", description: "Market produce", category: "groceries", amount: 39.2, date: dateOffset(-9), type: "expense" }
];

function readStored(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}

let transactions = readStored("pocketsmart.transactions", defaultTransactions);
const savedBudgets = readStored("pocketsmart.budgets", {});
let budgets = Object.fromEntries(Object.entries(categories).map(([key, category]) => [key, { ...category, ...savedBudgets[key] }]));
let showAllTransactions = false;
let toastTimer;
const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const preciseMoney = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });
const currentMonthTransactions = () => transactions.filter((item) => item.date?.slice(0, 7) === monthKey);
const amountFor = (item) => Number(item.amount) || 0;
const categoryFor = (key) => budgets[key] || categories[key] || categories.other;

function formatDate(dateString) {
  if (dateString === dateOffset(0)) return "Today";
  if (dateString === dateOffset(-1)) return "Yesterday";
  return new Date(`${dateString}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function renderHeader() {
  document.querySelector("#month-label").textContent = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(today).toUpperCase() + " · YOUR MONEY, IN FOCUS";
  document.querySelector("#today-label").textContent = today.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function renderSummary() {
  const monthItems = currentMonthTransactions();
  const spent = monthItems.filter((item) => item.type !== "income").reduce((sum, item) => sum + amountFor(item), 0);
  const income = monthItems.filter((item) => item.type === "income").reduce((sum, item) => sum + amountFor(item), 0);
  const budgetTotal = Object.entries(budgets).filter(([key]) => key !== "income").reduce((sum, [, item]) => sum + Number(item.budget || 0), 0);
  const ratio = budgetTotal ? spent / budgetTotal : 0;
  document.querySelector("#available-total").textContent = money.format(budgetTotal - spent);
  document.querySelector("#budget-total").textContent = money.format(budgetTotal);
  document.querySelector("#income-total").textContent = money.format(income);
  document.querySelector("#spent-total").textContent = money.format(spent);
  document.querySelector("#spent-percent").textContent = `${Math.round(ratio * 100)}% of budget`;
  document.querySelector("#spent-status").textContent = ratio > 1 ? "Over your monthly budget" : "Your monthly spending";
  const status = document.querySelector(".status-pill");
  status.className = `status-pill ${ratio > 1 ? "status-over" : ratio > 0.8 ? "status-warn" : "status-good"}`;
  status.innerHTML = `<span></span>${ratio > 1 ? "Over budget" : ratio > 0.8 ? "Nearly there" : "On track"}`;
  document.querySelector("#chart-total").textContent = money.format(spent);
}

function renderBudgets() {
  const totals = currentMonthTransactions().filter((item) => item.type !== "income").reduce((result, item) => {
    result[item.category] = (result[item.category] || 0) + amountFor(item);
    return result;
  }, {});
  document.querySelector("#budget-list").innerHTML = Object.keys(categories).filter((key) => key !== "income").map((key) => {
    const category = categoryFor(key);
    const spent = totals[key] || 0;
    const limit = Number(category.budget) || 0;
    const over = spent > limit;
    const progress = limit ? Math.min(spent / limit * 100, 100) : 0;
    return `<div class="budget-item"><div class="budget-item-head"><span class="budget-category"><span class="category-symbol" style="background:${category.color};color:${category.ink}">${category.icon}</span>${category.label}</span><span class="budget-amount"><strong>${money.format(spent)}</strong> / ${money.format(limit)}</span></div><div class="progress-track"><span style="width:${progress}%;--bar-color:${over ? "#d17c6c" : category.ink}"></span></div><div class="budget-item-foot"><span>${over ? `<span class="over-label">${money.format(spent - limit)} over</span>` : `${money.format(Math.max(limit - spent, 0))} left`}</span><span>${Math.round(limit ? spent / limit * 100 : 0)}%</span></div></div>`;
  }).join("");
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
}

function renderTransactions() {
  const query = document.querySelector("#transaction-search").value.trim().toLowerCase();
  const category = document.querySelector("#category-filter").value;
  const monthItems = currentMonthTransactions().sort((first, second) => second.date.localeCompare(first.date));
  const filtered = monthItems.filter((item) => (category === "all" || item.category === category) && `${item.description} ${categoryFor(item.category).label}`.toLowerCase().includes(query));
  const visible = showAllTransactions ? filtered : filtered.slice(0, 5);
  document.querySelector("#transaction-list").innerHTML = visible.map((item) => {
    const categoryInfo = categoryFor(item.category);
    const positive = item.type === "income";
    return `<div class="transaction-row"><div class="transaction-main"><span class="transaction-icon" style="background:${categoryInfo.color};color:${categoryInfo.ink}">${categoryInfo.icon}</span><span class="transaction-copy"><strong>${escapeHTML(item.description)}</strong><span>${categoryInfo.label} · ${formatDate(item.date)}</span></span></div><span class="transaction-value ${positive ? "income" : ""}">${positive ? "+" : "−"}${preciseMoney.format(amountFor(item))}</span></div>`;
  }).join("");
  document.querySelector("#transaction-empty").hidden = filtered.length !== 0;
  document.querySelector("#view-all-button").innerHTML = showAllTransactions ? "Show less <span aria-hidden=\"true\">↗</span>" : "View all <span aria-hidden=\"true\">↗</span>";
}

function renderChart() {
  const mode = document.querySelector("#chart-period").value;
  const startDay = mode === "week" ? Math.max(1, today.getDate() - 6) : 1;
  const labels = [];
  const sums = [];
  for (let day = startDay; day <= today.getDate(); day++) {
    const date = `${monthKey}-${String(day).padStart(2, "0")}`;
    labels.push(day);
    sums.push(currentMonthTransactions().filter((item) => item.date === date && item.type !== "income").reduce((sum, item) => sum + amountFor(item), 0));
  }
  const width = 600, height = 150, top = 10, bottom = 119;
  const max = Math.max(...sums, 100) * 1.22;
  const coords = sums.map((value, index) => ({ x: 8 + index * ((width - 16) / Math.max(labels.length - 1, 1)), y: bottom - value / max * (bottom - top) }));
  const polyline = coords.map((point) => `${point.x},${point.y}`).join(" ");
  const area = coords.length ? `M ${coords[0].x} ${bottom} L ${polyline.replaceAll(" ", " L ")} L ${coords.at(-1).x} ${bottom} Z` : "";
  const grid = [0, 1, 2].map((index) => `<line class="chart-gridline" x1="0" y1="${top + index * ((bottom - top) / 2)}" x2="${width}" y2="${top + index * ((bottom - top) / 2)}"/>`).join("");
  const ticks = [...new Set([labels[0], labels[Math.floor((labels.length - 1) / 2)], labels.at(-1)])].filter(Number.isFinite);
  const tickLabels = ticks.map((day) => {
    const index = labels.indexOf(day), date = new Date(today.getFullYear(), today.getMonth(), day);
    const anchor = index === 0 ? "start" : index === labels.length - 1 ? "end" : "middle";
    return `<text class="chart-label" x="${coords[index]?.x ?? 0}" y="145" text-anchor="${anchor}">${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</text>`;
  }).join("");
  const last = coords.at(-1);
  document.querySelector("#spending-chart").innerHTML = `<svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="chart-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#6eaa83" stop-opacity=".22"/><stop offset="1" stop-color="#6eaa83" stop-opacity="0"/></linearGradient></defs>${grid}<path class="chart-area" d="${area}"/><polyline class="chart-line" points="${polyline}"/>${last ? `<circle class="chart-point" cx="${last.x}" cy="${last.y}" r="3.4"/>` : ""}${tickLabels}</svg>`;
}

function renderRecommendation() {
  const totals = currentMonthTransactions().filter((item) => item.type !== "income").reduce((result, item) => {
    result[item.category] = (result[item.category] || 0) + amountFor(item);
    return result;
  }, {});
  const ranked = Object.keys(categories).filter((key) => key !== "income").map((key) => ({ key, spent: totals[key] || 0, budget: Number(categoryFor(key).budget) || 0 })).sort((a, b) => (b.budget ? b.spent / b.budget : 0) - (a.budget ? a.spent / a.budget : 0));
  const priority = ranked.find((item) => item.budget && item.spent / item.budget >= .75);
  const text = document.querySelector("#recommendation-text"), action = document.querySelector("#recommendation-action");
  if (priority) {
    const category = categoryFor(priority.key), remaining = priority.budget - priority.spent;
    text.innerHTML = `You’ve used <strong>${Math.round(priority.spent / priority.budget * 100)}%</strong> of your ${category.label.toLowerCase()} budget. ${remaining > 0 ? `About <strong>${money.format(remaining)}</strong> left to enjoy this month.` : `You’re <strong>${money.format(Math.abs(remaining))}</strong> over your monthly target.`}`;
    action.innerHTML = `<button type="button" data-focus-category="${priority.key}">Take a look at ${category.label.toLowerCase()} <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h10m-4-4 4 4-4 4"/></svg></button>`;
  } else {
    text.innerHTML = "You’re building a steady rhythm. Your category budgets are looking comfortable so far this month. Keep it up, one choice at a time.";
    action.innerHTML = `<button type="button" data-focus-category="all">Review your spending <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h10m-4-4 4 4-4 4"/></svg></button>`;
  }
}

function renderCategories() {
  const filter = document.querySelector("#category-filter"), currentValue = filter.value || "all";
  filter.innerHTML = `<option value="all">All categories</option>${Object.entries(categories).map(([key, item]) => `<option value="${key}">${item.label}</option>`).join("")}`;
  filter.value = currentValue;
  document.querySelector("#form-category").innerHTML = Object.entries(categories).map(([key, item]) => `<option value="${key}">${item.label}</option>`).join("");
}

function render() {
  renderCategories(); renderHeader(); renderSummary(); renderBudgets(); renderTransactions(); renderChart(); renderRecommendation();
}
function showToast(message) {
  const toast = document.querySelector("#toast");
  toast.textContent = message; toast.classList.add("show"); clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
}

const dialog = document.querySelector("#transaction-dialog"), form = document.querySelector("#transaction-form");
document.querySelector("#add-transaction-button").addEventListener("click", () => { form.elements.date.value = dateOffset(0); dialog.showModal(); });
document.querySelector("#close-dialog").addEventListener("click", () => dialog.close());
document.querySelector("#cancel-dialog").addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); });
form.elements.type.forEach((radio) => radio.addEventListener("change", () => {
  const select = document.querySelector("#form-category");
  if (radio.checked && radio.value === "income") select.value = "income";
  else if (radio.checked && select.value === "income") select.value = "groceries";
}));
form.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(form), type = data.get("type");
  const transaction = { id: crypto.randomUUID?.() || String(Date.now()), description: String(data.get("description")).trim(), amount: Number(data.get("amount")), category: type === "income" ? "income" : String(data.get("category")), date: String(data.get("date")), type };
  if (!transaction.description || transaction.amount <= 0 || !transaction.date) return;
  transactions = [transaction, ...transactions];
  localStorage.setItem("pocketsmart.transactions", JSON.stringify(transactions));
  showAllTransactions = false; form.reset(); dialog.close(); render(); showToast("Transaction added to your month.");
});
document.querySelector("#transaction-search").addEventListener("input", renderTransactions);
document.querySelector("#category-filter").addEventListener("change", renderTransactions);
document.querySelector("#view-all-button").addEventListener("click", (event) => { event.preventDefault(); showAllTransactions = !showAllTransactions; renderTransactions(); });
document.querySelector("#chart-period").addEventListener("change", renderChart);
document.querySelector("#edit-budgets-button").addEventListener("click", () => {
  const key = window.prompt("Which category budget would you like to update? Enter groceries, dining, transport, home, health, shopping, or other.");
  if (!key) return;
  const normalized = key.trim().toLowerCase();
  if (!categories[normalized] || normalized === "income") { showToast("Choose a category from the list to edit its budget."); return; }
  const current = Number(categoryFor(normalized).budget) || 0;
  const value = window.prompt(`Set a new monthly budget for ${categoryFor(normalized).label} (in dollars).`, String(current));
  if (value === null) return;
  const nextBudget = Number(value);
  if (!Number.isFinite(nextBudget) || nextBudget <= 0) { showToast("Enter a budget greater than zero."); return; }
  budgets[normalized] = { ...categoryFor(normalized), budget: nextBudget };
  const stored = Object.fromEntries(Object.keys(categories).filter((category) => category !== "income").map((category) => [category, { budget: budgets[category].budget }]));
  localStorage.setItem("pocketsmart.budgets", JSON.stringify(stored)); render(); showToast(`${categoryFor(normalized).label} budget updated.`);
});
document.querySelector("#recommendation-action").addEventListener("click", (event) => {
  const button = event.target.closest("[data-focus-category]");
  if (!button) return;
  document.querySelector("#category-filter").value = button.dataset.focusCategory;
  document.querySelector("#transaction-search").value = ""; showAllTransactions = true; renderTransactions();
  document.querySelector("#transactions").scrollIntoView({ behavior: "smooth", block: "start" });
});
document.querySelectorAll(".nav-link").forEach((link) => link.addEventListener("click", () => {
  document.querySelectorAll(".nav-link").forEach((item) => {
    item.classList.toggle("active", item === link);
    if (item === link) item.setAttribute("aria-current", "page"); else item.removeAttribute("aria-current");
  });
}));
render();