
//code for dashboard.html
// Function to dynamically update the numbers next to the day names
function updateDayNumbers() {
  console.log('updateDayNumbers');
  const today = new Date();
  const dayOfWeek = today.getUTCDay(); // Use UTC day of the week
  const currentDate = today.getUTCDate(); // Use UTC date
  const dayElements = document.querySelectorAll('.day-number');

  // Calculate the start of the week (Sunday) in UTC
  const startOfWeek = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), currentDate - dayOfWeek));

  // Update each day element with the correct date
  dayElements.forEach((dayElement, index) => {
    const newDate = new Date(startOfWeek);
    newDate.setUTCDate(startOfWeek.getUTCDate() + index); // Increment the date for each day in UTC

    // Update the text inside the <th> tag
    const dayName = dayElement.innerHTML.split('<br>')[1]; // Keep the day name
    dayElement.innerHTML = `${newDate.getUTCDate()}<br>${dayName}`; // Update with new date in UTC

    // Add a custom attribute for the current day date
    dayElement.setAttribute('data-day', newDate.getUTCDate());
  });
}//start of updateDayNumbers() function

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

async function fetchEventsUser() {
  console.log("Fetching events for the logged-in user...");

  // Fetch the user's ID from the server (assuming it's stored in the JWT token)
  const userId = await fetchUserId(); // Implement this function to get the user ID

  if (!userId) {
    console.error("User ID not found. Please log in.");
    return;
  }

  // Fetch events the user is signed up for
  const response = await fetch(`/api/events/user/${userId}`);
  const events = await response.json();

  // Cache events in localStorage
  localStorage.setItem('events', JSON.stringify(events));
  console.log("Events fetched and stored in localStorage:", events);

  // Render events
  mapEventsToDays();
}
async function fetchUserId() {
  try {
    const response = await fetch('/profileJS', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user data.');
    }

    const userData = await response.json();
    return userData.id; // Assuming the user ID is returned in the response
  } catch (error) {
    console.error('Error fetching user ID:', error);
    return null;
  }
}

// Function to map events to days
function mapEventsToDays() {
  console.log('mapEventsToDays');
  

  const events = JSON.parse(localStorage.getItem("events")) || [];
  const currentDate = new Date();

  // Ensure we calculate in UTC
  const startOfWeek = new Date(Date.UTC(currentDate.getUTCFullYear(), currentDate.getUTCMonth(), currentDate.getUTCDate()));
  startOfWeek.setUTCDate(startOfWeek.getUTCDate() - startOfWeek.getUTCDay()); // Move to Sunday

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setUTCDate(startOfWeek.getUTCDate() + 6); // Saturday

  console.log(`Start of Week (UTC): ${startOfWeek.toISOString()}`);
  console.log(`End of Week (UTC): ${endOfWeek.toISOString()}`);

  // Clear table first
  for (let i = 1; i <= 7; i++) {
    document.getElementById(`event-${i}`).innerHTML = "";
  }

  events.forEach((event) => {
    const eventDate = new Date(event.event_date); // Convert from DB
    const eventDateUTC = new Date(Date.UTC(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate()));
console.log("Raw event date from DB:", event.event_date);
console.log("Parsed event date:", eventDate);
console.log("Event UTC Date:", eventDate.toUTCString());
console.log("Event Local Date:", eventDate.toLocaleString());
console.log("Day of week:", eventDate.getDay());

    console.log(`Checking event: ${event.name} on ${eventDateUTC.toISOString()}`);

    // Ensure event falls within the correct week range
    if (eventDateUTC >= startOfWeek && eventDateUTC <= endOfWeek) {
      const dayOffset = eventDateUTC.getUTCDay(); // Get the day of the week (0-6)
      console.log(`Placing "${event.name}" on day offset: ${dayOffset}`);

      const tableRow = document.querySelector(`tr:nth-child(${dayOffset + 1})`);
      let input = event.start_time;
      let parts = input.split(":");

      if (parts.length !== 3) {
        console.error("Invalid time format! Use HH:MM:SS.");
        return;
      }

      let hours = parseInt(parts[0], 10);
      let minutes = parts[1];

      let formattedTime = `${hours}:${minutes}`;

      if (tableRow && tableRow.cells[1]) {
        tableRow.cells[1].innerHTML = `<u>${event.name}</u><br>${formattedTime}`;
      }
    }
  });
}

 // end of mapEventsToDays() function

// Call mapEventsToDays whenever the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  updateDayNumbers();  // Update the day numbers dynamically
  highlightToday();    // Highlight the current day's event
  fetchEventsUser();   // Fetch and map events
});


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
function toggleMenu(x) {
  x.classList.toggle("change");
  var menu = document.getElementById("dropdownMenu");
  menu.classList.toggle("show");
}

// Close the menu when clicking outside of it
document.addEventListener("click", function (event) {
  var menu = document.getElementById("dropdownMenu");
  var menuButton = document.querySelector(".menuContainer");

  // Check if the click is outside the menu and menu button
  if (!menu.contains(event.target) && !menuButton.contains(event.target)) {
    menu.classList.remove("show");
    menuButton.classList.remove("change");
  }
});