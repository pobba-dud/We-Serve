   // Calendar State
   let nav1 = 0;
   let clicked = null;
   let events = JSON.parse(localStorage.getItem('events')) || [];

   const calendar = document.getElementById('calendar');
   const newEventModal = document.getElementById('newEventModal');
   const deleteEventModal = document.getElementById('deleteEventModal');
   const backDrop = document.getElementById('modalBackDrop');
   const eventTitleInput = document.getElementById('eventTitleInput');
   const eventTimeInput = document.getElementById('eventTimeInput');
   const startDateInput = document.getElementById('startDateInput');
   const endDateInput = document.getElementById('endDateInput');
   const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

   // Load Calendar for the current month
   function load() {
     const dt = new Date();
     dt.setMonth(new Date().getMonth() + nav1);

     const currentMonth = dt.getMonth();
     const currentYear = dt.getFullYear();
     const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
     const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

     // Display month and year
     document.getElementById('monthDisplay').innerText =
       `${firstDayOfMonth.toLocaleDateString('en-us', { month: 'long', year: 'numeric' })}`;

     calendar.innerHTML = '';
     const paddingDays = weekdays.indexOf(firstDayOfMonth.toLocaleDateString('en-us', { weekday: 'long' }));

     // Build Calendar Grid
     for (let i = 0; i < paddingDays + daysInMonth; i++) {
       const dayBox = document.createElement('div');
       if (i >= paddingDays) {
         const day = i - paddingDays + 1;
         dayBox.classList.add('day');
         dayBox.innerHTML = day;
         
         const currentDate = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
         const dayEvents = events.filter(event => event.date === currentDate);
         if (dayEvents.length > 0) {
           dayBox.classList.add('event-day');
           const eventText = document.createElement('div');
           eventText.classList.add('event');
           eventText.innerText = dayEvents[0].title;
           dayBox.appendChild(eventText);
         }
         dayBox.addEventListener('click', () => openDayModal(currentDate, dayBox));
       } else {
         dayBox.classList.add('padding');
       }
       calendar.appendChild(dayBox);
     }
   }

   // Open Day Modal for Event Editing
   function openDayModal(date, dayBox) {
     clicked = date;
     const dayEvents = events.filter(event => event.date === date);
     const eventText = dayEvents.length ? `${dayEvents[0].title} at ${dayEvents[0].time}` : "No events";
     document.getElementById('eventText').innerText = eventText;
     deleteEventModal.classList.add('open');
     backDrop.style.display = 'block';
   }

   // Save Event
   function saveEvent() {
     const title = eventTitleInput.value;
     const time = eventTimeInput.value;
     const startDate = startDateInput.value;
     const endDate = endDateInput.value;

     if (title && time && startDate && endDate) {
       const newEvent = { date: startDate, title, time, startDate, endDate };
       events.push(newEvent);
       localStorage.setItem('events', JSON.stringify(events));
       closeModal();
       load();
     } else {
       alert('Please fill in all fields!');
     }
   }

   // Close Modal
   function closeModal() {
     newEventModal.classList.remove('open');
     deleteEventModal.classList.remove('open');
     backDrop.style.display = 'none';
     eventTitleInput.value = '';
     eventTimeInput.value = '';
     startDateInput.value = '';
     endDateInput.value = '';
   }

   // Delete Event
   function deleteEvent() {
     events = events.filter(e => e.date !== clicked);
     localStorage.setItem('events', JSON.stringify(events));
     closeModal();
     load();
   }

   // Initialize Buttons
   function initButtons() {
     document.getElementById('nextButton').addEventListener('click', () => { nav1++; load(); });
     document.getElementById('backButton').addEventListener('click', () => { nav1--; load(); });
     document.getElementById('saveButton').addEventListener('click', saveEvent);
     document.getElementById('cancelButton').addEventListener('click', closeModal);
     document.getElementById('deleteButton').addEventListener('click', deleteEvent);
     document.getElementById('closeButton').addEventListener('click', closeModal);
   }
   function remoteCreateEvent(date, title, time) {

if (date && title && time) {

 document.getElementById('saveButton').addEventListener('click', () => {
   const title = document.getElementById('eventTitleInput').value;
   const time = document.getElementById('eventTimeInput').value;
   const location = document.getElementById('eventLocationInput').value;
   const type = document.getElementById('eventTypeInput').value;
   const startDate = document.getElementById('startDateInput').value;
   const endDate = document.getElementById('endDateInput').value;

   // Store the event with start and end dates
   const newEvent = {
       title,
       time,
       location,
       type,
       startDate,
       endDate
   };

   const events = JSON.parse(localStorage.getItem('events')) || [];
   events.push(newEvent);
   localStorage.setItem('events', JSON.stringify(events));

   load(); // Refresh the calendar
});
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

   // Initialize Calendar
   initButtons();
   load();