# Solo Kitchen

Open `index.html` in a browser. No install, no server.

- **Cook**: meals you can make with what you have. Filter by time, protein and style, or tap *Surprise me*. *Not for me* hides a meal.
- **My kitchen**: tick what you have. It's saved in this browser.
- **Shop**: *Best things to buy next* ranks items by how many new meals each one unlocks. *Shopping list* collects what's missing for the meals you planned.

## Adding things

Everything is in `data.js`. Add an ingredient to `ingredients`, or a meal with `r(...)`. The format is explained at the top of that file. Then run:

```
node --test
```

It catches typos in ingredient ids and duplicate meals. `logic.js` holds the matching logic (pure functions, tested in `test/`). `app.js` is the UI.
