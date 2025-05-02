[![Deployed on Vercel](https://deploy-badge.vercel.app/vercel/bahnhofjaeger)](https://bahnhofjaeger.vercel.app)

# Bahnhofjäger

**Collect every train station in Germany!** Bahnhofjäger is a mobile-first, offline-capable Progressive Web App (PWA) for discovering, tracking, and collecting Deutsche Bahn stations. Earn points, view stats, and explore the map—no internet required.

---

## 🚦 Play Store Early Access

Bahnhofjäger is currently in **closed testing** on the Google Play Store. If you want early access, please [email me](mailto:luis.w.kisters@gmail.com) with your request!

---

## ✨ Features

- **Offline-first:** All data and collection progress is stored locally for full offline use
- **Mobile-optimized:** Touch-friendly, responsive UI for phones
- **Station collection:** Search, collect, and track every DB station
- **Fuzzy search:** Quickly find stations by name
- **Interactive map:** See your collection and all stations visually
- **Points & stats:** Earn points, track progress, and view collection statistics
- **Privacy-first:** No account required, no data leaves your device

---

## 🚀 Quickstart

1. **Clone the repo and install dependencies:**

```bash
pnpm install
```

2. **Set up your MapTiler API key:**

Create a `.env.local` file in the root directory:

```bash
NEXT_PUBLIC_MAPTILER_API_KEY=your_api_key_here
```

3. **Run the development server:**

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📚 Project Resources

- **Data sources, conversion utilities, and enrichment scripts:** See [`resources.md`](./resources.md)
- **Current and planned features, technical tasks, and priorities:** See [`TODO.md`](./TODO.md)

---

## 🗺️ Data Enrichment

Bahnhofjäger includes scripts to enrich Deutsche Bahn station data with additional information (coordinates, address, facilities, etc.) using the StaDa API. See `resources.md` for details and instructions.

---

## 📖 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Vercel Deployment](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme)

---

## 📝 License

This project is for personal and educational use. For licensing or other questions, [contact me](mailto:luis.w.kisters@gmail.com).
