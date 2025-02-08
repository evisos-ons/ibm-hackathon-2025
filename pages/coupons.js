// Load Google Maps dynamically
function loadGoogleMaps() {
    const script = document.createElement("script");
    script.src = "https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=places&callback=initMap";
    script.defer = true;
    document.head.appendChild(script);
}

// Initialize Map
function initMap() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
            const userLocation = { lat: position.coords.latitude, lng: position.coords.longitude };

            // Create Map
            const mapDiv = document.createElement("div");
            mapDiv.id = "map";
            mapDiv.style.height = "400px";
            mapDiv.style.width = "100%";
            document.body.appendChild(mapDiv);

            const map = new google.maps.Map(mapDiv, { center: userLocation, zoom: 14 });

            // Find Nearby Stores
            const service = new google.maps.places.PlacesService(map);
            service.nearbySearch({
                location: userLocation,
                radius: 3000,  // 3km range
                type: ['store'],
                keyword: 'student discount'
            }, (results, status) => {
                if (status === google.maps.places.PlacesServiceStatus.OK) {
                    displayCoupons(results);
                }
            });
        }, () => {
            alert("Location access denied.");
        });
    } else {
        alert("Geolocation is not supported.");
    }
}

// Display Coupons
function displayCoupons(stores) {
    const couponSection = document.createElement("div");
    couponSection.innerHTML = `<h3>Available Coupons</h3>`;
    document.body.appendChild(couponSection);

    const coupons = [
        { store: "Pizza Hut", discount: "20% off", code: "STUDENT20" },
        { store: "Starbucks", discount: "Free Coffee", code: "COFFEEFREE" },
        { store: "Nike Store", discount: "10% off", code: "NIKE10" }
    ];

    stores.forEach((store, index) => {
        if (index < coupons.length) {
            const coupon = coupons[index];
            const couponDiv = document.createElement("div");
            couponDiv.style.border = "1px solid #ccc";
            couponDiv.style.padding = "10px";
            couponDiv.style.margin = "10px";
            couponDiv.style.borderRadius = "5px";
            couponDiv.style.background = "#f9f9f9";

            couponDiv.innerHTML = `
                <strong>${coupon.store}</strong> (${store.vicinity})<br>
                <em>${coupon.discount}</em><br>
                Code: <strong>${coupon.code}</strong><br>
                <button onclick="redeemCoupon(this)" style="background: green; color: white; border: none; padding: 5px 10px; cursor: pointer;">Redeem</button>
            `;
            couponSection.appendChild(couponDiv);
        }
    });
}

// Redeem Coupon
function redeemCoupon(button) {
    button.textContent = "Redeemed";
    button.style.background = "gray";
    button.disabled = true;
}

// Load Google Maps API
loadGoogleMaps();
