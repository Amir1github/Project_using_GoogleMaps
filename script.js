let map, infoWindow, locationMarker, accuracyCircle, directionsService, directionsRenderer;
const info_win = document.querySelector(".info_window");
const info_exit = document.querySelector("#info_exit");

function adjustMapHeight() {
    const infoHeight = info_win.offsetHeight; 
    const mapElement = document.querySelector("#map");
    mapElement.style.height = `calc(100% - ${infoHeight}px)`;
}

function initMap() {
    const mapStyle = [
        { featureType: "poi", stylers: [{ visibility: "off" }] },
        { featureType: "transit", stylers: [{ visibility: "off" }] },
        { featureType: "road", stylers: [{ visibility: "simplified" }] },
    ];

    map = new google.maps.Map(document.querySelector("#map"), {
        center: { lat: 38.5358, lng: 68.7791 },
        zoom: 12,
        styles: mapStyle,
        mapTypeControl: false,
        streetViewControl: false,
        zoomControl: false,
        fullscreenControl: false
    });

    infoWindow = new google.maps.InfoWindow();
    infoWindow.setOptions({
        pixelOffset: new google.maps.Size(0, -15), // Настройка смещения окна
        maxWidth: 300, // Максимальная ширина
    });
    
    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer();
    directionsRenderer.setMap(map);

    createCustomButtons();
    setupLocations();
    initializeUserLocation();
}

function createCustomButtons() {
    const locationButton = createButton("Где я?");
    const nearestPlaceButton = createButton("Ближайшее место");

    map.controls[google.maps.ControlPosition.TOP_LEFT].push(locationButton);
    map.controls[google.maps.ControlPosition.TOP_LEFT].push(nearestPlaceButton);

    locationButton.addEventListener("click", handleLocationButtonClick);
    nearestPlaceButton.addEventListener("click", handleNearestPlaceButtonClick);
}

function createButton(text) {
    const button = document.createElement("button");
    button.textContent = text;
    button.classList.add("custom-map-control-button");
    return button;
}

function handleLocationButtonClick() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const pos = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                };
                showUserLocation(pos);
            },
            () => handleLocationError(true)
        );
    } else {
        handleLocationError(false);
    }
}

function handleNearestPlaceButtonClick() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const userLocation = { lat: position.coords.latitude, lng: position.coords.longitude };
                const nearestLocation = findNearestLocation(userLocation);
                if (nearestLocation) {
                    map.setCenter(nearestLocation);
                    infoWindow.setPosition(nearestLocation);
                    infoWindow.setContent(`Ближайшее место: ${nearestLocation.title}`);
                    infoWindow.open(map);
                }
            },
            () => handleLocationError(true)
        );
    } else {
        handleLocationError(false);
    }
}

function showUserLocation(pos) {
    infoWindow.setPosition(pos);
    infoWindow.setContent("Ваша локация");
    infoWindow.open(map);
    map.setCenter(pos);
}

function setupLocations() {
    const locations = [
        { lat: 38.5358, lng: 68.7791, title: "Адрес 1: Главный офис" },
        { lat: 38.5522, lng: 68.7847, title: "Адрес 2: Филиал 1" },
        { lat: 38.5395, lng: 68.7731, title: "Адрес 3: Филиал 2" }
    ];

    locations.forEach((location) => createLocationMarker(location));
}

function createLocationMarker(location) {
    const marker = new google.maps.Marker({
        position: { lat: location.lat, lng: location.lng },
        map: map,
        title: location.title,
        icon: {
            url: './img/restroom_icon.png',
            scaledSize: new google.maps.Size(30, 28),
        },
    });

    marker.addListener("click", () => handleMarkerClick(location, marker));
}
let routeButtonClickHandler = null;
function clearInfoWindow() {
    info_win.querySelectorAll(".info_window > :not(#info_exit) :not(#info_title)").forEach(element => element.remove());
}
function handleMarkerClick(location, marker) {
    clearInfoWindow();
    document.getElementById('info_title').innerText = location.title;
    
    info_win.style = "height:300px; display:block";
    
    adjustMapHeight();
    
    if (routeButtonClickHandler) {
        document.querySelector("#route-btn").removeEventListener("click", routeButtonClickHandler);
    }

    routeButtonClickHandler = () => calculateRouteToMarker(marker.getPosition());
    document.querySelector("#route-btn").addEventListener("click", routeButtonClickHandler);
}

function calculateRouteToMarker(destination) {
    if (locationMarker) {
        const request = {
            origin: locationMarker.getPosition(),
            destination: destination,
            travelMode: google.maps.TravelMode.WALKING
        };

        directionsService.route(request, (result, status) => {
            if (status === google.maps.DirectionsStatus.OK) {
                directionsRenderer.setDirections(result);
            } else {
                alert("Не удалось построить маршрут: " + status);
            }
        });
    } else {
        alert("Текущее местоположение не найдено.");
    }
    info_win.style.display = "none";
    info_win.style.height = "0px";
    adjustMapHeight(); // Изменяем высоту карты
}
function findNearestLocation(userLocation) {
    const locations = [
        { lat: 38.5358, lng: 68.7791, title: "Адрес 1: Главный офис" },
        { lat: 38.5522, lng: 68.7847, title: "Адрес 2: Филиал 1" },
        { lat: 38.5395, lng: 68.7731, title: "Адрес 3: Филиал 2" }
    ];

    let nearestLocation = null;
    let shortestDistance = Infinity;

    locations.forEach((location) => {
        const distance = google.maps.geometry.spherical.computeDistanceBetween(
            new google.maps.LatLng(userLocation.lat, userLocation.lng),
            new google.maps.LatLng(location.lat, location.lng)
        );
        if (distance < shortestDistance) {
            shortestDistance = distance;
            nearestLocation = location;
        }
    });

    return nearestLocation;
}

function initializeUserLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const pos = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                };

                if (locationMarker) locationMarker.setMap(null);
                if (accuracyCircle) accuracyCircle.setMap(null);

                locationMarker = new google.maps.Marker({
                    position: pos,
                    map: map,
                    icon: {
                        path: google.maps.SymbolPath.CIRCLE,
                        scale: 8,
                        fillColor: "#4285F4",
                        fillOpacity: 1,
                        strokeColor: "#ffffff",
                        strokeWeight: 2,
                    },
                    title: "Вы здесь",
                });

                accuracyCircle = new google.maps.Circle({
                    strokeColor: "#4285F4",
                    strokeOpacity: 0.5,
                    strokeWeight: 1,
                    fillColor: "#4285F4",
                    fillOpacity: 0.2,
                    map,
                    center: pos,
                    radius: position.coords.accuracy,
                });

                map.setCenter(pos);
            },
            () => handleLocationError(true)
        );
    } else {
        handleLocationError(false);
    }
}

function handleLocationError(browserHasGeolocation) {
    infoWindow.setPosition(map.getCenter());
    infoWindow.setContent(
        browserHasGeolocation
            ? "Ошибка: Сервис геолокации не работает."
            : "Ошибка: Ваш браузер не поддерживает геолокацию."
    );
    infoWindow.open(map);
}

info_exit.addEventListener('click', () => {
    info_win.style.display = "none";
    info_win.style.height = "0px";
    adjustMapHeight(); // Изменяем высоту карты
});

new ResizeObserver(adjustMapHeight).observe(info_win);

window.initMap = initMap;
