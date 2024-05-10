function register() {
    const username = document.getElementById('registerUsername').value;
    const password = document.getElementById('registerPassword').value;
    
    fetch('/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `username=${username}&password=${password}`
    }).then(response => {
        if(response.ok) {
            window.location.href = '/login';
        } else {
            alert('Registration failed. User might already exist.');
        }
    });
}

function login() {
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    
    fetch('/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `username=${username}&password=${password}`
    }).then(response => {
        if(response.ok) {
            window.location.href = '/index';
        } else {
            alert('Invalid login credentials.');
        }
    });
}

function filterCards() {
    var input, filter, cardContainers, i, j, card, title, txtValue;
    input = document.getElementById('searchInput');
    filter = input.value.toUpperCase();
    cardContainers = []; // This will hold all card elements from different classes

    // Add all cards from the different classes to the cardContainers array
    var classes = ['card', 'cardtwo', 'cards', 'cardsmall', 'section'];
    classes.forEach(function(className) {
        var elements = document.getElementsByClassName(className);
        for (j = 0; j < elements.length; j++) {
            cardContainers.push(elements[j]);
        }
    });

    // Loop through all collected cards and filter based on the search input
    for (i = 0; i < cardContainers.length; i++) {
        card = cardContainers[i];
        title = card.querySelector("h3"); // This assumes each card has an <h3> element
        if (title) { // Make sure the title element exists
            txtValue = title.textContent || title.innerText;
            if (txtValue.toUpperCase().indexOf(filter) > -1) {
                card.style.display = "";
            } else {
                card.style.display = "none";
            }
        }
    }
}

// Event listener for search bar input
document.getElementById('searchInput').addEventListener('keyup', filterCards);

// Add event listeners to all cards
const cards = document.querySelectorAll('.card, .cards, .cardsmall, .cardtwo');
cards.forEach(card => {
    card.addEventListener("click", () => {
        const overlay = document.getElementById("overlay");
        overlay.style.display = "flex";

        const cardRect = card.getBoundingClientRect(); // Get the position of the clicked card
        const modal = document.querySelector(".modal");

        // Animate the modal to expand from the clicked card's position
        gsap.fromTo(modal, {
            x: cardRect.left + (cardRect.width / 2) - (window.innerWidth / 2),
            y: cardRect.top + (cardRect.height / 2) - (window.innerHeight / 2),
            scale: 0
        }, {
            duration: 0.5,
            x: 0,
            y: 0,
            scale: 1,
            ease: "power2.inOut"
        });

        // Store the card's position for use when closing the modal
        modal.dataset.originX = cardRect.left + (cardRect.width / 2) - (window.innerWidth / 2);
        modal.dataset.originY = cardRect.top + (cardRect.height / 2) - (window.innerHeight / 2);
    });
});

// Add event listener to the overlay
const overlay = document.getElementById("overlay");
overlay.addEventListener("click", (event) => {
    if (event.target === overlay) {
        closeModal();
    }
});

// Function to close the modal
function closeModal() {
    const modal = document.querySelector(".modal");

    // Animate the modal to shrink back to the clicked card's position
    gsap.to(modal, {
        duration: 0.5,
        x: modal.dataset.originX,
        y: modal.dataset.originY,
        scale: 0,
        ease: "power2.inOut",
        onComplete: () => {
            overlay.style.display = "none"; // Hide the overlay after the animation completes
        }
    });
}


