$(window).scroll(function(e) {
    let currentScrollpos = window.pageYOffset;
    let element = document.getElementById("top-bar");
    element.classList.toggle('scroll_shadow', currentScrollpos > 40);
});