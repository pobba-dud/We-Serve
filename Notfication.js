// Sample events array (you would typically get this from your database)
const events = [
    { id: 1, name: "Meeting with Team", startTime: new Date(Date.now() + 3 * 60 * 60 * 1000) }, // 3 hours from now
    { id: 2, name: "Doctor Appointment", startTime: new Date(Date.now() + 5 * 60 * 60 * 1000) }, // 5 hours from now
];

// Function to show custom notification
function showCustomNotification(message) {
    const notification = document.getElementById("customNotification");
    notification.textContent = message; // Set the message
    notification.style.display = "block"; // Show the notification

    // Hide the notification after 5 seconds
    setTimeout(() => {
        notification.style.opacity = '0'; // Fade out
        setTimeout(() => {
            notification.style.display = "none"; // Hide after fade out
            notification.style.opacity = '1'; // Reset opacity for next use
        }, 500); // Wait for the fade out duration
    }, 5000); // Display for 5 seconds
}

// Function to check for events that need notifications
function checkForNotifications() {
    const now = new Date();
    const notificationTime = 3 * 60 * 60 * 1000; // 3 hours in milliseconds

    events.forEach(event => {
        const timeUntilEvent = event.startTime - now;

        if (timeUntilEvent <= notificationTime && timeUntilEvent > 0) {
            showCustomNotification(`Upcoming Event: ${event.name} starting in 3 hours.`);
        }
    });
}

// Automatically check for notifications every minute (60000 milliseconds)
setInterval(checkForNotifications, 60000);

// Initial check for notifications when the page loads
checkForNotifications();