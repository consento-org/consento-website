(function () {
    const element = document.getElementById("top-bar");
    const toggleButton = document.getElementById('toggle-button');

    const scrollShadow = function () {
        const isScrolledToTop = window.pageYOffset > 40;
        const hasDropDown = document.body.offsetWidth < 768;
        const isDropdownExpanded = !toggleButton.classList.contains('collapsed');
        element.classList.toggle('scroll_shadow', isScrolledToTop || (hasDropDown && isDropdownExpanded));
    }

    $(document).on('click.bs.button.data-api', scrollShadow);
    $(document).ready(scrollShadow);
    $(window).on('scroll resize', scrollShadow);
})()
