// Function to dynamically update the numbers next to the day names
function updateDayNumbers() {
    const today = new Date();
    const dayOfWeek = today.getDay(); // Get the current day of the week (0 = Sunday, 6 = Saturday)
    const currentDate = today.getDate(); // Get the current day of the month
    const dayElements = document.querySelectorAll('.day-number');

    // Calculate the start of the week (Sunday)
    const startOfWeek = new Date(today);
    startOfWeek.setDate(currentDate - dayOfWeek); // Go back to Sunday

    // Update each day element with the correct date
    dayElements.forEach((dayElement, index) => {
        const newDate = new Date(startOfWeek);
        newDate.setDate(startOfWeek.getDate() + index); // Increment the date for each day

        // Update the text inside the <th> tag
        const dayName = dayElement.innerHTML.split('<br>')[1]; // Keep the day name
        dayElement.innerHTML = `${newDate.getDate()}<br>${dayName}`; // Update with new date

        // Add a custom attribute for the current day date
        dayElement.setAttribute('data-day', newDate.getDate());
    });
}

// Function to highlight today's event
function highlightToday() {
    const today = new Date().getDate(); // Get today's day number

    // Get all table rows with the day-number class
    const dayElements = document.querySelectorAll('.day-number');

    dayElements.forEach(dayElement => {
        const day = parseInt(dayElement.getAttribute('data-day'), 10); // Get the day number from custom attribute
        if (day === today) {
            dayElement.parentElement.classList.add('highlight'); // Highlight today's row
        }
    });
}

// Run the functions when the page loads
document.addEventListener('DOMContentLoaded', () => {
    updateDayNumbers();  // Update the day numbers dynamically
    highlightToday();    // Highlight the current day's event
});