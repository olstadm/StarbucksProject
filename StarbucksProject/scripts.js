/**
 * Starbucks Store Closure Finder
 * A web application to help users find Starbucks stores closing permanently
 */

// Global variables
let storeData = [];           // Array to hold store data
let zipCodeData = new Map();  // Map for ZIP code to coordinates lookup
let map;                      // Leaflet map instance
let markers;                  // Marker cluster group
let userLocation = null;      // User's current location
let userMarker = null;        // Marker for user's location

/**
 * Initialize the Leaflet map with clustering
 */

function initMap() {
    map = L.map('map').setView([39.8283, -98.5795], 4); 
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: ' OpenStreetMap contributors'
    }).addTo(map);
    
    markers = L.markerClusterGroup({
        // Improved clustering for better localization
        maxClusterRadius: function(zoom) {
            // Increase cluster radius at lower zoom levels for better grouping
            // At zoom 4 (continent): radius 80px
            // At zoom 8 (state): radius 40px  
            // At zoom 12+ (city): radius 20px
            return zoom <= 6 ? 80 : zoom <= 10 ? 50 : 25;
        },
        disableClusteringAtZoom: 15, // Individual markers at city level
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
        removeOutsideVisibleBounds: true, // Performance improvement
        
        iconCreateFunction: function(cluster) {
            const count = cluster.getChildCount();
            let className, size;
            
            // Improved visual hierarchy based on cluster size
            if (count < 5) {
                className = 'marker-cluster-small';
                size = 30;
            } else if (count < 20) {
                className = 'marker-cluster-medium'; 
                size = 35;
            } else if (count < 100) {
                className = 'marker-cluster-large';
                size = 40;
            } else {
                className = 'marker-cluster-xlarge';
                size = 45;
            }
            
            return L.divIcon({
                html: `<div><span>${count}</span></div>`,
                className: `marker-cluster ${className}`,
                iconSize: L.point(size, size)
            });
        }
    });
    map.addLayer(markers);
}

