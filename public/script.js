
//code for dashboard.html
// Function to dynamically update the numbers next to the day names
function updateDayNumbers() { // start of updateDayNumbers() function
  console.log('updateDayNumbers');
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
  console.log('highlightToday');
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


// Function to map events to days
function mapEventsToDays() { // start of mapEventsToDays() function
  console.log('mapEventsToDays');
  const events = JSON.parse(localStorage.getItem("events")) || [];
  const currentDate = new Date();

  // Calculate the start and end of the week
  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

  const endOfWeek = new Date(currentDate);
  endOfWeek.setDate(currentDate.getDate() + (7 - currentDate.getDay()));

  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  // Clear table first
  for (let i = 1; i <= 7; i++) {
    document.getElementById(`event-${i}`).innerHTML = "";
  }

  events.forEach((event) => {
    const eventDate = new Date(event.date);
    const eventDateUTC = new Date(Date.UTC(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate()));

    // Check if the event falls within the current week
    if (eventDateUTC >= startOfWeek && eventDateUTC <= endOfWeek) {
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
//end of dashboard code


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
    const location = event.querySelector('.event-location').textContent.toLowerCase(); // Get the location of the event
    // Check if the title or date includes the search input
    if (title.includes(input) || date.includes(input) || location.includes(input)) {
      event.style.display = ""; // Show the event
    } else {
      event.style.display = "none"; // Hide the event
    }
  });
} // end of searchDiscoverEvents() function

//universally used code
// Function to show custom notification
function showNotification(message) {
  console.log("2nd Function started");
  console.log(message);
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
function checkUpcomingEvents() {
  console.log("Function started");
  const currentTime = new Date();
  const fourtyEightHoursFromNow = new Date(currentTime.getTime() + 48 * 60 * 60 * 1000);

  // Retrieve events from local storage
  const storedEvents = JSON.parse(localStorage.getItem('events')) || []; // Replace 'events' with your actual key

  storedEvents.forEach(event => {
    console.log("Events loaded");
    const eventDate = new Date(event.date); // Assuming event.date is a string that can be parsed into a Date object
    eventDate.setHours(24, 0, 0, 0);
    console.log(event);
    if (eventDate <= fourtyEightHoursFromNow && eventDate > currentTime) {
      console.log("event is in timespan");
      console.log(event);
      console.log(eventDate);
      showNotification(`Upcoming Event: ${event.title} at ${event.location} on ${event.date} at ${event.time}`);
    }
  });
}
function closeNotification() {
  const notification = document.getElementById("customNotification");
  notification.style.display = "none"; // Hide the notification
}

function setTheme(theme) {
  document.body.className = theme === 'dark' ? 'dark-mode' : '';
  localStorage.setItem('theme', theme); // Save the theme preference
}
