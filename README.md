# PocketSmart

PocketSmart is a lightweight personal budgeting dashboard with an explainable spending recommendation assistant. Track monthly spending, review category budgets, and add transactions from a responsive browser-based interface.

## Run locally

No dependencies or build step are required. From this directory, run:

```sh
python3 -m http.server 8000
```

Then open [http://localhost:8000](http://localhost:8000).

## What it does

- Shows monthly income, spending, remaining budget, and a spending trend.
- Tracks category budget progress and recent transactions.
- Adds income or expenses and filters transactions by category or search term.
- Saves transactions and budget edits in this browser using `localStorage`.
- Produces simple recommendations from current category budget usage. This is a local prototype, not a connected bank account or financial advice service.