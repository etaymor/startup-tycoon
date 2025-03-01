// Add these DOM element references to the elements object in the constructor:
this.elements = {
  // ... existing elements ...
  
  // About modal elements
  aboutLink: document.getElementById("about-link"),
  aboutModal: document.getElementById("about-modal"),
  closeAboutButton: document.getElementById("close-about-button"),
  
  // ... rest of existing elements ...
};

// Add this line to the _initializeUI method after _initializeNavigation():
this._initializeAboutModal();

// Add this new method after _initializeUI():
/**
 * Initialize About modal functionality
 * @private
 */
_initializeAboutModal() {
  if (!this.elements.aboutLink || !this.elements.aboutModal || !this.elements.closeAboutButton) return;

  this.elements.aboutLink.addEventListener("click", (e) => {
    e.preventDefault();
    this.elements.aboutModal.style.display = "block";
    this.modalOpen = true;
  });

  this.elements.closeAboutButton.addEventListener("click", () => {
    this.elements.aboutModal.style.display = "none";
    this.modalOpen = false;
  });
} 