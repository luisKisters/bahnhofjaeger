# Location data

https://overpass-turbo.eu/

query:

```sql
[out:csv(::id, name, ::lat, ::lon, "railway", "public_transport")];
area["ISO3166-1"="DE"]->.searchArea;
(
  node["railway"="station"](area.searchArea);
  way["railway"="station"](area.searchArea);
  relation["railway"="station"](area.searchArea);
  node["railway"="halt"](area.searchArea);
  way["railway"="halt"](area.searchArea);
  relation["railway"="halt"](area.searchArea);
  // Optional: Auch Stationen des öffentlichen Nahverkehrs, falls relevant
  // node["public_transport"="station"]["station"="train"](area.searchArea);
  // way["public_transport"="station"]["station"="train"](area.searchArea);
  // relation["public_transport"="station"]["station"="train"](area.searchArea);
);
out center;
```

# Price list

https://www.dbinfrago.com/resource/blob/13076748/60d778aa27ad13c85108c840417dc841/Stationspreisliste-2025-data.pdf

# Utilities

- for converting preisliste pdf to excel: https://www.adobe.com/de/acrobat/online/pdf-to-excel.html
- for replacing duplicate header value rows in csv of preisliste: https://www.cursor.sh (using "Find and replace")
- for removing resulting rows: data/clean-csv.js
- for converting excel (xlsv) to csv: apple numbers
- for converting turbopass export to csv: https://products.groupdocs.app/de/conversion/tsv-to-csv