async function loadStoreData() {
    try {
        // Try geocoded file first
        let response = await fetch('starbucks_geocode_filled.json');
        if (response.ok) {
            let rawData = await response.json();
            // Deduplicate by Store Number or Store ID
            const seen = new Set();
            function getLat(entry) {
                return entry.latitude ?? entry.Latitude ?? entry.LATITUDE;
            }
            function getLon(entry) {
                return entry.longitude ?? entry.Longitude ?? entry.LONGITUDE;
            }
            // Only include stores in US, CA, MX with North American coordinates
            function isNorthAmerica(entry) {
                const country = (entry.Country || "").toUpperCase();
                return country === "US" || country === "CA" || country === "MX";
            }
            function isNorthAmericaCoords(lat, lon) {
                // North America bounds updated to properly include Hawaii and Alaska
                // US Continental: 24°N-49°N, -125°W to -65°W
                // Alaska: 54°N-71°N, -180°W to -130°W
                // Hawaii: 18.9°N-22.2°N, -161°W to -154°W
                // Canada: 42°N-83°N, -141°W to -52°W  
                // Mexico: 14°N-33°N, -118°W to -86°W
                const latNum = parseFloat(lat);
                const lonNum = parseFloat(lon);
                
                // Check if coordinates are within expanded North American bounds
                // Latitude: 14°N (Mexico) to 83°N (Northern Canada)
                // Longitude: -180°W (Alaska/International Date Line) to -52°W (Eastern Canada)
                return latNum >= 14 && latNum <= 83 && lonNum >= -180 && lonNum <= -52;
            }
            storeData = rawData.filter(entry => {
                const key = entry["Store Number"] || entry["Store ID"];
                const lat = getLat(entry);
                const lon = getLon(entry);
                const state = entry["State/Province"] || entry["State"] || "";
                const country = entry["Country"] || "";
                
                if (!isNorthAmerica(entry)) {
                    console.log(`Filtered out non-North America store: ${entry["Name"]} in ${country}`);
                    return false;
                }
                
                // Must have coordinates
                if (!key || seen.has(key) || lat === undefined || lon === undefined || lat === "" || lon === "") {
                    if (!key) console.log(`Filtered out store with no ID: ${entry["Name"]}`);
                    else if (seen.has(key)) console.log(`Filtered out duplicate store: ${entry["Name"]} (${key})`);
                    else console.log(`Filtered out store with missing coordinates: ${entry["Name"]} (${key})`);
                    return false;
                }
                
                // Check if coordinates are in North America - Updated bounds to include Alaska & Hawaii
                if (!isNorthAmericaCoords(lat, lon)) {
                    console.warn(`Store ${entry["Name"]} (${key}) in ${state}, ${country} has coordinates outside North America: ${lat}, ${lon} - this might need attention`);
                    return false;
                }
                
                // Log Alaska and Hawaii stores for verification
                if (state === "AK" || state === "Alaska") {
                    console.log(`✓ Alaska store included: ${entry["Name"]} at ${lat}, ${lon}`);
                }
                if (state === "HI" || state === "Hawaii") {
                    console.log(`✓ Hawaii store included: ${entry["Name"]} at ${lat}, ${lon}`);
                }
                
                seen.add(key);
                return true;
            }).map(entry => {
                const lat = getLat(entry);
                const lon = getLon(entry);
                return {
                    store: {
                        id: entry["Store ID"],
                        storeNumber: entry["Store Number"],
                        name: entry["Name"],
                        address: {
                            streetAddressLine1: entry["Street"],
                            city: entry["City"],
                            countrySubdivisionCode: entry["State"],
                            postalCode: entry["Postal Code"] || "",
                            country: entry["Country"]
                        },
                        coordinates: {
                            latitude: parseFloat(lat),
                            longitude: parseFloat(lon)
                        }
                    }
                };
            });
            populateMap();
            populateAllStoresModal();
            return;
        }
        // Fallback to merged file
        response = await fetch('starbucks_stores_merged.json');
        if (response.ok) {
            let rawData = await response.json();
            const seen = new Set();
            storeData = rawData.filter(entry => {
                const key = entry["Store Number"] || entry["Store ID"];
                if (!key || seen.has(key)) return false;
                seen.add(key);
                return true;
            }).map(entry => ({
                store: {
                    id: entry["Store ID"],
                    storeNumber: entry["Store Number"],
                    name: entry["Name"],
                    address: {
                        streetAddressLine1: entry["Street"],
                        city: entry["City"],
                        countrySubdivisionCode: entry["State"],
                        postalCode: entry["Postal Code"] || "",
                        country: entry["Country"]
                    },
                    coordinates: entry.latitude && entry.longitude ? {
                        latitude: parseFloat(entry.latitude),
                        longitude: parseFloat(entry.longitude)
                    } : undefined
                }
            }));
            populateMap();
            populateAllStoresModal();
            return;
        }
        // Fallback to old file
        response = await fetch('sunday_closed_stores_detailed.json');
        if (response.ok) {
            storeData = await response.json();
            populateMap();
            populateAllStoresModal();
        } else {
            loadSampleData();
        }
    } catch (error) {
        console.log('Could not load store data, using sample data', error);
        loadSampleData();
    }
}

async function loadZipData() {
    try {
        const response = await fetch('USZipsWithLatLon_20231227.csv');
        const text = await response.text();
        text.split('\n').forEach(line => {
            const parts = line.split(',');
            if(parts.length > 8) {
                const zip = parts[1].trim();
                const lat = parseFloat(parts[7]);
                const lon = parseFloat(parts[8]);
                const name = `${parts[2]}, ${parts[4]}`;
                if(zip && !isNaN(lat) && !isNaN(lon)) {
                    zipCodeData.set(zip, { lat, lon, name });
                }
            }
        });
        console.log(`Successfully loaded ${zipCodeData.size} zip codes.`);
    } catch (error) {
        console.warn('Could not load us_zip_codes.csv. Zip code search will rely on API.', error);
    }
}

