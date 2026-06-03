const burger = document.querySelector(".burger-btn");
const sidebar = document.querySelector(".sidebar");

burger.addEventListener("click", () => {
    sidebar.classList.toggle("active");
});