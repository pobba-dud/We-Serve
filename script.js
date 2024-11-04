// Function to dynamically update the numbers next to the day names
function updateDayNumbers() { // start of updateDayNumbers() function
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
} //start of updateDayNumbers() function

// Function to highlight today's event
function highlightToday() { //start of highlightToday function
    const today = new Date().getDate(); // Get today's day number

    // Get all table rows with the day-number class
    const dayElements = document.querySelectorAll('.day-number');

    dayElements.forEach(dayElement => {
        const day = parseInt(dayElement.getAttribute('data-day'), 10); // Get the day number from custom attribute
        if (day === today) {
            dayElement.parentElement.classList.add('highlight'); // Highlight today's row
        }
    });
} // end of highlightToday function

// Run the functions when the page loads
document.addEventListener('DOMContentLoaded', () => {
    updateDayNumbers();  // Update the day numbers dynamically
    highlightToday();    // Highlight the current day's event
});



function mapEventsToDays() { // start of mapEventsToDays() function
  const events = JSON.parse(localStorage.getItem("events")) || [];
  const currentDate = new Date();

  // Calculate the start and end of the week
  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

  const endOfWeek = new Date(currentDate);
  endOfWeek.setDate(currentDate.getDate() + (6 - currentDate.getDay()));

  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  // Clear table first
  for (let i = 1; i <= 7; i++) {
    document.getElementById(`event-${i}`).innerHTML = "";
  }

  events.forEach((event) => {
    const eventDate = new Date(event.date);

    // Check if the event falls within the current week
    if (eventDate >= startOfWeek && eventDate <= endOfWeek) {
      const dayOffset = eventDate.getDay(); // Get the day of the week (0-6)
      const tableRow = document.querySelector(`tr:nth-child(${dayOffset + 1})`);

      // Update the table cell with the event information
      if (tableRow && tableRow.cells[1]) {
        tableRow.cells[1].innerHTML = `<u>${event.title}</u><br>${event.time}`;
      }
    }
  });
} // end of mapEventsToDays() function

// Call mapEventsToDays whenever the DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  mapEventsToDays();
});

  document.addEventListener("DOMContentLoaded", mapEventsToDays);

  mapEventsToDays();

var myModal = new bootstrap.Modal(document.getElementById('eventModal1'), {
  keyboard: false,
  backDrop: false
  }) 


  function searchDiscoverEvents() { // start of searchDiscoverEvents() function
    const input = document.getElementById('discoverSearchInput').value.toLowerCase();
    const eventListContainer = document.querySelector('.discover-events-list');
    const eventList = document.querySelectorAll('.discover-events-list .event'); // Select all event elements

    // Show or hide the event list based on input
    if (input.length > 0) {
        eventListContainer.style.display = ""; // Show the event list
    } else {
        eventListContainer.style.display = "none"; // Hide the event list if input is empty
    }

    eventList.forEach(event => {
        const title = event.querySelector('.event-title').textContent.toLowerCase(); // Get the title of the event
        const date = event.querySelector('.event-date').textContent.toLowerCase(); // Get the date of the event
        // Check if the title or date includes the search input
        if (title.includes(input) || date.includes(input)) {
            event.style.display = ""; // Show the event
        } else {
            event.style.display = "none"; // Hide the event
        }
    });
} // end of searchDiscoverEvents() function