function loadSampleData() {
    storeData = [
        { store: { id: "1025107", storeNumber: "5265-289906", name: "2nd & F St", address: { streetAddressLine1: "623 2nd St", city: "Davis", countrySubdivisionCode: "CA", postalCode: "95616" }, coordinates: { latitude: 38.54359, longitude: -121.74013 } } },
        { store: { id: "10769", storeNumber: "9595-107359", name: "Jefferson & Lincoln", address: { streetAddressLine1: "1200 Lincoln Ave", city: "Napa", countrySubdivisionCode: "CA", postalCode: "94558" }, coordinates: { latitude: 38.30873, longitude: -122.29545 } } }
    ];
    populateMap();
    populateAllStoresModal();
}

function populateMap() {
    markers.clearLayers();
    storeData.forEach(storeEntry => {
        const store = storeEntry.store;
        if (store.coordinates) {
            const marker = L.marker([store.coordinates.latitude, store.coordinates.longitude])
                .bindPopup(`<div><h3 style="color: var(--house-green); margin-bottom: 0.5rem;">${store.name}</h3><p><strong>Store #:</strong> ${formatStoreNumber(store.storeNumber)}</p><p><strong>Address:</strong><br>${formatAddress(store.address)}</p></div>`);
            markers.addLayer(marker);
        }
    });
}

