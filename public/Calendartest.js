const monthYearDisplay = document.getElementById('month-year');
const calendar = document.getElementById('calendar');
const eventModal = document.getElementById('event-modal');
const closeModal = document.querySelector('.close');
const addEventButton = document.getElementById('add-event');
const saveEventButton = document.getElementById('save-event');
const eventTitleInput = document.getElementById('event-title');
const eventDateInput = document.getElementById('event-date');

let currentDate = new Date();

function renderCalendar() {
    calendar.innerHTML = '';
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    monthYearDisplay.innerText = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const totalDays = lastDay.getDate();
    const startDay = firstDay.getDay();

    for (let i = 0; i < startDay; i++) {
        calendar.innerHTML += `<div class="day"></div>`;
    }

    for (let day = 1; day <= totalDays; day++) {
        const dayDiv = document.createElement('div');
        dayDiv.classList.add('day');
        dayDiv.innerText = day;
        dayDiv.dataset.date = `${year}-${month + 1}-${day}`;
        dayDiv.addEventListener('click', openEventModal);
        calendar.appendChild(dayDiv);
    }
}

function openEventModal(event) {
    const selectedDate = event.currentTarget.dataset.date;
    eventDateInput.value = selectedDate;
    eventModal.style.display = 'block';
}

closeModal.onclick = function () {
    eventModal.style.display = 'none';
}

addEventButton.onclick = function () {
    eventModal.style.display = 'block';
}

saveEventButton.onclick = function () {
    const title = eventTitleInput.value;
    const date = eventDateInput.value;
    const dayDiv = Array.from(calendar.children).find(day => day.dataset.date === date);

    if (dayDiv && title) {
        const eventDiv = document.createElement('div');
        eventDiv.classList.add('event');
        eventDiv.innerText = title;
        dayDiv.appendChild(eventDiv);
        eventTitleInput.value = '';
        eventModal.style.display = 'none';
    }
}

document.getElementById('prev-month').onclick = function () {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
}

document.getElementById('next-month').onclick = function () {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
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

renderCalendar();