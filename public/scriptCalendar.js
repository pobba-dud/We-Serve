// Initialize navigation state and clicked date
let nav1 = 0; // Navigation state (0 for current month, positive for future months, negative for past months)
let clicked = null; // Holds the currently clicked date
let events = localStorage.getItem('events') ? JSON.parse(localStorage.getItem('events')) : [];

const calendar = document.getElementById('calendar');
const newEventModal = document.getElementById('newEventModal');
const deleteEventModal = document.getElementById('deleteEventModal');
const backDrop = document.getElementById('modalBackDrop');
const eventTitleInput = document.getElementById('eventTitleInput');
const eventTimeInput = document.getElementById('eventTimeInput');
const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Function to open the modal for creating or deleting an event
// Function to open the modal for creating or deleting an event
function openModal(date) {
  clicked = date; // Set the clicked date

  // Find if there is an event for the clicked date
  const eventForDay = events.find(e => e.date === clicked);

  // If an event exists, show the delete modal; otherwise, show the new event modal
  if (eventForDay) {
      document.getElementById('eventText').innerText = eventForDay.title + "\n" + eventForDay.time + "\nLocation: " + eventForDay.location;
      document.getElementById('editButton').style.display = 'inline'; // Show the edit button
      deleteEventModal.style.display = 'block';
  } else {
      newEventModal.style.display = 'block';
      document.getElementById('editButton').style.display = 'none'; // Hide the edit button
  }

  backDrop.style.display = 'block'; // Show the backdrop
}

// Function to handle the edit event
function editEvent() {
  const eventForDay = events.find(e => e.date === clicked);
  if (eventForDay) {
      eventTitleInput.value = eventForDay.title; // Populate title
      eventTimeInput.value = eventForDay.time; // Populate time
      eventLocationInput.value = eventForDay.location; // Populate location
      newEventModal.style.display = 'block'; // Show the new event modal
      deleteEventModal.style.display = 'none'; // Hide delete modal
  }
}

// Add event listener for the edit button
document.getElementById('editButton').addEventListener('click', editEvent);

// Function to load the calendar for the current month based on navigation
function load() {
  const dt = new Date();

  // Calculate the correct month and year based on nav
  let currentMonth = dt.getMonth();
  let currentYear = dt.getFullYear();

  // Calculate the target month and year based on navigation
  currentMonth += nav1;
  currentYear += Math.floor(currentMonth / 12);
  currentMonth = ((currentMonth % 12) + 12) % 12; // Keeps month in range 0-11

  // Get the first day of the month and the number of days in the month
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  // Get weekday for the first day of the month
  const dateString = firstDayOfMonth.toLocaleDateString('en-us', {
    weekday: 'long',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });
  const paddingDays = weekdays.indexOf(dateString.split(', ')[0]); // Calculate padding days for the first week

  // Display month and year
  document.getElementById('monthDisplay').innerText =
    `${firstDayOfMonth.toLocaleDateString('en-us', { month: 'long', year: 'numeric' })}`;

  calendar.innerHTML = ''; // Clear previous calendar content

  // **Corrected loop using updated `currentYear` and `currentMonth`**
  for (let i = 1; i <= paddingDays + daysInMonth; i++) {
    const daySquare = document.createElement('div');
    daySquare.classList.add('day');

    // **Corrected dayString using `currentYear` and `currentMonth`**
    const dayString = `${currentYear}/${currentMonth + 1}/${i - paddingDays}`;

    if (i > paddingDays) {
      daySquare.innerText = i - paddingDays;
      const eventForDay = events.find(e => e.date === dayString);

      // Highlight current day if it matches
      if (i - paddingDays === new Date().getDate() && nav1 === 0) {
        daySquare.id = 'currentDay';
      }
      // Display event for the day if available
      if (eventForDay) {
        const eventDiv = document.createElement('div');
        eventDiv.classList.add('event');
        eventDiv.innerText = `${eventForDay.title}\n${eventForDay.time}\nLocation: ${eventForDay.location}`;
        daySquare.appendChild(eventDiv);
      }

      daySquare.addEventListener('click', () => openModal(dayString));
    } else {
      daySquare.classList.add('padding');
    }

    calendar.appendChild(daySquare);
  }
}
// Function to close all modals
function closeModal() {
  eventTitleInput.classList.remove('error');
  eventTimeInput.classList.remove('error');
  newEventModal.style.display = 'none';
  deleteEventModal.style.display = 'none';
  backDrop.style.display = 'none';
  eventTitleInput.value = '';
  eventTimeInput.value = '';
  clicked = null;
  load();
}

