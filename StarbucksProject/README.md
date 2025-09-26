# Starbucks Store Closure Finder

A web application that helps users find Starbucks stores that are scheduled to close permanently soon.

## Features

- **Interactive Map**: View store locations on a clustered map using Leaflet.js
- **Location Search**: Search by city, state, or ZIP code
- **Geolocation**: Use device location to find nearby stores
- **Store Details**: View detailed information about each store including address, phone, and closure status
- **Responsive Design**: Works on desktop and mobile devices
- **All Stores Modal**: Browse all stores organized by state

## Data Sources

- `starbucks_geocode_filled.json`: Primary store data with geocoded coordinates
- `sunday_closed_stores_detailed.json`: Fallback store data
- `USZipsWithLatLon_20231227.csv`: ZIP code to coordinate mapping for fast lookups

## Technologies Used

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Mapping**: Leaflet.js with marker clustering
- **Geocoding**: OpenStreetMap Nominatim API
- **Styling**: Custom CSS with responsive design

## Usage

1. Open `index.html` in a web browser
2. Search for a location or use the "Use My Location" button
3. View nearby stores on the map and in the list
4. Click "View All Stores" to see stores organized by state
5. Click on store markers for detailed information

## Local Development

Simply serve the files from a local web server. No build process required.

```bash
# Using Python 3
python -m http.server 8000

# Using Node.js http-server
npx http-server

# Using PHP
php -S localhost:8000
```

Then open `http://localhost:8000` in your browser.