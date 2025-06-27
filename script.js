document.addEventListener('DOMContentLoaded', () => {
    // Initialize the app
    checkDarkModePreference();
    fetchDiseases();
    fetchSolutions();
    setupEventListeners();
});

// DOM Elements
const themeToggle = document.getElementById('theme-toggle');
const diseasesContainer = document.getElementById('diseases-container');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const searchResults = document.getElementById('search-results');
const solutionForm = document.getElementById('solution-form');
const solutionsContainer = document.getElementById('solutions-container');

// API URLs
const BASE_URL = 'http://localhost:3000';
const DISEASES_URL = `${BASE_URL}/diseases`;
const SOLUTIONS_URL = `${BASE_URL}/solutions`;

// Event Listeners Setup
function setupEventListeners() {
    // Theme toggle
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleDarkMode);
    }
    
    // Search functionality
    if (searchBtn && searchInput) {
        searchBtn.addEventListener('click', handleSearch);
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleSearch();
        });
    }
    
    // Form submission
    if (solutionForm) {
        solutionForm.addEventListener('submit', (e) => {
            e.preventDefault();
            handleFormSubmit(e);
        });
    }
}

// Dark Mode Toggle
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDarkMode = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDarkMode.toString());
    if (themeToggle) {
        themeToggle.textContent = isDarkMode ? 'Toggle Light Mode' : 'Toggle Dark Mode';
    }
}

// Check for saved dark mode preference
function checkDarkModePreference() {
    const darkModeEnabled = localStorage.getItem('darkMode') === 'true';
    if (darkModeEnabled) {
        document.body.classList.add('dark-mode');
        if (themeToggle) {
            themeToggle.textContent = 'Toggle Light Mode';
        }
    }
}

// Fetch Crop Diseases
function fetchDiseases() {
    fetch(DISEASES_URL)
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(diseases => {
            if (diseasesContainer && Array.isArray(diseases)) {
                renderDiseases(diseases);
            }
        })
        .catch(error => {
            console.error('Error fetching diseases:', error);
            if (diseasesContainer) {
                diseasesContainer.innerHTML = '<p class="error">Failed to load diseases. Please try again later.</p>';
            }
        });
}

// Render Diseases
function renderDiseases(diseases) {
    if (!diseasesContainer) return;
    
    diseasesContainer.innerHTML = '';
    
    if (!diseases || diseases.length === 0) {
        diseasesContainer.innerHTML = '<p>No diseases found.</p>';
        return;
    }
    
    diseases.forEach(disease => {
        const diseaseCard = document.createElement('div');
        diseaseCard.className = 'disease-card';
        diseaseCard.innerHTML = `
            <h3>${disease.name || 'Unknown Disease'}</h3>
            <p><strong>Crop Affected:</strong> ${disease.crop || 'Various crops'}</p>
            <p><strong>Symptoms:</strong> ${disease.symptoms || 'Not specified'}</p>
            <p><strong>Solution:</strong> ${disease.solution || 'No solution provided'}</p>
            <div class="difficulty">Difficulty: ${disease.difficulty || '?'}/5</div>
        `;
        diseasesContainer.appendChild(diseaseCard);
    });
}

// Fetch Community Solutions
function fetchSolutions() {
    fetch(SOLUTIONS_URL)
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(solutions => {
            if (solutionsContainer && Array.isArray(solutions)) {
                renderSolutions(solutions);
            }
        })
        .catch(error => {
            console.error('Error fetching solutions:', error);
            if (solutionsContainer) {
                solutionsContainer.innerHTML = '<p class="error">Failed to load community solutions. Please try again later.</p>';
            }
        });
}

// Render Solutions
function renderSolutions(solutions) {
    if (!solutionsContainer) return;
    
    solutionsContainer.innerHTML = '';
    
    if (!solutions || solutions.length === 0) {
        solutionsContainer.innerHTML = '<p>No community solutions yet. Be the first to share!</p>';
        return;
    }
    
    // Sort solutions by upvotes (descending)
    solutions.sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0));
    
    solutions.forEach(solution => {
        const solutionCard = document.createElement('div');
        solutionCard.className = 'solution-card';
        solutionCard.innerHTML = `
            <h3>${solution.cropName || 'Unknown Crop'} - ${solution.problem || 'Unspecified Problem'}</h3>
            <p>${solution.solution || 'No solution provided'}</p>
            <div class="solution-footer">
                <button class="upvote-btn" data-id="${solution.id}">Upvote</button>
                <span class="upvote-count">${solution.upvotes || 0} upvotes</span>
            </div>
        `;
        solutionsContainer.appendChild(solutionCard);
    });

    // Add event listeners to upvote buttons
    document.querySelectorAll('.upvote-btn').forEach(button => {
        button.addEventListener('click', handleUpvote);
    });
}

