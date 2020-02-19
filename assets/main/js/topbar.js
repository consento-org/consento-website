function scrollShadow(scrollpos) {
    let element = document.getElementById("top-bar");
    element.classList.toggle('scroll_shadow', scrollpos > 40);
}

const readyScroll = function() {
    scrollShadow(window.pageYOffset)
}

$(document).ready(readyScroll);

$(window).scroll(function(e) {
    scrollShadow(window.pageYOffset);
});