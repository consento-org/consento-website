function scrollShadow(scrollpos) {
    let element = document.getElementById("top-bar");
    element.classList.toggle('scroll_shadow', scrollpos > 40);
}

window.onload = this.scrollShadow(window.pageYOffset);

$(window).scroll(function(e) {
    let currentScrollpos = window.pageYOffset;
    this.scrollShadow(currentScrollpos);
});