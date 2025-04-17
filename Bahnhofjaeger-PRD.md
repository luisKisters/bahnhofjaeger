# Product Requirements Document: Bahnhofjaeger

## Overview

**Bahnhofjaeger** is a mobile-first PWA where users collect points by adding train stations to their collection. The score is calculated based on the DB price class of each station.

## Objective

Develop a fast, functional MVP that offers a core functionality: Manually collecting train stations with a point system. The app should work offline and be optimized for mobile devices.

## Target Platform

- **Mobile-First**: Optimized for smartphones
- **Offline-First**: Functions without internet connection
- **PWA**: Implemented as a Progressive Web App

## Core Functionalities

### 1. Station Data & Import

- Use existing CSV file with station information
- Structured data: Station name, price class, federal state

### 2. Check-in System

- Manual entry of stations via text input
- Fuzzy-matching support for station names
- Prevention of duplicates in the collection

### 3. Point System

- Points awarded based on DB price class
- PK1 = highest score, PK7 = lowest score
- Total points for the collection

### 4. Collection & Overview

- List of all collected stations
- Sorting and filtering functions
- Display of details (name, price class, points)

### 5. Offline Functionality

- Complete functionality without internet connection
- Local storage of the collection
- Synchronization when reconnected (future)

## Technical Specifications

### Stack

- **Framework**: Next.js (App Router)
- **Styling**: Tailwind CSS (mobile-optimized)
- **Data Storage**: IndexedDB/localStorage
- **PWA Features**: Service Worker, App Manifest

### Data Model

```typescript
interface Station {
  id: string;
  name: string;
  priceClass: number; // 1-7
  state: string;
  points: number;
}

interface Collection {
  stations: Station[];
  totalPoints: number;
  lastUpdated: Date;
}
```

## User Flow

1. **First Use**

   - App loads and CSV data is imported
   - Local database is initialized
   - Onboarding with brief explanation (optional)

2. **Check-in Flow**

   - User enters station name
   - App suggests matching stations (Fuzzy Search)
   - User selects station and confirms check-in
   - Points are added and collection is updated

3. **View Collection**
   - Overview of all collected stations
   - Display details for each station
   - Sort by different criteria

## Implementation Plan

### Phase 1: Basic Structure

- Project setup and configuration
- CSV data import and parsing
- Basic UI components

### Phase 2: Core Functions

- Fuzzy-matching for station search
- Check-in system implementation
- Point calculation

### Phase 3: Offline & UI

- Implement offline storage
- Optimize UI for mobile use
- Service Worker for offline access

### Phase 4: Testing & Deployment

- Comprehensive testing on various devices
- Bug fixes and optimizations
- Deployment on Vercel

## Future Features (not in MVP)

- GPS-based automatic check-in
- Map integration for visualization
- Achievements and badges
- Sharing collection on social media
- Multilingual support
