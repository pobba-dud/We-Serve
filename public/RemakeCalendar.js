// Declare variables to hold the current date and month
let currentDate = new Date();
let currentMonth = currentDate.getMonth(); // Get the current month (0-11)
let currentYear = currentDate.getFullYear(); // Get the current year (e.g. 2025)

// Function to generate the calendar for a given month and year
function generateCalendar(year, month) {
    // Get the first day of the month and the number of days in the month
    const firstDay = new Date(year, month).getDay(); // 0 is Sunday, 6 is Saturday
    const daysInMonth = new Date(year, month + 1, 0).getDate(); // Get the number of days in the month

    // Update the month display
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    document.getElementById("monthDisplay").textContent = `${monthNames[month]} ${year}`;

    // Clear previous calendar days (if any)
    const weekDays = document.getElementById("WeekDays");
    const calendarGrid = document.getElementById("CalendarGrid");
    calendarGrid.innerHTML = ""; // Empty the previous grid

    // Create a new row for the days of the month
    let dayCounter = 1;
    
    // Add empty days for the beginning of the month
    let row = document.createElement("div");
    row.className = "week";
    for (let i = 0; i < firstDay; i++) {
        row.appendChild(document.createElement("div")); // Empty div for empty days
    }

    // Add days to the calendar
    for (let i = firstDay; i < 7; i++) {
        let dayDiv = document.createElement("div");
        dayDiv.textContent = dayCounter++;
        row.appendChild(dayDiv);
    }

    calendarGrid.appendChild(row);

    // Fill the rest of the weeks
    while (dayCounter <= daysInMonth) {
        row = document.createElement("div");
        row.className = "week";
        for (let i = 0; i < 7; i++) {
            if (dayCounter <= daysInMonth) {
                let dayDiv = document.createElement("div");
                dayDiv.textContent = dayCounter++;
                row.appendChild(dayDiv);
            }
        }
        calendarGrid.appendChild(row);
    }
}

// Handle the "Prev" and "Next" buttons
document.getElementById("BackButton").addEventListener("click", function() {
    if (currentMonth === 0) {
        currentMonth = 11; // December
        currentYear--; // Go to previous year
    } else {
        currentMonth--; // Go to previous month
    }
    generateCalendar(currentYear, currentMonth); // Re-render the calendar
});

document.getElementById("NextButton").addEventListener("click", function() {
    if (currentMonth === 11) {
        currentMonth = 0; // January
        currentYear++; // Go to next year
    } else {
        currentMonth++; // Go to next month
    }
    generateCalendar(currentYear, currentMonth); // Re-render the calendar
});

// Initial call to populate the current month
window.onload = function() {
    generateCalendar(currentYear, currentMonth); // Display current month on page load
};