// Handle Upvote
function handleUpvote(event) {
    const solutionId = event.target.getAttribute('data-id');
    const upvoteBtn = event.target;
    const upvoteCount = event.target.nextElementSibling;
    
    if (!solutionId) return;
    
    // Disable button during request
    upvoteBtn.disabled = true;
    upvoteBtn.textContent = 'Upvoting...';
    
    fetch(`${SOLUTIONS_URL}/${solutionId}`)
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(solution => {
            const updatedUpvotes = (solution.upvotes || 0) + 1;
            
            return fetch(`${SOLUTIONS_URL}/${solutionId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ upvotes: updatedUpvotes }),
            });
        })
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            fetchSolutions(); // Refresh the solutions list
        })
        .catch(error => {
            console.error('Error upvoting solution:', error);
            if (upvoteBtn) {
                upvoteBtn.disabled = false;
                upvoteBtn.textContent = 'Upvote';
            }
            alert('Failed to upvote. Please try again.');
        });
}

// Handle Search
function handleSearch() {
    const searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : '';
    
    if (!searchTerm) {
        if (searchResults) {
            searchResults.innerHTML = '<p class="error">Please enter a search term</p>';
        }
        return;
    }
    
    fetch(DISEASES_URL)
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(diseases => {
            if (!searchResults) return;
            
            const filteredDiseases = diseases.filter(disease => 
                (disease.name && disease.name.toLowerCase().includes(searchTerm)) || 
                (disease.crop && disease.crop.toLowerCase().includes(searchTerm))
            );
            
            if (filteredDiseases.length === 0) {
                searchResults.innerHTML = '<p>No results found for "' + searchTerm + '"</p>';
                return;
            }
            
            searchResults.innerHTML = '<h3>Search Results:</h3>';
            filteredDiseases.forEach(disease => {
                const diseaseCard = document.createElement('div');
                diseaseCard.className = 'disease-card';
                diseaseCard.innerHTML = `
                    <h4>${disease.name || 'Unknown Disease'}</h4>
                    <p><strong>Crop Affected:</strong> ${disease.crop || 'Various crops'}</p>
                    <p><strong>Solution:</strong> ${disease.solution || 'No solution provided'}</p>
                `;
                searchResults.appendChild(diseaseCard);
            });
        })
        .catch(error => {
            console.error('Error searching diseases:', error);
            if (searchResults) {
                searchResults.innerHTML = '<p class="error">Failed to search. Please try again later.</p>';
            }
        });
}

// Handle Form Submission
function handleFormSubmit(event) {
    if (!solutionForm) return;
    
    const cropNameInput = document.getElementById('crop-name');
    const problemInput = document.getElementById('problem');
    const solutionInput = document.getElementById('solution');
    const submitBtn = solutionForm.querySelector('button[type="submit"]');
    
    if (!cropNameInput || !problemInput || !solutionInput || !submitBtn) return;
    
    const cropName = cropNameInput.value.trim();
    const problem = problemInput.value.trim();
    const solution = solutionInput.value.trim();
    
    if (!cropName || !problem || !solution) {
        alert('Please fill in all fields');
        return;
    }
    
    const newSolution = {
        cropName,
        problem,
        solution,
        upvotes: 0
    };
    
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';
    
    fetch(SOLUTIONS_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSolution),
    })
    .then(response => {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.json();
    })
    .then(() => {
        // Clear the form
        solutionForm.reset();
        // Refresh the solutions list
        fetchSolutions();
    })
    .catch(error => {
        console.error('Error submitting solution:', error);
        alert('Failed to submit solution. Please try again.');
    })
    .finally(() => {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Solution';
    });
}