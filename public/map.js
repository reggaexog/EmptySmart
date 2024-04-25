var map;
var editMode = false;
var userMode = false;
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
function getColor(kuka) {
  return colorGradient(
    kuka.allapot / 100.0,
    { red: 0, green: 255, blue: 0 },
    { red: 255, green: 255, blue: 0 },
    { red: 255, green: 0, blue: 0 }
  );
}
function getIcon(kuka) {
  const div = document.createElement("div");
  div.classList.add("trash");
  div.style.setProperty("--shadow-color", getColor(kuka));
  const color = getColor(kuka);
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
    if (editMode) {
      document.getElementById("edit-kuka-id").innerHTML = data.id;
      document
        .getElementById("kuka-urites-btn")
        .setAttribute("data-id", data.id);
      document
        .getElementById("kuka-torles-btn")
        .setAttribute("data-id", data.id);
      document.getElementById("edit-kuka-progress-text").innerHTML =
        data.allapot + "%";
      document.getElementById("edit-kuka-jelzesek").innerHTML =
        data.jelzesek_count;
      document.getElementById("edit-kuka-progress").style.width =
        data.allapot + "%";
      document.getElementById("edit-kuka-progress").style.backgroundColor =
        getColor(data);
      const date = new Date(data.legutobbi_urites);
      document.getElementById("edit-kuka-urites").innerHTML =
        date.getTime() !== 0
          ? date.toLocaleString("hu-HU")
          : "Nem volt még ürítés";
      const bsOffcanvas = new bootstrap.Offcanvas("#edit-kuka");
      bsOffcanvas.show();
    }
    if (userMode) {
      document.getElementById("details-kuka-id").innerHTML = data.id;
      document
        .getElementById("kuka-jelzes-btn")
        .setAttribute("data-id", data.id);
      document.getElementById("details-kuka-progress-text").innerHTML =
        data.allapot + "%";
      document.getElementById("details-kuka-jelzesek").innerHTML =
        data.jelzesek_count;
      document.getElementById("details-kuka-progress").style.width =
        data.allapot + "%";
      document.getElementById("details-kuka-progress").style.backgroundColor =
        getColor(data);
      const date = new Date(data.legutobbi_urites);
      document.getElementById("details-kuka-urites").innerHTML =
        date.getTime() !== 0
          ? date.toLocaleString("hu-HU")
          : "Nem volt még ürítés";
      const bsOffcanvas = new bootstrap.Offcanvas("#details-kuka");
      bsOffcanvas.show();
    }
  });
  let startPosition;
  marker.addListener("dragstart", (event) => {
    startPosition = event.latLng;
  });
  marker.addListener("dragend", (event) => {
    const { lat, lng } = event.latLng.toJSON();
    if (lat == startPosition.lat() && lng == startPosition.lng()) return;
    const confirmState = confirm("Biztosan modozítja a kukát?");
    if (!confirmState) {
      return (marker.position = startPosition);
    }
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

function kukaUrites() {
  if (!confirm("Biztosan üríti a kukát?")) return;
  const id = document.getElementById("kuka-urites-btn").getAttribute("data-id");
  const modal = document.getElementById("loading");
  const timer = setTimeout(() => {
    modal.showModal();
  }, 500);
  fetch(`${HOST}/kuka/${id}/urites`, {
    method: "POST",
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        window.location.reload();
        return;
      }
      alert("Hiba történt az ürítés során");
    })
    .catch((error) => {
      alert("Hiba történt az ürítés során");
      console.error("Error:", error);
    })
    .finally(() => {
      modal.close();
      clearTimeout(timer);
    });
}
function kukaTorles() {
  if (!confirm("Biztosan törli a kukát?")) return;
  const id = document.getElementById("kuka-torles-btn").getAttribute("data-id");
  const modal = document.getElementById("loading");
  const timer = setTimeout(() => {
    modal.showModal();
  }, 500);
  fetch(`${HOST}/kuka/${id}/torles`, {
    method: "POST",
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        window.location.reload();
        return;
      }
      alert("Hiba történt a törlés során");
    })
    .catch((error) => {
      alert("Hiba történt a törlés során");
      console.error("Error:", error);
    })
    .finally(() => {
      modal.close();
      clearTimeout(timer);
    });
}

function kukaJelzes() {
  if (!confirm("Biztosan szeretnéd jelezni?")) return;
  const id = document.getElementById("kuka-jelzes-btn").getAttribute("data-id");
  const modal = document.getElementById("loading");
  const timer = setTimeout(() => {
    modal.showModal();
  }, 500);
  fetch(`${HOST}/kuka/${id}/jelzes`, {
    method: "POST",
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        alert("Sikeresen leadtad a drótot!");
        window.location.reload();
        return;
      }
      alert(data.error);
    })
    .catch((error) => {
      alert("Hiba történt a jelezés során");
      console.error("Error:", error);
    })
    .finally(() => {
      modal.close();
      clearTimeout(timer);
    });
}
