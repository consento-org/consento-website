$(window).scroll(function(e) {
    let scroll = $(window).scrollTop();
    let currentScrollpos = window.pageYOffset;
    let element = document.getElementById("top-bar");

    if (currentScrollpos > 40) {
        element.style.setProperty('box-shadow', '0 0 4px #00000038');
        element.style.setProperty('transition', 'box-shadow 1s');
    } else {
        element.style.setProperty('box-shadow', 'initial');
        element.style.setProperty('transition', 'box-shadow 1s');
    };
});