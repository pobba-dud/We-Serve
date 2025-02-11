
//code for dashboard.html
// Function to dynamically update the numbers next to the day names
function updateDayNumbers() {
  const today = new Date();
  const dayOfWeek = today.getUTCDay(); // Use UTC day of the week
  const currentDate = today.getUTCDate(); // Use UTC date

  // Ensure we get the start of the week in UTC
  const startOfWeek = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), currentDate - dayOfWeek));

  const dayElements = document.querySelectorAll('.day-number');

  dayElements.forEach((dayElement, index) => {
    const newDate = new Date(startOfWeek);
    newDate.setUTCDate(startOfWeek.getUTCDate() + index); // Increment in UTC

    // Ensure the date updates correctly
    const dayName = dayElement.innerHTML.split('<br>')[1]; 
    dayElement.innerHTML = `${newDate.getUTCDate()}<br>${dayName}`; 

    dayElement.setAttribute('data-day', newDate.getUTCDate()); 
  });
}
//start of updateDayNumbers() function

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

async function fetchEventsUser() {

  // Fetch the user's ID from the server (assuming it's stored in a token)
  const userId = await fetchUserId(); // Implement this function to get the user ID

  if (!userId) {
    console.error("User ID not found. Please log in.");
    return;
  }

  // Fetch events the user is signed up for
  const response = await fetch(`/api/events/user/${userId}`);
  const events = await response.json();

  // Cache events in localStorage
  localStorage.setItem('userEvents', JSON.stringify(events));

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
  const events = JSON.parse(localStorage.getItem("userEvents")) || [];
  const currentDate = new Date();

  // Calculate the start and end of the week in UTC by converting dates to YYYY-MM-DD strings
  // (We force everything to UTC so that comparisons are consistent.)
  const todayISOString = currentDate.toISOString().split('T')[0];
  const dayOfWeek = currentDate.getUTCDay(); // 0 (Sunday) - 6 (Saturday)
  
  // Create a Date object for the start of the week (Sunday) using UTC parts
  const startOfWeekObj = new Date(Date.UTC(currentDate.getUTCFullYear(), currentDate.getUTCMonth(), currentDate.getUTCDate() - dayOfWeek));
  const startOfWeekStr = startOfWeekObj.toISOString().split('T')[0];

  const endOfWeekObj = new Date(startOfWeekObj);
  endOfWeekObj.setUTCDate(startOfWeekObj.getUTCDate() + 6);
  const endOfWeekStr = endOfWeekObj.toISOString().split('T')[0];

  // Clear table cells (assumes IDs "event-1" to "event-7")
  for (let i = 1; i <= 7; i++) {
    const cell = document.getElementById(`event-${i}`);
    if (cell) {
      cell.innerHTML = "";
    }
  }

  // Process each event
  events.forEach((event) => {
    // Convert the event's date to a string in YYYY-MM-DD format
    const eventDateStr = new Date(event.event_date).toISOString().split('T')[0];
    // Only proceed if the event date is within this week (by string comparison)
    if (eventDateStr >= startOfWeekStr && eventDateStr <= endOfWeekStr) {
      // To get the day of week (0=Sunday, 6=Saturday), convert the event date string back to a Date in UTC:
      const eventDateObj = new Date(eventDateStr + "T00:00:00Z");
      const dayOffset = eventDateObj.getUTCDay();

      // Select the corresponding table row. 
      // For example, if you have rows for each day (Sunday is first row, so nth-child(1) is Sunday)
      const tableRow = document.querySelector(`tr:nth-child(${dayOffset + 1})`);

      // Parse start_time (assuming format "HH:MM:SS") and get only HH:MM
      let parts = event.start_time.split(":");
      if (parts.length !== 3) {
        alert("Invalid time format! Use HH:MM:SS.");
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
// Function to show custom notification
function showNotification(message) {
  const notification = document.getElementById("customNotification");
  notification.textContent = message;
  notification.style.display = "block";

  // Hide after 60 seconds (fixed from original 500000ms)
  setTimeout(() => {
    notification.style.opacity = '0';
    setTimeout(() => {
      notification.style.display = "none";
      notification.style.opacity = '1';
    }, 500);
  }, 60000); // 60 seconds
}

// Function to check for upcoming events within 48 hours
async function checkUpcomingEvents() {
  fetchEventsUser(); // Ensure user events are fetched first

  const events = JSON.parse(localStorage.getItem("userEvents")) || [];
  const currentTime = new Date();
  const fortyEightHoursFromNow = new Date(currentTime.getTime() + 48 * 60 * 60 * 1000);
  events.forEach(event => {
    // Parse the event's date and time correctly
    const eventDateTimeUTC = new Date(`${event.event_date.split('T')[0]}T${event.start_time}Z`);
    // Check if the event is within the next 48 hours
    if (eventDateTimeUTC > currentTime && eventDateTimeUTC <= fortyEightHoursFromNow) {
      const options = { 
        month: 'long', 
        day: 'numeric', 
        hour: 'numeric', 
        minute: '2-digit', 
        timeZone: 'UTC' 
      };
      const formattedDate = eventDateTimeUTC.toLocaleString('en-US', options);
      showNotification(`Upcoming Event: ${event.name} at ${event.address} on ${formattedDate}`);
    }
  });
}
function closeNotification() {
  const notification = document.getElementById("customNotification");
  notification.style.display = "none"; // Hide the notification
}
// Update your existing code to call this
document.addEventListener("DOMContentLoaded", () => {
  checkUpcomingEvents();
  // Run every hour to check for new events
  setInterval(checkUpcomingEvents, 60 * 60 * 1000);
});


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