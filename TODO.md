# Bahnhofjaeger TODO List

## ⭐ Priorities

1. **OFFLINE-FIRST** - App must be fully functional without internet connection
2. **MOBILE-ONLY** - Optimized exclusively for mobile devices
3. **MVP-FOCUS** - Implement only essential features

## 🔄 Data Management

- [x] Import CSV data on first launch
- [x] Store data in IndexedDB for offline access
- [x] Implement point calculation based on price class
- [x] Optimize Service Worker for offline cache
- [x] Implement local storage for collection

## 🔍 Station Search

- [x] Implement fuzzy-matching algorithm for search
- [ ] Create search suggestions with matching stations
- [ ] Check for duplicates during check-in
- [ ] Build compact UI for quick input

## 📱 UI/UX (Mobile-First)

- [x] Optimize main layout for mobile devices
- [x] Implement bottom navigation for easy access
- [ ] Use adaptive font sizes and touch targets
- [ ] Optimize input for mobile keyboard
- [ ] Implement pull-to-refresh and swipe gestures

## 🏆 Collection

- [x] Create list of collected stations
- [x] Display total points
- [ ] Implement sorting and filtering functions
- [ ] Create detail view for individual stations
- [x] Add collection statistics

## 🛠️ Technical Tasks

- [x] Complete PWA setup
- [x] Optimize Web App Manifest
- [x] Extend Service Worker for offline caching
- [ ] Optimize app size
- [x] Implement offline error handling

## 🧪 Testing

- [ ] Test on various mobile devices
- [x] Test offline functionality
- [ ] Perform performance tests
- [ ] Conduct UI/UX tests with users

## 🚀 Deployment

- [ ] Configure Vercel deployment
- [ ] Set up CI/CD pipeline
- [ ] Set up analytics

## 🌟 Future (after MVP)

- [ ] GPS-based check-in
- [x] Map view
- [ ] Achievements
- [ ] Social sharing
- [ ] Leaderboard
- [ ] Mutiplayer
- [ ] Database/CSV "enrichment" with additional station data
- [x] Statistic (visited e.g "21/240 Stations")
- [ ] Stop using next-pwa and follow more: https://nextjs.org/docs/app/building-your-application/configuring/progressive-web-apps

## Other Todos

- [x] fix pwa images for fancy installer thingy to work
- [x] fix station names in csv
- [ ] make the fuzzy search work better and display loading state
- [ ] add bundesland filter
- [ ] add slug pages preisklassen
- [ ] change to bahn.de-like styling
- [ ] fix "add to collection" button not working in map
- [ ] change trainstation identifcation from name to id
- [ ] achievments (a la "D-Ticket Warrior" bei vielen Preisklasse 4-7)
- [ ] make bestenlist depedant on totalPoints w/ threshold (min/max) and possibly activation function? (e.g simoid) to determine height
  - schnelles nicht echtes beispiel
    - 20p = 10px = 0.1% = 0.1%
    - 20000p = 100px = 0.2 = 20%
