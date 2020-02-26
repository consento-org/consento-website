(function () {
    const scrollShadow = function(clicked) {
        let element = document.getElementById("top-bar");
        if (clicked == true && window.pageYOffset < 40) {
            element.classList.toggle('scroll_shadow');
        } else {
            window.pageYOffset > 40 || document.getElementById('navbarSupportedContent').classList.contains('show') ? element.classList.add('scroll_shadow') : element.classList.remove('scroll_shadow');
        }
    }

    document.getElementById('toggle-button').addEventListener("click", function() {
        scrollShadow(true)
    });

    $(document).ready(scrollShadow);

    $(window).scroll(scrollShadow);
})()
