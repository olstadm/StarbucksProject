# Is My Starbucks Closing? Store Closure Finder & Map

A comprehensive web application that helps users discover if their local Starbucks is scheduled for permanent closure. Features an interactive map, location-based search, and detailed store information.

## 🎯 SEO Optimizations

This website is optimized to rank highly for searches like:
- "Is my Starbucks closing"
- "Starbucks closures 2025"
- "Starbucks stores closing permanently" 
- "Starbucks closure map"
- "Find closing Starbucks near me"

### SEO Features Implemented:

**Technical SEO:**
- ✅ Semantic HTML5 structure with proper heading hierarchy
- ✅ Schema.org structured data (WebApplication, FAQPage)
- ✅ Open Graph and Twitter Card meta tags
- ✅ Optimized meta descriptions and title tags
- ✅ XML sitemap and robots.txt
- ✅ Mobile-first responsive design
- ✅ Fast loading with optimized assets
- ✅ ARIA accessibility labels
- ✅ Canonical URLs

**Content SEO:**
- ✅ Target keyword optimization in titles and headings
- ✅ FAQ section addressing common user questions
- ✅ Comprehensive content covering user search intent
- ✅ Internal linking structure
- ✅ Location-based content for local SEO

**Performance:**
- ✅ Compressed assets and browser caching
- ✅ Preconnect to external domains
- ✅ Optimized images and lazy loading
- ✅ Progressive Web App (PWA) features

## Features

- **Interactive Map**: View store closure locations on a clustered map using Leaflet.js
- **Advanced Search**: Search by city, state, ZIP code, or use device geolocation
- **Store Details**: Comprehensive information including addresses and closure status
- **State Organization**: Browse all closures organized by state
- **Mobile Responsive**: Optimized for all devices and screen sizes
- **Real-time Data**: Updated database of permanent store closures

## Data Sources

- `starbucks_geocode_filled.json`: Primary store data with geocoded coordinates
- `sunday_closed_stores_detailed.json`: Fallback store data
- `USZipsWithLatLon_20231227.csv`: ZIP code to coordinate mapping for fast lookups

## Technologies Used

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Mapping**: Leaflet.js with marker clustering
- **Geocoding**: OpenStreetMap Nominatim API
- **SEO**: Schema.org structured data, Open Graph, Twitter Cards
- **Performance**: Browser caching, asset compression, PWA features

## SEO Files Structure

```
/
├── index.html              # Main page with SEO optimization
├── robots.txt             # Search engine crawler instructions
├── sitemap.xml            # Site structure for search engines
├── site.webmanifest       # PWA manifest
├── .htaccess              # Server configuration for SEO
├── styles.css             # Optimized CSS with critical path
└── scripts.js             # JavaScript functionality
```

## Usage

1. **Search Methods:**
   - Enter city, state, or ZIP code in search box
   - Click "Use My Location" for automatic geolocation
   - Browse "View All Store Closures" organized by state

2. **Map Interaction:**
   - Zoom in/out to see clustered vs individual stores
   - Click markers for detailed store information
   - Clusters show number of stores in each area

3. **Mobile Usage:**
   - Responsive design works on all screen sizes
   - Touch-friendly interface for mobile devices
   - Add to home screen as PWA (where supported)

## Local Development

Simply serve the files from a local web server:

```bash
# Using Python 3
python -m http.server 8000

# Using Node.js http-server
npx http-server

# Using PHP
php -S localhost:8000
```

Then open `http://localhost:8000` in your browser.

## SEO Performance Targets

The website is optimized to achieve:
- **Core Web Vitals**: Fast loading, responsive, stable
- **Mobile-First**: Optimized for mobile search
- **Local SEO**: Targeting location-based searches
- **Featured Snippets**: FAQ format for voice search optimization
- **Rich Results**: Structured data for enhanced search listings

## Deployment Considerations

For optimal SEO performance when deploying:

1. **Domain**: Use a relevant domain name like `starbucks-closures.com`
2. **HTTPS**: Enable SSL certificate for security and SEO boost
3. **CDN**: Use content delivery network for faster global loading
4. **Analytics**: Implement Google Analytics and Search Console
5. **Monitoring**: Set up uptime monitoring for reliability

## Contributing

This tool provides public information about Starbucks store closures. Data accuracy is maintained through:
- Official Starbucks announcements
- Local news verification
- Community reporting
- Regular database updates

## Disclaimer

This is an independent informational tool and is not affiliated with Starbucks Corporation. All store closure information is compiled from publicly available sources.