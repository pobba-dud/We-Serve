
      // Function to show custom notification
      function showNotification(message) {
          const notification = document.getElementById("customNotification");
          console.log(notification);
          notification.textContent = message; // Set the message
          notification.style.display = "block"; // Show the notification
          console.log(notification.textContent);
          // Hide the notification after 5 seconds
          setTimeout(() => {
            console.log("timer Function started");
              notification.style.opacity = '0'; // Fade out
              setTimeout(() => {
                  notification.style.display = "none"; // Hide after fade out
                  notification.style.opacity = '1'; // Reset opacity for next use
              }, 500); // Wait for the fade out duration
          }, 500000); // Display for 5 seconds
      }
    
      // Function to check for events within 36 hours and show notifications
      function closeNotification() {
        const notification = document.getElementById("customNotification");
        notification.style.display = "none"; // Hide the notification
    }
  // Function to fetch and display user data on the account page
  function fetchUserData() {
    fetch('/profileJS', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    .then(response => {
      if (response.ok) {
        return response.json(); // Parse the JSON response
      } else {
        throw new Error('User not authenticated or profile data not found');
      }
    })
    .then(data => {
      
      document.getElementById('name').textContent = `${data.firstname} ${data.lastname}`;
document.getElementById('name2').textContent = `${data.firstname} ${data.lastname}`;
document.getElementById('email').textContent = data.email;
document.getElementById('phonenumber').textContent = data.phonenumber || 'Not provided';
document.getElementById('gender').textContent = data.gender || 'Not specified';

console.log("Birthday from data:", data.birthday);

const date = new Date(data.birthday);

// Check if the date is valid
if (isNaN(date)) {
  console.error("Invalid date:", data.birthday);
} else {
  // Extract UTC components
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth(); // Month is zero-based (0 = January)
  const day = date.getUTCDate();

  // Format the date as YYYY-MM-DD, ensuring zero-padded month and day
  const formattedDate = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  document.getElementById('birthday').textContent = formattedDate || 'Not provided';
}
//you can show a fallback message or handle the error as needed
    });
  }

  // Call the function to fetch and display user data when the page loads
  

      // Call checkUpcomingEvents function at the start or at interval
    