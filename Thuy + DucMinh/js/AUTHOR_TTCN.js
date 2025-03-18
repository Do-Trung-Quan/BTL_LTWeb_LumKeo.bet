document.addEventListener("DOMContentLoaded", function () {
    const upperProfilePic = document.getElementById("profile-pic-upper");
    const lowerProfilePic = document.getElementById("profile-pic-lower");
    const fileInput = document.getElementById("profile-pic-input");
    const profilePicButton = document.getElementById("profile-pic-button"); // Fixed button ID
    const resetButton = document.getElementById("reset-image");

    const defaultImage = "keo_ngon-removebg-preview.png"; // Default image path

    // Load saved profile picture from localStorage
    const savedImage = localStorage.getItem("profilePic");
    if (savedImage) {
        upperProfilePic.src = savedImage;
        lowerProfilePic.src = savedImage;
    }

    // Clicking on either image or the button opens file selection
    upperProfilePic.addEventListener("click", () => fileInput.click());
    lowerProfilePic.addEventListener("click", () => fileInput.click());
    profilePicButton.addEventListener("click", () => fileInput.click()); // Make button clickable

    // When a file is selected, update both images
    fileInput.addEventListener("change", function (event) {
        const file = event.target.files[0];

        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                const imageSrc = e.target.result;
                upperProfilePic.src = imageSrc;
                lowerProfilePic.src = imageSrc;

                // Save to localStorage so it persists after refresh
                localStorage.setItem("profilePic", imageSrc);
            };
            reader.readAsDataURL(file);
        }
    });

    // Reset image to default
    resetButton.addEventListener("click", function () {
        localStorage.removeItem("profilePic"); // Clear stored image
        upperProfilePic.src = defaultImage; // Reset to default image
        lowerProfilePic.src = defaultImage; // Reset both images
    });
});
