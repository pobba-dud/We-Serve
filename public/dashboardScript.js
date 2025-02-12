// Fetch user hours and update the page
async function fetchUserHours() {
    try {
      const response = await fetch('/api/events/fetch-hours', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
  
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }
  
      const data = await response.json();
  
      // Animate the numbers
      animateNumber('weeklyStreak', data.weekly_streak);
      animateNumber('totalHours', data.yearly_hours);
  
    } catch (error) {
      console.error('Error fetching user hours:', error);
      alert('Error fetching your data. Please try again later.');
    }
  }
  
  // Helper function to format numbers with commas
  function formatNumber(number) {
    return number.toLocaleString();
  }
  
  // Function to animate the number counting up
  function animateNumber(elementId, targetNumber) {
    const element = document.getElementById(elementId);
    const duration = 1000; // Total duration of the animation in milliseconds
    const startTime = performance.now();
  
    function updateNumber(currentTime) {
      const elapsedTime = currentTime - startTime;
      const progress = Math.min(elapsedTime / duration, 1);
      const easedProgress = easeOutQuad(progress);
      const currentNumber = Math.floor(easedProgress * targetNumber);
  
      element.textContent = formatNumber(currentNumber);
  
      if (progress < 1) {
        requestAnimationFrame(updateNumber);
      } else {
        element.textContent = formatNumber(targetNumber);
      }
    }
  
    requestAnimationFrame(updateNumber);
  }
  
  // Easing function to slow down as the number approaches the target
  function easeOutQuad(t) {
    return t * (2 - t);
  }
  
  // Run fetchUserHours when the DOM is fully loaded
  document.addEventListener("DOMContentLoaded", () => {
    fetchUserHours();
  });