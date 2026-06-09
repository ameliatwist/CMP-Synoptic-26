// Applied in <head> on every page — reads localStorage before render to avoid flash
(function () {
    if (localStorage.getItem('largeText') === 'true') document.documentElement.classList.add('large-text');
    if (localStorage.getItem('lightMode')  === 'true') document.documentElement.classList.add('light-mode');
})();
