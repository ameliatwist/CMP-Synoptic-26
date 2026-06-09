document.addEventListener("DOMContentLoaded", () => {

    if (localStorage.getItem("largeText") === "true") {
        document.body.classList.add("large-text");
    }

    if (localStorage.getItem("lightMode") === "true") {
        document.body.classList.add("light-mode");
    }

});