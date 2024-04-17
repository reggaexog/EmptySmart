
const kukaIcons = document.querySelectorAll(".kuka-icon");

kukaIcons.forEach(icon => {
    icon.addEventListener("mouseover", () => {
        const tooltip = icon.querySelector(".tooltip");
        tooltip.style.display = "block";
    });

    icon.addEventListener("mouseout", () => {
        const tooltip = icon.querySelector(".tooltip");
        tooltip.style.display = "none";
    });
});

// Új kuka létrehozásának validálása (üres mezők ellenőrzése)
const newKukaForm = document.getElementById("new-kuka-form");

newKukaForm.addEventListener("submit", event => {
    const locationXInput = document.getElementById("location-x");
    const locationYInput = document.getElementById("location-y");

    if (locationXInput.value.trim() === "" || locationYInput.value.trim() === "") {
        event.preventDefault();
        alert("A helyszín X és Y koordinátáit meg kell adni!");
    }
});

// Kuka törlése megerősítés kérése
const deleteKukaForms = document.querySelectorAll(".delete-kuka-form");

deleteKukaForms.forEach(form => {
    form.addEventListener("submit", event => {
        const confirmation = confirm("Biztosan törölni szeretnéd ezt a kukát?");
        if (!confirmation) {
            event.preventDefault();
        }
    });
});