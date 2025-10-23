document.addEventListener('DOMContentLoaded', function() {
  const welcomeText = document.querySelector('.welcome-text');
  if (welcomeText) {
    // Get username from the HTML element (injected by Django)
    const username = welcomeText.getAttribute('data-username');
    
    // Greeting messages that include the username
    const greetings = [
      `Welcome, ${username}!`,
      `Maligayang pagdating, ${username}!`
    ];

    let currentIndex = 0, charIndex = 0, isDeleting = false, typingSpeed = 150;

    function type() {
      const word = greetings[currentIndex];
      welcomeText.textContent = isDeleting
        ? word.substring(0, charIndex--)
        : word.substring(0, charIndex++);

      typingSpeed = isDeleting ? 50 : 150;

      if (!isDeleting && charIndex === word.length) {
        isDeleting = true;
        typingSpeed = 2000;
      } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        currentIndex = (currentIndex + 1) % greetings.length;
        typingSpeed = 500;
      }

      setTimeout(type, typingSpeed);
    }

    type();
  }
});