function formatAddress(address) {
    return `${address.streetAddressLine1 || ''}<br>${address.city || ''}, ${address.countrySubdivisionCode || ''} ${address.postalCode || ''}`;
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

function addUserLocationMarker(lat, lon, name) {
    if (userMarker) {
        map.removeLayer(userMarker);
    }
    userMarker = L.marker([lat, lon], {
        icon: L.divIcon({
            html: '<div style="background: #c00; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.5);"></div>',
            iconSize: [16, 16],
            className: 'user-location-marker'
        })
    }).addTo(map).bindPopup(`Your location: ${name}`);
}

function setLocation(lat, lon, name) {
    userLocation = { lat, lon };
    map.setView(userLocation, 10);
    addUserLocationMarker(lat, lon, name);
    const nearbyStores = findNearbyStores(lat, lon, 50);
    displayNearbyStores(nearbyStores);
}

async function searchStores(query) {
    const trimmedQuery = query.trim();
    // Rate limiting: only allow one API call per second
    if (typeof window.lastLocationSearchTime === 'undefined') {
        window.lastLocationSearchTime = 0;
    }
    const now = Date.now();
    if (now - window.lastLocationSearchTime < 1000) {
        alert('Please wait a moment before searching again.');
        return;
    }
    window.lastLocationSearchTime = now;

    if (/^\d{5}$/.test(trimmedQuery) && zipCodeData.has(trimmedQuery)) {
        const loc = zipCodeData.get(trimmedQuery);
        setLocation(loc.lat, loc.lon, loc.name);
        return;
    }
    if (window.location.protocol.startsWith('http')) {
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(trimmedQuery)}&countrycodes=us&limit=1`);
            const data = await response.json();
            if (data.length > 0) {
                const { lat, lon, display_name } = data[0];
                setLocation(parseFloat(lat), parseFloat(lon), display_name);
                return;
            }
        } catch (error) {
            console.warn('Nominatim API failed, trying hardcoded fallback.', error);
        }
    }
    if (!tryFallbackSearch(trimmedQuery)) {
        alert('Location not found. Please try a different city, state, or zip code.');
    }
}

function tryFallbackSearch(query) {
    const locations = {
        'seattle': { lat: 47.6062, lon: -122.3321, name: 'Seattle, WA' },
        'chicago': { lat: 41.8781, lon: -87.6298, name: 'Chicago, IL' },
        'new york': { lat: 40.7128, lon: -74.0060, name: 'New York, NY' }
    };
    const queryLower = query.toLowerCase();
    if (locations[queryLower]) {
        const loc = locations[queryLower];
        setLocation(loc.lat, loc.lon, loc.name);
        return true;
    }
    return false;
}

function formatStoreNumber(storeNumber) {
    if (!storeNumber) return 'Unknown';
    return storeNumber.split('-')[0];
}

function findNearbyStores(lat, lon, radiusMiles) {
    return storeData
        .map(storeEntry => {
            const store = storeEntry.store;
            if (!store.coordinates) return null;
            const distance = calculateDistance(lat, lon, store.coordinates.latitude, store.coordinates.longitude);
            return { ...storeEntry, distance };
        })
        .filter(store => store && store.distance <= radiusMiles)
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 10);
}

function displayNearbyStores(stores) {
    const storesList = document.getElementById('storesList');
    if (stores.length === 0) {
        storesList.innerHTML = `<div class="placeholder-card"><div class="placeholder-icon">❌</div><h3>No Stores Found Nearby</h3><p>No Sunday-closed stores were found within 50 miles.</p></div>`;
        return;
    }
    storesList.innerHTML = stores.map(storeEntry => {
        const { store, distance } = storeEntry;
        return `
            <div class="store-card" onclick="centerOnStore(${store.coordinates.latitude}, ${store.coordinates.longitude})">
                <div class="store-name">
                    ${store.name}
                    <span class="distance">${distance.toFixed(1)} mi</span>
                </div>
                <div class="store-address">${formatAddress(store.address)}</div>
                <div class="store-number">Store #${formatStoreNumber(store.storeNumber)}</div>
            </div>
        `;
    }).join('');
}

function centerOnStore(lat, lon) {
    map.setView([lat, lon], 15);
}

function populateAllStoresModal() {
    const storesByState = storeData.reduce((acc, storeEntry) => {
        const state = storeEntry.store.address?.countrySubdivisionCode || 'Unknown';
        if (!acc[state]) acc[state] = [];
        acc[state].push(storeEntry.store);
        return acc;
    }, {});
    const allStoresList = document.getElementById('allStoresList');
    allStoresList.innerHTML = Object.keys(storesByState).sort().map(state => `
        <div class="state-section">
            <div class="state-title">${state} (${storesByState[state].length} stores)</div>
            <div class="state-stores">
                ${storesByState[state].map(store => `
                    <div class="state-store-item" onclick="centerOnStore(${store.coordinates?.latitude || 0}, ${store.coordinates?.longitude || 0}); closeModal();">
                        <strong>${store.name}</strong><br>
                        <small>${formatAddress(store.address)} | Store #${formatStoreNumber(store.storeNumber)}</small>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
}

// Removed top-level openModal and closeModal; use window.openModal/closeModal defined in DOMContentLoaded

document.getElementById('searchInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        const query = this.value.trim();
        if (query) searchStores(query);
    }
});

window.onclick = function(event) {
    const modal = document.getElementById('storesModal');
    if (event.target === modal) closeModal();
}

document.addEventListener('DOMContentLoaded', () => {
    // Modal fade in/out and click outside to close
    var modal = document.getElementById('storesModal');
    var closeBtn = document.querySelector('.close');
    // Open modal with fade
    window.openModal = function() {
        modal.classList.add('show');
    };
    // Close modal with fade
    window.closeModal = function() {
        modal.classList.remove('show');
    };
    // Click outside to close
    window.onclick = function(event) {
        if (event.target === modal) {
            closeModal();
        }
    };
    // Ensure close button always visible
    if (closeBtn) {
        closeBtn.style.position = 'sticky';
        closeBtn.style.top = '0';
        closeBtn.style.right = '0';
        closeBtn.style.zIndex = '10';
    }
    initMap();
    loadStoreData();
    loadZipData();
    // Geolocation button handler
    const geoBtn = document.getElementById('geoLocateBtn');
    if (geoBtn && navigator.geolocation) {
        geoBtn.addEventListener('click', () => {
            geoBtn.disabled = true;
            geoBtn.textContent = 'Locating...';
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const lat = pos.coords.latitude;
                    const lon = pos.coords.longitude;
                    setLocation(lat, lon, 'Your Device Location');
                    geoBtn.textContent = 'Use My Location';
                    geoBtn.disabled = false;
                },
                (err) => {
                    alert('Could not get your location: ' + err.message);
                    geoBtn.textContent = 'Use My Location';
                    geoBtn.disabled = false;
                }
            );
        });
    } else if (geoBtn) {
        geoBtn.disabled = true;
        geoBtn.textContent = 'Geolocation Not Supported';
    }
});
