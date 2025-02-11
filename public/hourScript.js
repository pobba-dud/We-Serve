 // Fetch user hours and update the page
 async function fetchUserHours() {
    try {
      const response = await fetch('/api/events/fetch-hours', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Ensure that the authentication token is sent along if required
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }

      const data = await response.json();

      // Update the page with the fetched data
      document.getElementById('totalHours').textContent = formatNumber(data.hourstotal);
      document.getElementById('weeklyStreak').textContent = formatNumber(data.weekly_streak);
      document.getElementById('monthlyHours').textContent = formatNumber(data.monthly_hours);
      document.getElementById('yearlyHours').textContent = formatNumber(data.yearly_hours);

    } catch (error) {
      console.error('Error fetching user hours:', error);
      alert('Error fetching your data. Please try again later.');
    }
  }

  // Helper function to format numbers with commas
  function formatNumber(number) {
    return number.toLocaleString();
  }

  document.addEventListener("DOMContentLoaded", () => {
    fetchUserHours();
  });