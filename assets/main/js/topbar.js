$(window).scroll(function(e) {
    let currentScrollpos = window.pageYOffset;
    let element = document.getElementById("top-bar");
    if (currentScrollpos > 40) {
        element.classList.add('scroll_shadow');
    } else {
        element.classList.remove('scroll_shadow');
    };
});