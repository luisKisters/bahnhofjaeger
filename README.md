### Figma Design (Idea/Concept)
[<img width="705" alt="image" src="https://github.com/user-attachments/assets/762ec42a-3bb7-40d9-b494-96536ab94857" />](https://www.figma.com/design/rDHRClMSgBkXwfgKsolAyg/Bahnhofj%C3%A4ger-Design?node-id=0-1&t=2p8LjBYemHPxeAjj-1)


### Environment Setup

1. Create a `.env.local` file in the root directory of the project and add your MapTiler API key:

```bash
# Get your API key from https://cloud.maptiler.com/
NEXT_PUBLIC_MAPTILER_API_KEY=your_api_key_here
```

2. Then, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Map Features

The application uses MapTiler SDK for displaying station maps. The map shows:

- Blue markers for stations in your collection
- Gray markers for stations not yet collected
- Marker size based on station price class (higher classes = larger markers)

## Station Data Enrichment

This project includes a script to enrich Deutsche Bahn station data with additional information from the StaDa API.

### Prerequisites

1. Create a Deutsche Bahn API Marketplace account at https://developers.deutschebahn.com/
2. Subscribe to the StaDa API (Free4All plan)
3. Create a `.env` file with your API credentials:

```
DB_CLIENT_ID=your_db_client_id_here
DB_SECRET=your_db_secret_here
```

### Running the Enrichment

To test with a sample of 10 stations first:

```bash
pnpm enrich-stations-sample
```

To process the full dataset:

```bash
pnpm enrich-stations
```

The script will generate an enriched CSV file with additional data:

- Geographic coordinates (longitude, latitude)
- Address information
- Aufgabentraeger details
- Station type (ProductLine)
- Facility information (parking, WiFi)
- Unique IDs for each station

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
