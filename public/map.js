var map;
var editMode = false;
function colorGradient(fadeFraction, rgbColor1, rgbColor2, rgbColor3) {
  var color1 = rgbColor1;
  var color2 = rgbColor2;
  var fade = fadeFraction;

  // Do we have 3 colors for the gradient? Need to adjust the params.
  if (rgbColor3) {
    fade = fade * 2;

    // Find which interval to use and adjust the fade percentage
    if (fade >= 1) {
      fade -= 1;
      color1 = rgbColor2;
      color2 = rgbColor3;
    }
  }

  var diffRed = color2.red - color1.red;
  var diffGreen = color2.green - color1.green;
  var diffBlue = color2.blue - color1.blue;

  var gradient = {
    red: parseInt(Math.floor(color1.red + diffRed * fade), 10),
    green: parseInt(Math.floor(color1.green + diffGreen * fade), 10),
    blue: parseInt(Math.floor(color1.blue + diffBlue * fade), 10),
  };

  return (
    "rgb(" + gradient.red + "," + gradient.green + "," + gradient.blue + ")"
  );
}

async function initMap(kukak) {
  const { Map } = await google.maps.importLibrary("maps");
  const { LatLngAltitude } = await google.maps.importLibrary("core");
  map = new Map(document.getElementById("map"), {
    center: { lat: 47.6858428, lng: 16.5926058 },
    zoom: 13,
    mapId: "ed05c72e4ce17fc1",
  });

  kukak.forEach((kuka) => {
    console.log(kuka, parseFloat(kuka.location_x), parseFloat(kuka.location_y));
    createMarker(
      new LatLngAltitude({
        lat: parseFloat(kuka.location_x),
        lng: parseFloat(kuka.location_y),
      }),
      getIcon(kuka),
      kuka
    );
  });
}

function getIcon(kuka) {
  const div = document.createElement("div");
  div.classList.add("trash");
  const color = colorGradient(
    kuka.allapot / 100.0,
    { red: 0, green: 255, blue: 0 },
    { red: 255, green: 255, blue: 0 },
    { red: 255, green: 0, blue: 0 }
  );
  console.log(color);
  div.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="${color}" viewBox="0 0 448 512"><!--!Font Awesome Free 6.5.2 by @fontawesome - https://fontawesome.com/ License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z"/></svg>`;
  return div;
}
async function placeMarker(location) {
  const { AdvancedMarkerElement, PinElement } =
    await google.maps.importLibrary("marker");
  const response = fetch(`${HOST}/uj-kuka`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      location_x: location.lat(),
      location_y: location.lng(),
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.error) {
        alert(data.error);
      } else {
        createMarker(location, getIcon(data), data);
      }
      console.log("Success:", data);
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}

async function createMarker(position, content, data) {
  const { AdvancedMarkerElement, PinElement } =
    await google.maps.importLibrary("marker");
  var marker = new AdvancedMarkerElement({
    position,
    map: map,
    title: "Click to zoom",
    content,
    gmpDraggable: editMode,
  });
  marker.addListener("click", () => {
    //toggleHighlight(AdvancedMarkerElement, property);
  });
  let startPosition;
  marker.addListener("dragstart", (event) => {
    startPosition = event.latLng;
  });
  marker.addListener("dragend", (event) => {
    const { lat, lng } = event.latLng.toJSON();
    const modal = document.getElementById("loading");
    const timer = setTimeout(() => {
      modal.showModal();
    }, 500);
    fetch(`${HOST}/kuka/${data.id}/szerkesztes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        location_x: lat,
        location_y: lng,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) return;
        alert("Hiba történt a mentés során");
        marker.position = startPosition;
      })
      .catch((error) => {
        marker.position = startPosition;
        alert("Hiba történt a mentés során");
        console.error("Error:", error);
      })
      .finally(() => {
        modal.close();
        clearTimeout(timer);
      });
  });
}