// Function to save an event to localStorage
function saveEvent() {
  if (eventTitleInput.value + eventTimeInput.value) {
      eventTitleInput.classList.remove('error');
      eventTimeInput.classList.remove('error');
      eventLocationInput.classList.remove('error'); // Remove error class for location

      // Check if we are editing an existing event
      const existingEventIndex = events.findIndex(e => e.date === clicked);
      if (existingEventIndex > -1) {
          // Update existing event
          events[existingEventIndex] = {
              date: clicked,
              title: eventTitleInput.value,
              time: eventTimeInput.value,
              location: eventLocationInput.value // Store the location
          };
      } else {
          // Create a new event
          events.push({
              date: clicked,
              title: eventTitleInput.value,
              time: eventTimeInput.value,
              location: eventLocationInput.value // Store the location
          });
      }

      // Save events to localStorage
      localStorage.setItem('events', JSON.stringify(events));
      closeModal(); // Close the modal after saving
  } else {
      // Handle validation errors
      if (!eventTitleInput.value) {
          eventTitleInput.classList.add('error');
      }
      if (!eventTimeInput.value) {
          eventTimeInput.classList.add('error');
      }
  }
}

function saveEvent() {
  const title = document.getElementById('eventTitleInput').value;
  const time = document.getElementById('eventTimeInput').value;
  const location = document.getElementById('eventLocationInput').value;
  const type = document.getElementById('eventTypeInput').value; // Get the selected event type

  if (title && time) {
      const newEvent = {
          date: clicked, // Make sure 'clicked' is set to the correct date
          title,
          time,
          location,
          type
      };

      // Add the new event to the events array
      events.push(newEvent);

      // Save events to localStorage
      localStorage.setItem('events', JSON.stringify(events));
      closeModal(); // Close the modal after saving
      load(); // Reload the calendar to display the new event
  } else {
      alert('Please fill in all fields');
  }
}

function renderEvents() {
  const calendar = document.getElementById('calendar'); // Your calendar element
  calendar.innerHTML = ''; // Clear existing events

      events.forEach(event => {
        const eventDiv = document.createElement('div');
        eventDiv.classList.add('event');
        eventDiv.innerText = `${event.title} - ${event.time} - ${event.location}`;

        // Set color based on event type
        switch (event.type) {
            case 'personal':
                event.style.backgroundColor = '#ff6505'; // Orange
                break;
            case 'work':
                event.style.backgroundColor = '#ffcc00'; // Yellow
                break;
            case 'important':
                event.style.backgroundColor = '#ff5733'; // Red
                break;
            case 'other':
                event.style.backgroundColor = '#28a745'; // Green
                break;
            default:
                eventDiv.style.backgroundColor = '#4290f5'; // Default color
        }

        calendar.appendChild(eventDiv); // Add event to calendar
    });
}

// Function to delete an event from localStorage
function deleteEvent() {
  events = events.filter(e => e.date !== clicked);
  localStorage.setItem('events', JSON.stringify(events));
  closeModal();
}

function initButtons() {
  document.getElementById('nextButton').addEventListener('click', () => {
    nav1++;// Increment navigation state
    load();// Reload the calendar
  });

  document.getElementById('backButton').addEventListener('click', () => {
    nav1--; // Decrement navigation state
    load();// Reload the calendar
  });

  // Event listeners for modal buttons
  document.getElementById('saveButton').addEventListener('click', saveEvent);
  document.getElementById('cancelButton').addEventListener('click', closeModal);
  document.getElementById('deleteButton').addEventListener('click', deleteEvent);
  document.getElementById('closeButton').addEventListener('click', closeModal);
}

//console(month, year)
// Initial load of the calendar
load();
initButtons();


// Calendar Editor Function

function remoteCreateEvent(date, title, time) {

  if (date && title && time) {

    const newEvent = {
      date: date,
      title: title,
      time: time,
    };

    events.push(newEvent);

    localStorage.setItem('events', JSON.stringify(events));

    load();
  } else {
    console.error("Invalid event details.");
  }
}

function remoteDeleteEvent(date, time) {
  if (!date || !time) {
    console.error("Date and time must be provided for deletion.");
    return;
  }

  events = events.filter(e => !(e.date === date && e.time === time));

  localStorage.setItem('events', JSON.stringify(events));
  load();
}

function openDeleteModal(event) {
  const eventToDelete = events.find(e => e.date === event.date && e.title === event.title);
  deleteModal.innerHTML = `
      <h2>Delete Event</h2>
      <p>Are you sure you want to delete the event "${eventToDelete.title}" scheduled for ${eventToDelete.time} at ${eventToDelete.location}?</p>
      <button id="confirmDeleteButton">Yes</button>
      <button id="cancelDeleteButton">No</button>
  `;
  deleteModal.style.display = 'block';
}


remoteCreateEvent('2024/10/15', 'skibidi sesh #2', '1:00 PM');
//remoteDeleteEvent('2024/10/15', '10:00 AM');
