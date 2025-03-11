document.addEventListener("DOMContentLoaded", function () {
    const slider = document.querySelector(".slider");
    const slides = Array.from(document.querySelectorAll(".slide"));
    const leftButton = document.querySelector(".slider-button.left");
    const rightButton = document.querySelector(".slider-button.right");

    let slidesPerView = getSlidesPerView();
    const totalSlides = slides.length;
    let currentIndex = slidesPerView; // Start after cloned last slide

    // Clone slides for seamless loop
    slides.forEach(slide => {
        let cloneA = slide.cloneNode(true);
        let cloneB = slide.cloneNode(true);
        slider.appendChild(cloneA); // Clone at end
        slider.insertBefore(cloneB, slides[0]); // Clone at beginning
    });

    const allSlides = document.querySelectorAll(".slide");
    let slideWidth = 100 / slidesPerView; // Responsive width
    slider.style.transform = `translateX(-${currentIndex * slideWidth}%)`;

    function getSlidesPerView() {
        if (window.innerWidth < 600) return 1;
        if (window.innerWidth < 900) return 2;
        return 4;
    }

    function updateSliderPosition(animated = true) {
        slider.style.transition = animated ? "transform 0.4s ease-in-out" : "none";
        slider.style.transform = `translateX(-${currentIndex * slideWidth}%)`;
    }

    function slideRight() {
        if (currentIndex >= totalSlides + slidesPerView) {
            setTimeout(() => {
                currentIndex = slidesPerView; // Reset to start (real first slide)
                slider.style.transition = "none";
                updateSliderPosition(false);
            }, 400);
        }
        currentIndex++;
        updateSliderPosition();
    }

    function slideLeft() {
        if (currentIndex <= 0) {
            setTimeout(() => {
                currentIndex = totalSlides;
                slider.style.transition = "none";
                updateSliderPosition(false);
            }, 400);
        }
        currentIndex--;
        updateSliderPosition();
    }

    rightButton.addEventListener("click", slideRight);
    leftButton.addEventListener("click", slideLeft);

    // // Auto-slide every 4 seconds
    // let autoSlide = setInterval(slideRight, 4000);

    // // Pause auto-slide on hover
    // slider.addEventListener("mouseenter", () => clearInterval(autoSlide));
    // slider.addEventListener("mouseleave", () => {
    //     autoSlide = setInterval(slideRight, 4000);
    // });

    // Update slidesPerView on window resize
    window.addEventListener("resize", () => {
        slidesPerView = getSlidesPerView();
        slideWidth = 100 / slidesPerView;
        updateSliderPosition();
    });

    updateSliderPosition();
});