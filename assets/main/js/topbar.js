const scrollShadow = function() {
    let element = document.getElementById("top-bar");
    element.classList.toggle('scroll_shadow', window.pageYOffset > 40);
}

$(document).ready(scrollShadow);
$(window).scroll(scrollShadow);
