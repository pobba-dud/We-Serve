
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

// Function to open the modal for a specific day's events
function openEventModal(dayOffset) {
  console.log("Opening modal for day:", dayOffset);

  const modal = document.getElementById('eventModal');
  const modalBody = document.getElementById('modal-body');

  if (!modal || !modalBody) {
    console.error("Modal or modal body not found in the DOM!");
    return;
  }

  modalBody.innerHTML = `<p>Loading events...</p>`; // Placeholder while fetching

  const today = new Date();
  const startOfWeek = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - today.getUTCDay()));

  // Compute the exact UTC date for the selected day
  const selectedDate = new Date(startOfWeek);
  selectedDate.setUTCDate(startOfWeek.getUTCDate() + dayOffset);

  // Normalize to YYYY-MM-DD for accurate date comparison
  const selectedDateString = selectedDate.toISOString().split('T')[0];

  // Retrieve events
  const events = JSON.parse(localStorage.getItem("userEvents")) || [];

  // Filter events to only include those happening on the exact selected date
  const eventsForDay = events.filter(event => {
    const eventDateString = event.event_date.split('T')[0]; // Extract YYYY-MM-DD from event date
    return eventDateString === selectedDateString;
  });

  console.log(eventsForDay);

  if (eventsForDay.length === 0) {
    modalBody.innerHTML = `<p>No events for this day.</p>`;
    modal.style.display = 'block';
    return;
  }

  // Generate modal content for multiple events
  let modalContent = '';
  eventsForDay.forEach(event => {
    modalContent += `
      <div class="event-section">
        <h4>${event.name}</h4>
        <p><b>Date:</b> ${event.event_date.split('T')[0]}</p>
        <p><b>Time:</b> ${event.start_time} - ${event.end_time}</p>
        <p><b>Location:</b> ${event.address}</p>
        <p><b>Description:</b> ${event.description}</p>
        <button class="btn btn-danger" onclick="leaveEvent(${event.id})">Leave Event</button>
        <hr />
      </div>
    `;
  });

  modalBody.innerHTML = modalContent; // Update modal with event details
  modal.style.display = 'block'; // Show the modal
}



function closeEventModal() {
  document.getElementById('eventModal').style.display = 'none';
}



// Function to convert 24-hour format to 12-hour format
function formatTime(time) {
  let [hour, minute] = time.split(":");
  let ampm = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12;
  return `${hour}:${minute} ${ampm}`;
}
//functiuon to leave an event
async function leaveEvent(eventId) {
  try {
    const response = await fetch('/api/events/leave', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId }),
    });

    const data = await response.json();

    if (response.ok) {
      alert(data.message);
      location.reload();  // Refresh the page to reflect changes
    } else {
      alert(data.message);
    }
  } catch (error) {
    console.error('Error leaving the event:', error);
    alert('Failed to leave the event.');
  }
}

// Function to populate the weekly table
function mapEventsToDays() {
  const events = JSON.parse(localStorage.getItem("userEvents")) || [];

  // Ensure startOfWeek is always in UTC
  const today = new Date();
  const startOfWeek = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - today.getUTCDay()));

  const eventCount = {};
  for (let i = 0; i < 7; i++) {
    document.getElementById(`event-${i + 1}`).innerHTML = "";
    eventCount[i] = 0;
  }

  const eventsByDay = {};

  events.forEach(event => {
    // Convert event date to a UTC date object
    const eventDate = new Date(event.event_date);
    const eventDateUTC = new Date(Date.UTC(eventDate.getUTCFullYear(), eventDate.getUTCMonth(), eventDate.getUTCDate()));

    // Find the difference in days from the start of the week
    const dayDiff = Math.floor((eventDateUTC - startOfWeek) / (1000 * 60 * 60 * 24));

    // Ensure event is within this week
    if (dayDiff >= 0 && dayDiff < 7) {
      if (!eventsByDay[dayDiff]) {
        eventsByDay[dayDiff] = [];
      }
      eventsByDay[dayDiff].push(event);
      eventCount[dayDiff]++;

      // Update the event button display
      document.getElementById(`event-${dayDiff + 1}`).innerHTML = 
        `<button class="event-button"
        style="
      margin-right: 0px;
      display: flex;
      justify-content: center;
      align-items: center;
      float: none;
      width: 100%;
      max-width: 200px;
      margin: 10px auto;
      padding-top: 10px;
      padding-bottom: 10px;
      font-size: 16px;
      font-weight: bold;
      text-align: center;
      cursor: pointer;"
      onclick="openEventModal(${dayDiff})">
      ${event.name} ${eventCount[dayDiff] > 1 ? `+${eventCount[dayDiff] - 1}` : ""}
        </button>`;
    }
  });
}

// end of mapEventsToDays() function

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
    document.getElementById('totalHours').textContent = formatNumber(data.yearly_hours);
    document.getElementById('weeklyStreak').textContent = formatNumber(data.weekly_streak);
  } catch (error) {
    console.error('Error fetching user hours:', error);
  }
}

// Helper function to format numbers with commas
function formatNumber(number) {
  return number.toLocaleString();
}



document.addEventListener("DOMContentLoaded", () => {
  fetchUserHours();
});