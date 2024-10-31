// Initialize navigation state and clicked date
let nav = 0; // Navigation state (0 for current month, positive for future months, negative for past months)
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
function openModal(date) {
  clicked = date; // Set the clicked date

// Find if there is an event for the clicked date
  const eventForDay = events.find(e => e.date === clicked);

// If an event exists, show the delete modal; otherwise, show the new event modal
  if (eventForDay) {
    document.getElementById('eventText').innerText = eventForDay.title + "\n" + eventForDay.time;
    deleteEventModal.style.display = 'block';
  } else {
    newEventModal.style.display = 'block';
  }

  backDrop.style.display = 'block'; // Show the backdrop
}

// Function to load the calendar for the current month based on navigation
function load() {
  const dt = new Date();// Create a new Date object
  
// Calculate the target month and year based on navigation
  dt.setMonth((new Date().getMonth() + nav) % 12); 
  const day = dt.getDate();//Get current date
  const month = dt.getMonth();// Get the current month (0-11)
  const year = dt.getFullYear();// Get the current year

// Get the first day of the month and the number of days in the month
  const firstDayOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
// Get the weekday of the first day of the month
  const dateString = firstDayOfMonth.toLocaleDateString('en-us', {
      weekday: 'long',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
  });
  const paddingDays = weekdays.indexOf(dateString.split(', ')[0]); // Calculate padding days for the first week

// Display the current month and year in the month display element
  document.getElementById('monthDisplay').innerText = 
      `${dt.toLocaleDateString('en-us', { month: 'long' })} ${year}`;

  calendar.innerHTML = ''; // Clear previous calendar content

  for(let i = 1; i <= paddingDays + daysInMonth; i++) {
      const daySquare = document.createElement('div'); // Create a div for each day
      daySquare.classList.add('day'); // Add 'day' class to the div

      const dayString = `${year}/${month + 1}/${i - paddingDays}`

      if (i > paddingDays) {
          daySquare.innerText = i - paddingDays;
          const eventForDay = events.find(e => e.date === dayString);
// Highlight the current day if it matches the day and nav is 0
          if (i - paddingDays === day && nav === 0) {
              daySquare.id = 'currentDay';
          }
// If there is an event for that day, display it
          if (eventForDay) {
              const eventDiv = document.createElement('div');
              eventDiv.classList.add('event');
              eventDiv.innerText = eventForDay.title + "\n" + eventForDay.time;
              daySquare.appendChild(eventDiv);
          }
// Add event listener to open the modal for creating or deleting an event
          daySquare.addEventListener('click', () => openModal(dayString));
      } else {
          daySquare.classList.add('padding');
      }

      calendar.appendChild(daySquare);  // Add the day div to the calendar
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

    events.push({
      date: clicked,
      title: eventTitleInput.value,
      time: eventTimeInput.value,
    });

    localStorage.setItem('events', JSON.stringify(events));
    closeModal();
  } else {
    eventTitleInput.classList.add('error');
    eventTimeInput.classList.add('error')
  }
}

// Function to delete an event from localStorage
function deleteEvent() {
  events = events.filter(e => e.date !== clicked);
  localStorage.setItem('events', JSON.stringify(events));
  closeModal();
}

function initButtons() {
  document.getElementById('nextButton').addEventListener('click', () => {
    nav++;// Increment navigation state
    load();// Reload the calendar
  });

  document.getElementById('backButton').addEventListener('click', () => {
    nav--; // Decrement navigation state
    load();// Reload the calendar
  });

// Event listeners for modal buttons
  document.getElementById('saveButton').addEventListener('click', saveEvent);
  document.getElementById('cancelButton').addEventListener('click', closeModal);
  document.getElementById('deleteButton').addEventListener('click', deleteEvent);
  document.getElementById('closeButton').addEventListener('click', closeModal);
}

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

remoteCreateEvent('2024/10/15', 'skibidi sesh #2', '1:00 PM');
//remoteDeleteEvent('2024/10/15', '10:00 AM');