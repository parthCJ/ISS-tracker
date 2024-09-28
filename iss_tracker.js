const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the current directory
app.use(express.static(__dirname));

// Serve index.html for the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});
function initializeISSTracker() {
    let map, issMarker;

    const issIcon = L.icon({
        iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/d0/International_Space_Station.svg',
        iconSize: [50, 30],
        iconAnchor: [25, 15]
    });

    // Initialize map and start loading ISS position immediately
    window.onload = async function() {
        initMap();
        showLoadingIndicator();
        await updateISSPosition();
        hideLoadingIndicator();
        document.getElementById('start-button').addEventListener('click', startTracking);
    };

    function initMap() {
        map = L.map('map').setView([0, 0], 3);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        issMarker = L.marker([0, 0], {icon: issIcon}).addTo(map);

        // Remove the call to addOceanLabels()
        // addOceanLabels();
    }

    // Remove the entire addOceanLabels function
    // function addOceanLabels() {
    //     ...
    // }

    async function updateISSPosition() {
        try {
            const response = await fetch('http://api.open-notify.org/iss-now.json');
            const data = await response.json();
            const { latitude, longitude } = data.iss_position;
            
            issMarker.setLatLng([latitude, longitude]);
            
            // Use flyTo for smoother animation
            map.flyTo([latitude, longitude], map.getZoom(), {
                duration: 3,  // Increase duration for smoother movement
                easeLinearity: 0.5
            });
            
            // Check if ISS is over India
            if (isOverIndia(parseFloat(latitude), parseFloat(longitude))) {
                showIndiaWarning();
            } else {
                hideIndiaWarning();
            }
            
            // Update IST time
            updateISTTime();
            
        } catch (error) {
            console.error('Error fetching ISS position:', error);
        }
    }

    function startTracking() {
        document.getElementById('main-menu').style.display = 'none';
        setInterval(updateISSPosition, 5000);
        fetchAstronauts();
        setInterval(fetchAstronauts, 60000);
        updateISTTime();
        setInterval(updateISTTime, 1000);
    }

    function showLoadingIndicator() {
        // Add code to show a loading spinner or message
    }

    function hideLoadingIndicator() {
        // Add code to hide the loading spinner or message
    }

    // Function to get astronauts on ISS and display them on the map
    async function getAstronauts() {
        try {
            const response = await fetch('http://api.open-notify.org/astros.json');
            const data = await response.json();
            const issAstronauts = data.people.filter(person => person.craft === 'ISS');
            
            // Update astronaut list
            const astronautList = document.getElementById('astronaut-names');
            astronautList.innerHTML = '';
            issAstronauts.forEach(astronaut => {
                const listItem = document.createElement('li');
                const link = document.createElement('a');
                link.textContent = astronaut.name;
                link.href = `https://en.wikipedia.org/wiki/${encodeURIComponent(astronaut.name.replace(' ', '_'))}`;
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                listItem.appendChild(link);
                astronautList.appendChild(listItem);
            });

            // Get the current ISS position
            const issPosition = issMarker.getLatLng();
            
            // Remove existing astronaut markers, but keep the ISS marker
            map.eachLayer((layer) => {
                if (layer instanceof L.Marker && layer !== issMarker) {
                    map.removeLayer(layer);
                }
            });

            // Add astronaut markers
            issAstronauts.forEach((astronaut, index) => {
                const angle = (index / issAstronauts.length) * 2 * Math.PI;
                const x = Math.cos(angle) * 0.1;
                const y = Math.sin(angle) * 0.1;
                const markerPosition = [issPosition.lat + y, issPosition.lng + x];

                L.marker(markerPosition)
                    .addTo(map)
                    .bindPopup(astronaut.name);
            });
        } catch (error) {
            console.error('Error fetching astronaut data:', error);
        }
    }

    // Function to create a falling star effect
    function createFallingStar() {
        const star = document.createElement('div');
        star.className = 'falling-star';
        
        // Random starting position
        const startX = Math.random() * window.innerWidth;
        const startY = -10;
        
        // Random ending position (always below the starting point)
        const endX = startX + (Math.random() - 0.5) * 200;
        const endY = window.innerHeight + 10;
        
        star.style.left = `${startX}px`;
        star.style.top = `${startY}px`;
        
        document.body.appendChild(star);
        
        // Animate the falling star
        const animation = star.animate([
            { transform: `translate(0, 0)` },
            { transform: `translate(${endX - startX}px, ${endY - startY}px)` }
        ], {
            duration: 1000,
            easing: 'ease-in'
        });
        
        animation.onfinish = () => {
            star.remove();
        };
    }

    // Function to update IST time
    function updateISTTime() {
        const istTime = new Date().toLocaleString('en-US', { 
            timeZone: 'Asia/Kolkata',
            hour12: true,
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric'
        });
        document.getElementById('ist-time').textContent = `IST: ${istTime}`;
    }

    // Function to return to main menu
    function returnToMainMenu() {
        // Hide the map and other elements
        document.getElementById('map').style.display = 'none';
        document.getElementById('astronaut-list').style.display = 'none';
        document.getElementById('ist-time').style.display = 'none';
        document.getElementById('main-menu-button').style.display = 'none';

        // Show the main menu
        document.getElementById('main-menu').style.display = 'flex';

        // Clear intervals
        clearAllIntervals();
    }

    // Function to clear all intervals
    function clearAllIntervals() {
        // Clear all intervals (you may need to keep track of interval IDs if you want to clear specific ones)
        for (let i = 1; i < 99999; i++) {
            window.clearInterval(i);
        }
    }

    // Function to start the app
    function startApp() {
        // Hide the main menu
        document.getElementById('main-menu').style.display = 'none';

        // Show the astronaut list with sliding animation
        const astronautList = document.getElementById('astronaut-list');
        astronautList.style.display = 'block';
        setTimeout(() => {
            astronautList.style.right = '10px';
        }, 100);

        // Show the IST time
        document.getElementById('ist-time').style.display = 'block';

        // Update ISS position and astronaut data every 3 seconds
        setInterval(() => {
            updateISSPosition();
            getAstronauts();
        }, 3000);  // Changed from 5000 to 3000

        // Update IST time every second
        setInterval(updateISTTime, 1000);

        // Add event listener for the "Know about ISS" button
        const knowIssButton = document.getElementById('know-iss-button');
        knowIssButton.addEventListener('click', () => {
            // Add click animation
            knowIssButton.style.transform = 'scale(0.95)';
            setTimeout(() => {
                knowIssButton.style.transform = 'scale(1.05)';
            }, 100);
            setTimeout(() => {
                knowIssButton.style.transform = 'scale(1)';
            }, 200);

            // Open Wikipedia page
            setTimeout(() => {
                window.open('https://en.wikipedia.org/wiki/International_Space_Station', '_blank');
            }, 300);
        });

        // Initial updates
        updateISSPosition().then(() => {
            // Zoom effect on the ISS
            const issPosition = issMarker.getLatLng();
            map.flyTo(issPosition, 6, {
                duration: 2,
                easeLinearity: 0.25
            });
        });
        getAstronauts();
        updateISTTime();

        // Create falling star effect every 8 seconds
        setInterval(createFallingStar, 8000);

        // Initial falling star
        createFallingStar();

        // Zoom effect
        setTimeout(() => {
            map.setZoom(4, {animate: true});
        }, 1000);
    }

    // Add event listener to the start button
    document.getElementById('start-button').addEventListener('click', startApp);

    // Add event listener to the main menu button
    document.getElementById('main-menu-button').addEventListener('click', () => {
        // Add click animation
        const button = document.getElementById('main-menu-button');
        button.style.transform = 'scale(0.95)';
        setTimeout(() => {
            button.style.transform = 'scale(1.05)';
        }, 100);
        setTimeout(() => {
            button.style.transform = 'scale(1)';
        }, 200);

        // Return to main menu after animation
        setTimeout(returnToMainMenu, 300);
    });

    // Initially hide the main menu button
    document.getElementById('main-menu-button').style.display = 'none';

    // Initially hide the astronaut list and IST time
    document.getElementById('astronaut-list').style.display = 'none';
    document.getElementById('ist-time').style.display = 'none';

    // Show the info container with sliding animation
    const infoContainer = document.getElementById('info-container');
    infoContainer.style.display = 'block';
    setTimeout(() => {
        infoContainer.style.right = '10px';
    }, 100);

    function isOverIndia(lat, lon) {
        // Approximate bounding box for India
        return lat >= 6.5 && lat <= 35.5 && lon >= 68.7 && lon <= 97.25;
    }

    function showIndiaWarning() {
        let warningElement = document.getElementById('india-warning');
        if (!warningElement) {
            warningElement = document.createElement('div');
            warningElement.id = 'india-warning';
            warningElement.style.position = 'absolute';
            warningElement.style.top = '10px';
            warningElement.style.left = '50%';
            warningElement.style.transform = 'translateX(-50%)';
            warningElement.style.backgroundColor = 'rgba(255, 255, 0, 0.8)';
            warningElement.style.padding = '10px';
            warningElement.style.borderRadius = '5px';
            warningElement.style.zIndex = '1000';
            warningElement.style.fontFamily = "'JetBrains Mono', monospace";
            warningElement.style.fontWeight = 'bold';
            document.body.appendChild(warningElement);
        }
        warningElement.textContent = 'Warning: ISS is above India!';
        warningElement.style.display = 'block';
    }

    function hideIndiaWarning() {
        const warningElement = document.getElementById('india-warning');
        if (warningElement) {
            warningElement.style.display = 'none';
        }
    }
}

// Remove the DOMContentLoaded event listener from iss_tracker.js
// as it's now handled in index.html
