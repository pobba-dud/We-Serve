// Fetch user hours and update the page
async function fetchUserHours() {
    try {
        const response = await fetch('/api/events/fetch-hours', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch data');
        }

        const data = await response.json();

        // Animate the numbers
        animateNumber('totalHours', data.hourstotal);
        animateNumber('weeklyStreak', data.weekly_streak);
        animateNumber('monthlyHours', data.monthly_hours);
        animateNumber('yearlyHours', data.yearly_hours);

    } catch (error) {
        console.error('Error fetching user hours:', error);
        alert('Error fetching your data. Please try again later.');
    }
}

// Helper function to format numbers with commas
function formatNumber(number) {
    return number.toLocaleString();
}

// Function to animate the number counting up
function animateNumber(elementId, targetNumber) {
    const element = document.getElementById(elementId);
    const duration = 2000; // Total duration of the animation in milliseconds
    const startTime = performance.now();

    function updateNumber(currentTime) {
        const elapsedTime = currentTime - startTime;
        const progress = Math.min(elapsedTime / duration, 1);
        const easedProgress = easeOutQuad(progress);
        const currentNumber = Math.floor(easedProgress * targetNumber);

        element.textContent = formatNumber(currentNumber);

        if (progress < 1) {
            requestAnimationFrame(updateNumber);
        } else {
            element.textContent = formatNumber(targetNumber);
        }
    }

    requestAnimationFrame(updateNumber);
}

// Easing function to slow down as the number approaches the target
function easeOutQuad(t) {
    return t * (2 - t);
}

document.addEventListener("DOMContentLoaded", () => {
    fetchUserHours();
});


const CACHE_KEY = "leaderboard_data";
const CACHE_TIMESTAMP_KEY = "leaderboard_last_updated";
const CACHE_EXPIRATION = 5 * 60 * 1000; // 5 minutes
const PAGE_SIZE = 20;
let currentLimit = PAGE_SIZE;

async function fetchLeaderboard() {
    try {
        const response = await fetch("/api/leaderboard");
        if (!response.ok) throw new Error("Failed to fetch leaderboard data");
        
        const data = await response.json();
        
        // Validate response structure
        if (!data.yearlyHours || !data.weeklyStreak) {
            throw new Error("Invalid leaderboard data structure");
        }        

        localStorage.setItem(CACHE_KEY, JSON.stringify(data));
        localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
        renderLeaderboard(data);
    } catch (error) {
        console.error("Error fetching leaderboard:", error);
        showFallbackMessage();
    }
}

function checkAndFetchLeaderboard() {
    const lastUpdated = parseInt(localStorage.getItem(CACHE_TIMESTAMP_KEY) || "0", 10);
    const cachedData = localStorage.getItem(CACHE_KEY);
    
    if (Date.now() - lastUpdated > CACHE_EXPIRATION || !isValidCache(cachedData)) {
        fetchLeaderboard();
    } else {
        loadLeaderboardFromCache();
    }
}

function isValidCache(cachedData) {
    try {
        const data = JSON.parse(cachedData);
        return data && data.total_hours && data.weekly_streak;
    } catch {
        return false;
    }
}

function loadLeaderboardFromCache() {
    try {
        const cachedData = localStorage.getItem(CACHE_KEY);
        if (cachedData) {
            const data = JSON.parse(cachedData);
            if (data.total_hours && data.weekly_streak) {
                renderLeaderboard(data);
                return;
            }
        }
    } catch (error) {
        console.error("Error loading cached data:", error);
    }
    fetchLeaderboard();
}

function renderLeaderboard(data) {
    const totalHoursList = document.getElementById("HoursThisYear");
    const weeklyStreakList = document.getElementById("WeeklyStreakBoard");
    const userId = getCurrentUserId();

    // Clear existing content
    totalHoursList.innerHTML = "";
    weeklyStreakList.innerHTML = "";

        data.yearlyHours.slice(0, currentLimit).forEach((user, index) => {
        totalHoursList.innerHTML += `<li>${index + 1}. ${user.firstname} - ${user.hourstotal} hours</li>`;
    });

    data.weeklyStreak.slice(0, currentLimit).forEach((user, index) => {
        weeklyStreakList.innerHTML += `<li>${index + 1}. ${user.firstname} - ${user.weekly_streak} weeks</li>`;
    });

    
    displayUserRanking(data.userRanking, userId);
}


function displayUserRanking(rankingData, userId) {
    const userRankingContainer = document.getElementById("userRanking");
    let content = [];
    
    if (rankingData.yearlyHours) {
        content.push(`Yearly Hours: #${rankingData.yearlyHours.rank} (Top ${rankingData.yearlyHours.percentile}%)`);
    }
    
    if (rankingData.weeklyStreak) {
        content.push(`Weekly Streak: #${rankingData.weeklyStreak.rank} (Top ${rankingData.weeklyStreak.percentile}%)`);
    }

    userRankingContainer.innerHTML = content.join("<br>") || "Not ranked yet.";
}


function showFallbackMessage() {
    const containers = document.querySelectorAll('.leaderboard ol');
    containers.forEach(container => {
        container.innerHTML = "<li>Leaderboard data unavailable. Please try again later.</li>";
    });
}
async function getCurrentUserId() {
    try {
        const response = await fetch('/profileJS', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        });
        const userData = await response.json();
        return userData.id;
    } catch (error) {
        console.error('Error fetching user ID:', error);
        return null;
    }
}


function openLeaderboard() {
    document.getElementById("leaderboardModal").style.display = "flex";
    // Add class to hide scrollbars when modal is open
    document.body.classList.add("modal-open");
  }
  
  function closeModal() {
    document.getElementById("leaderboardModal").style.display = "none";
    // Remove class to restore scrollbars when modal is closed
    document.body.classList.remove("modal-open");
  }
