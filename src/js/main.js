/**
 * Startup Tycoon - Main Entry Point
 * Initializes the game and manages global state
 */

// Create a global game instance
let game;

// Initialize the game when the DOM is fully loaded
document.addEventListener("DOMContentLoaded", () => {
  console.log("Initializing Startup Tycoon...");

  // Create a new game instance
  game = new Game();

  // Create the UI Manager
  game.uiManager = new UIManager(game);
  console.log("UI Manager created");

  // Check for saved game
  const hasSavedGame = localStorage.getItem(CONFIG.SAVE_KEY) !== null;

  // If there's a saved game, add a load game button to the start screen
  if (hasSavedGame) {
    const startModal = document.getElementById("start-game-modal");
    const modalContent = startModal.querySelector(".modal-content");

    // Add load game button before the start game button
    const loadButton = document.createElement("button");
    loadButton.id = "load-game-button";
    loadButton.className = "secondary-button";
    loadButton.textContent = "Load Saved Game";
    loadButton.style.marginRight = "10px";

    // Insert before the start game button
    const startButton = document.getElementById("start-game-button");
    modalContent.insertBefore(loadButton, startButton);

    // Add event listener
    loadButton.addEventListener("click", () => {
      game.loadGame();
    });
  }

  // Add event listener for the save game button
  const saveGameButton = document.getElementById("save-game-button");
  saveGameButton.addEventListener("click", () => {
    if (game && game.isInitialized) {
      game.saveGame();
      game.addNotification("Game saved successfully!");
      console.log("Game saved successfully");
    } else {
      console.error("Cannot save game: Game not initialized");
    }
  });

  // Add event listener for the end turn button
  const endTurnButton = document.getElementById("end-turn-button");
  endTurnButton.addEventListener("click", () => {
    if (game && game.isInitialized && !game.state.gameOver) {
      // Don't allow ending turn if a modal is open
      if (game.uiManager.modalOpen) {
        console.log("Cannot end turn: Modal is open");
        return;
      }

      // Disable the button temporarily to prevent double-clicks
      endTurnButton.disabled = true;

      // Process the turn
      game.endTurn();
      console.log(`Turn ended. Now on turn ${game.state.currentTurn}`);

      // Re-enable the button after a short delay
      setTimeout(() => {
        endTurnButton.disabled = false;
      }, 1000);
    } else if (game.state.gameOver) {
      console.log("Cannot end turn: Game is over");
    } else {
      console.error("Cannot end turn: Game not initialized");
    }
  });

  // Set up menu buttons to switch between screens
  const menuButtons = document.querySelectorAll(".menu-button");
  menuButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const targetScreen = button.getAttribute("data-screen");
      if (game && game.isInitialized) {
        game.uiManager.showScreen(targetScreen);
        console.log(`Switched to ${targetScreen} screen`);
      } else {
        console.error(
          `Cannot switch to ${targetScreen} screen: Game not initialized`
        );
      }
    });
  });

  // For testing or development, you can auto-start a new game:
  // Uncomment the following line to automatically start a new game
  /*
    game.newGame({
        companyName: 'Test Company',
        industry: 'saas',
        difficulty: 'normal'
    });
    */

  // Set up share buttons
  const shareXButton = document.getElementById("share-x-button");
  const shareFacebookButton = document.getElementById("share-facebook-button");
  const shareLinkedInButton = document.getElementById("share-linkedin-button");

  // Share on X (Twitter)
  shareXButton.addEventListener("click", () => {
    const text = "I'm playing Startup Tycoon! Check out my virtual company!";
    const url = window.location.href;
    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      text
    )}&url=${encodeURIComponent(url)}`;
    window.open(shareUrl, "_blank", "width=550,height=420");
  });

  // Share on Facebook
  shareFacebookButton.addEventListener("click", () => {
    const url = window.location.href;
    const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
      url
    )}`;
    window.open(shareUrl, "_blank", "width=550,height=420");
  });

  // Share on LinkedIn
  shareLinkedInButton.addEventListener("click", () => {
    const text = "I'm playing Startup Tycoon! Check out my virtual company!";
    const url = window.location.href;
    const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
      url
    )}`;
    window.open(shareUrl, "_blank", "width=550,height=420");
  });

  // Debug mode handling
  const debugMode = window.location.search.includes("debug=true");
  if (debugMode) {
    console.log("Debug mode enabled");
    const debugControls = document.getElementById("debug-controls");
    if (debugControls) {
      debugControls.style.display = "block";

      // Add debug button handlers
      const addCashButton = document.getElementById("debug-add-cash");
      addCashButton.addEventListener("click", () => {
        if (game && game.isInitialized) {
          game.company.cash += 1000000; // Add $1M
          game.uiManager.updateUI();
          console.log("Added $1M cash");
        }
      });

      const addUsersButton = document.getElementById("debug-add-users");
      addUsersButton.addEventListener("click", () => {
        if (game && game.isInitialized) {
          game.company.users += 10000; // Add 10K users
          game.uiManager.updateUI();
          console.log("Added 10K users");
        }
      });

      const triggerEventButton = document.getElementById("debug-trigger-event");
      triggerEventButton.addEventListener("click", () => {
        if (game && game.isInitialized) {
          game.eventSystem.triggerRandomEvent();
          console.log("Triggered random event");
        }
      });

      const advanceTurnButton = document.getElementById("debug-advance-turn");
      advanceTurnButton.addEventListener("click", () => {
        if (game && game.isInitialized) {
          game.endTurn();
          console.log("Advanced turn");
        }
      });

      const gameOverButton = document.getElementById("debug-game-over");
      gameOverButton.addEventListener("click", () => {
        if (game && game.isInitialized) {
          // Test different game over scenarios
          const scenarios = [
            "bankruptcy",
            "acquisition",
            "ipo",
            "max_turns_reached",
          ];
          const randomScenario =
            scenarios[Math.floor(Math.random() * scenarios.length)];

          let data = {};
          if (randomScenario === "acquisition") {
            data = {
              acquisitionValue: game.company.valuation * 1.5,
              playerPayout: game.company.valuation * 0.8,
            };
          } else if (randomScenario === "ipo") {
            data = {
              ipoValue: game.company.valuation * 2,
              playerPayout: game.company.valuation * 1.2,
            };
          }

          game.gameOver(randomScenario, data);
          console.log(`Triggered game over: ${randomScenario}`);
        }
      });
    }
  }

  console.log("Startup Tycoon initialized!");
});
