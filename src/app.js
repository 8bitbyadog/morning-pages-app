// Import StorageManager
import StorageManager from './storage-manager.js';
import googleFormSubmitter from './google-form-integration.js';

document.addEventListener('DOMContentLoaded', () => {
    // Initialize StorageManager
    const storageManager = new StorageManager();

    // Initialize Google Form integration with your form details
    // You'll need to replace these values with your actual Google Form details
    // For setup instructions, see the google-form-setup-guide.html file
    const GOOGLE_FORM_URL = 'https://docs.google.com/forms/d/1btlD5vYAe1dB6NKE3d5SDKykLNTmakQdZN4-fQ98ITo/formResponse';
    // Try a different entry ID pattern that's more commonly used in Google Forms
    const GOOGLE_FORM_EMAIL_FIELD = 'entry.254925734'; 
    googleFormSubmitter.init(GOOGLE_FORM_URL, GOOGLE_FORM_EMAIL_FIELD);

    // Test the Google Form integration
    console.log('%c[App] Testing Google Form integration...', 'color: #2196F3; font-weight: bold');
    googleFormSubmitter.testSubmission('test@morningpages.app');

    // Initialize collapsible sections
    const collapsibles = document.querySelectorAll('.collapsible');
    collapsibles.forEach(collapsible => {
        // Make all sections collapsed by default except the first one
        const content = collapsible.nextElementSibling;
        if (collapsible === collapsibles[0]) {
            collapsible.classList.add('active');
            content.classList.add('active');
        }
        
        collapsible.addEventListener('click', function() {
            this.classList.toggle('active');
            const content = this.nextElementSibling;
            content.classList.toggle('active');
        });
    });

    // Add a small bottom margin to the last collapsible section
    const lastCollapsibleSection = document.querySelector('.sidebar-section:nth-last-child(2)');
    if (lastCollapsibleSection) {
        lastCollapsibleSection.style.marginBottom = '2rem';
    }

    // Cursor interaction handlers
    document.addEventListener('mousedown', (e) => {
        if (e.button === 0) { // Left click
            createChocoboFeather(e.clientX, e.clientY);
        }
    });

    document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        createMooglePopup(e.clientX, e.clientY);
    });

    function createChocoboFeather(x, y) {
        const feather = document.createElement('div');
        feather.className = 'chocobo-feather';
        feather.style.left = `${x}px`;
        feather.style.top = `${y}px`;
        
        // Random direction for feather to float
        const angle = Math.random() * Math.PI * 2;
        const distance = 50 + Math.random() * 50;
        const tx = Math.cos(angle) * distance;
        const ty = Math.sin(angle) * distance;
        
        feather.style.setProperty('--tx', `${tx}px`);
        feather.style.setProperty('--ty', `${ty}px`);
        
        document.body.appendChild(feather);
        
        // Remove feather after animation
        setTimeout(() => feather.remove(), 1000);
    }

    function createMooglePopup(x, y) {
        const moogle = document.createElement('div');
        moogle.className = 'moogle-popup';
        moogle.style.setProperty('--x', `${x - 20}px`);
        moogle.style.setProperty('--y', `${y - 20}px`);
        
        document.body.appendChild(moogle);
        
        // Remove moogle after animation
        setTimeout(() => moogle.remove(), 2000);
    }

    // DOM Elements
    const textEditor = document.getElementById('text-editor');
    const wordCountDisplay = document.getElementById('word-count');
    const progressBarFill = document.getElementById('progress-bar-fill');
    const analysisSection = document.getElementById('analysis-section');
    const celebrationContainer = document.getElementById('celebration-container');
    const loginForm = document.getElementById('login-form');
    const loginContainer = document.getElementById('login-container');
    const appContent = document.getElementById('app-content');
    const sidebarToggle = document.querySelector('.sidebar-toggle');
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');

    // App State
    let wordGoal = 750;
    let timerId = null;
    let startTime = null;
    let wordHistory = [];
    let goalReached = false;
    let totalWords = 0;
    let streak = 0;
    let lastWritingDate = null;
    let currentUser = null;
    let writingSpeedData = [];
    let keywords = new Set();

    // Sidebar Toggle
    sidebarToggle.addEventListener('click', () => {
        sidebar.classList.toggle('open');
        mainContent.classList.toggle('sidebar-open');
    });

    // Login Handler
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        try {
            console.log('Attempting login for:', email);
            
            // Check if user exists
            const user = await storageManager.getUser(email);
            console.log('User check result:', user ? 'Found' : 'Not found');
            
            if (!user) {
                // Create new user if doesn't exist
                console.log('Creating new user');
                await storageManager.createUser(email, password);
                
                // Submit email to Google Form when a new user registers
                await googleFormSubmitter.submitEmail(email);
                
                console.log('New user created successfully');
            } else {
                // Verify password for existing user
                const hashedPassword = await storageManager.hashPassword(password);
                if (hashedPassword !== user.password) {
                    throw new Error('Invalid password');
                }
                console.log('Password verified successfully');
            }
            
            // Update last login
            await storageManager.updateUserLastLogin(email);
            console.log('Last login updated');
            
            // Set current user
            currentUser = email;
            console.log('Current user set to:', currentUser);
            
            // Hide login form and show app content with proper transitions
            console.log('Starting transition to main app...');
            loginContainer.classList.add('hidden');
            
            // Wait for login container to fade out before showing app content
            setTimeout(async () => {
                try {
                    // Initialize app state
                    console.log('Initializing app state...');
                    
                    // Show app content first
                    appContent.style.display = 'block';
                    void appContent.offsetWidth; // Force reflow
                    appContent.classList.add('visible');
                    
                    // Then load user data
                    await loadUserData();
                    
                    // Initialize text editor with today's writing if available
                    const todayWriting = await storageManager.getTodayWriting();
                    if (todayWriting) {
                        console.log('Loading today\'s writing...');
                        textEditor.value = todayWriting.text;
                        updateWordCount(todayWriting.wordCount);
                    }
                    
                    // Start tracking writing speed
                    startTime = Date.now();
                    
                    // Initialize text input handlers
                    textEditor.addEventListener('input', handleTextInput);
                    textEditor.addEventListener('keydown', handleKeyDown);
                    
                    // Initialize charts
                    displayEmotionsChart(analyzeEmotions(textEditor.value));
                    displayTopicsChart(analyzeTopics(textEditor.value));
                    displaySpeedGraph();
                    displayKeywordCloud();
                    
                    console.log('Login successful, app initialized');
                } catch (error) {
                    console.error('Error during app initialization:', error);
                    // Show error message to user
                    const errorDiv = document.createElement('div');
                    errorDiv.className = 'error-message';
                    errorDiv.textContent = error.message;
                    loginForm.appendChild(errorDiv);
                    
                    // Remove error message after 3 seconds
                    setTimeout(() => errorDiv.remove(), 3000);
                    
                    // Reset UI state
                    loginContainer.classList.remove('hidden');
                    appContent.style.display = 'none';
                    appContent.classList.remove('visible');
                }
            }, 300);
            
        } catch (error) {
            console.error("Login error:", error);
            // Show error message to user
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            errorDiv.textContent = error.message === 'Invalid password' 
                ? 'Invalid password. Please try again.'
                : 'Failed to load your data. Please try again.';
            loginForm.appendChild(errorDiv);
            
            // Remove error message after 3 seconds
            setTimeout(() => errorDiv.remove(), 3000);
        }
    });

    function handleTextInput() {
        const text = textEditor.value;
        const wordCount = countWords(text);
        updateWordCount(wordCount);
        recordWordCountHistory(wordCount);
        analyzeText(text);
        updateWritingSpeed();
        updateKeywords(text);
    }

    function handleKeyDown(e) {
        if (e.key === 'Tab') {
            e.preventDefault();
            const start = textEditor.selectionStart;
            const end = textEditor.selectionEnd;
            textEditor.value = textEditor.value.substring(0, start) + '    ' + textEditor.value.substring(end);
            textEditor.selectionStart = textEditor.selectionEnd = start + 4;
        }
    }

    function countWords(text) {
        return text.trim().split(/\s+/).filter(word => word.length > 0).length;
    }

    // Throttled word count updater
    const updateWordCount = throttle(function() {
        const text = textEditor.value;
        const count = optimizedCountWords(text);
        
        // Update UI
        wordCountDisplay.textContent = `${count} words`;
        const progress = (count / wordGoal) * 100;
        progressBarFill.style.width = `${Math.min(progress, 100)}%`;

        if (count >= wordGoal && !goalReached) {
            goalReached = true;
            showCelebration();
        }
    }, 100);

    function recordWordCountHistory(count) {
        if (!startTime) {
            startTime = Date.now();
        }
        const timeElapsed = (Date.now() - startTime) / 1000 / 60; // in minutes
        wordHistory.push({ count, time: timeElapsed });
        writingSpeedData.push({
            time: timeElapsed,
            speed: count / timeElapsed
        });
    }

    function analyzeText(text) {
        const emotions = analyzeEmotions(text);
        const topics = analyzeTopics(text);
        displayEmotionsChart(emotions);
        displayTopicsChart(topics);
        displaySpeedGraph();
        displayKeywordCloud();
    }

    function analyzeEmotions(text) {
        const emotions = {
            joy: 0,
            sadness: 0,
            anger: 0,
            fear: 0,
            surprise: 0
        };

        const emotionKeywords = {
            joy: ['happy', 'excited', 'wonderful', 'great', 'amazing', 'love', 'loved', 'loving'],
            sadness: ['sad', 'depressed', 'unhappy', 'miserable', 'lonely', 'hurt'],
            anger: ['angry', 'mad', 'furious', 'hate', 'hated', 'hateful', 'annoyed'],
            fear: ['afraid', 'scared', 'fear', 'fearful', 'anxious', 'worried'],
            surprise: ['surprised', 'shocked', 'amazed', 'astonished', 'wow']
        };

        const words = text.toLowerCase().split(/\s+/);
        words.forEach(word => {
            for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
                if (keywords.includes(word)) {
                    emotions[emotion]++;
                }
            }
        });

        return emotions;
    }

    function analyzeTopics(text) {
        const topics = {
            work: 0,
            relationships: 0,
            health: 0,
            creativity: 0,
            dreams: 0
        };

        const topicKeywords = {
            work: ['work', 'job', 'career', 'business', 'project', 'meeting'],
            relationships: ['friend', 'family', 'partner', 'relationship', 'love'],
            health: ['health', 'exercise', 'diet', 'sleep', 'energy', 'tired'],
            creativity: ['creative', 'art', 'write', 'draw', 'paint', 'music'],
            dreams: ['dream', 'goal', 'future', 'plan', 'hope', 'wish']
        };

        const words = text.toLowerCase().split(/\s+/);
        words.forEach(word => {
            for (const [topic, keywords] of Object.entries(topicKeywords)) {
                if (keywords.includes(word)) {
                    topics[topic]++;
                }
            }
        });

        return topics;
    }

    function updateWritingSpeed() {
        if (writingSpeedData.length > 0) {
            const latestSpeed = writingSpeedData[writingSpeedData.length - 1].speed;
            document.getElementById('avg-pace').textContent = `⚡ ${Math.round(latestSpeed)} wpm`;
        }
    }

    function updateKeywords(text) {
        const words = text.toLowerCase().split(/\s+/);
        const wordFrequency = new Map();
        
        words.forEach(word => {
            if (word.length > 3) { // Only consider words longer than 3 characters
                wordFrequency.set(word, (wordFrequency.get(word) || 0) + 1);
            }
        });
        
        // Convert to array and sort by frequency
        keywords = Array.from(wordFrequency.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([word, frequency]) => ({
                word,
                frequency
            }));
    }

    // Helper function for emotion colors
    function getEmotionColor(emotion, alpha = 1) {
        const colors = {
            'joy': `rgba(255, 215, 0, ${alpha})`,    // Gold
            'sadness': `rgba(100, 149, 237, ${alpha})`,    // Blue
            'anger': `rgba(255, 99, 71, ${alpha})`,    // Red
            'fear': `rgba(147, 112, 219, ${alpha})`, // Purple
            'surprise': `rgba(32, 178, 170, ${alpha})`    // Teal
        };
        
        return colors[emotion] || `rgba(52, 152, 219, ${alpha})`;
    }

    function displayEmotionsChart(emotions) {
        // Calculate percentages
        const total = Object.values(emotions).reduce((a, b) => a + b, 0);
        const emotionsWithPercentages = Object.entries(emotions).map(([emotion, count]) => ({
            emotion,
            count,
            percentage: total > 0 ? (count / total) * 100 : 0
        }));

        // Create the chart
        createEmotionsChart(emotionsWithPercentages, 'emotions-chart');
    }

    function displayTopicsChart(topics) {
        // Calculate percentages
        const total = Object.values(topics).reduce((a, b) => a + b, 0);
        const topicsWithPercentages = Object.entries(topics).map(([topic, count]) => ({
            topic,
            count,
            percentage: total > 0 ? (count / total) * 100 : 0
        }));

        // Create the chart
        createTopicsChart(topicsWithPercentages, 'topics-chart');
    }

    function displaySpeedGraph() {
        if (writingSpeedData.length < 2) return;

        // Format data for Chart.js
        const speedData = writingSpeedData.map(data => ({
            time: data.time,
            wordsPerMinute: data.speed
        }));

        // Create the chart
        createSpeedChart(speedData, 'speed-graph');
    }

    // Create or update the writing speed chart
    function createSpeedChart(speedData, containerId) {
        const canvas = document.getElementById(containerId);
        const ctx = canvas.getContext('2d');
        
        // Get CSS variables
        const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent-color').trim();
        const textPrimary = getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim();
        const textSecondary = getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim();
        
        // Check if chart already exists and destroy it
        if (window.speedChart) {
            window.speedChart.destroy();
        }
        
        // Format the data for Chart.js
        const timeLabels = speedData.map(point => `${Math.round(point.time)}m`);
        const speedValues = speedData.map(point => point.wordsPerMinute);
        
        // Create the chart
        window.speedChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: timeLabels,
                datasets: [{
                    label: 'Words Per Minute',
                    data: speedValues,
                    borderColor: accentColor,
                    backgroundColor: `rgba(0, 255, 157, 0.1)`,
                    borderWidth: 2,
                    pointRadius: 4,
                    pointBackgroundColor: accentColor,
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Writing Speed Over Time',
                        font: {
                            size: 16,
                            color: textPrimary
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.parsed.y} words/min`;
                            }
                        }
                    },
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Time Elapsed (minutes)',
                            font: {
                                size: 12,
                                color: textSecondary
                            }
                        },
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Words Per Minute',
                            font: {
                                size: 12,
                                color: textSecondary
                            }
                        },
                        beginAtZero: true,
                        suggestedMax: 40,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.05)'
                        }
                    }
                },
                animation: {
                    duration: 1000
                }
            }
        });
    }

    // Create or update the emotions chart
    function createEmotionsChart(emotions, containerId) {
        const canvas = document.getElementById(containerId);
        const ctx = canvas.getContext('2d');
        
        // Get CSS variables
        const textPrimary = getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim();
        const textSecondary = getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim();
        
        // Check if chart already exists and destroy it
        if (window.emotionsChart) {
            window.emotionsChart.destroy();
        }
        
        // Sort emotions by percentage
        const sortedEmotions = emotions.sort((a, b) => b.percentage - a.percentage);
        
        // Get labels and data
        const labels = sortedEmotions.map(item => item.emotion);
        const data = sortedEmotions.map(item => item.percentage);
        
        // Colors for emotions
        const backgroundColors = sortedEmotions.map(item => getEmotionColor(item.emotion, 0.7));
        const borderColors = sortedEmotions.map(item => getEmotionColor(item.emotion, 1));
        
        // Create the chart
        window.emotionsChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Emotional Tone',
                    data: data,
                    backgroundColor: backgroundColors,
                    borderColor: borderColors,
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                plugins: {
                    title: {
                        display: true,
                        text: 'Emotional Tone Analysis',
                        font: {
                            size: 16,
                            color: textPrimary
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.parsed.x}%`;
                            }
                        }
                    },
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                            display: true,
                            text: 'Percentage (%)',
                            font: {
                                size: 12,
                                color: textSecondary
                            }
                        }
                    },
                    y: {
                        grid: {
                            display: false
                        }
                    }
                },
                animation: {
                    duration: 500
                }
            }
        });
    }

    // Create or update the topics chart
    function createTopicsChart(topics, containerId) {
        const canvas = document.getElementById(containerId);
        const ctx = canvas.getContext('2d');
        
        // Get CSS variables
        const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent-color').trim();
        const accentColor2 = getComputedStyle(document.documentElement).getPropertyValue('--accent-color-2').trim();
        const accentColor3 = getComputedStyle(document.documentElement).getPropertyValue('--accent-color-3').trim();
        const accentColor4 = getComputedStyle(document.documentElement).getPropertyValue('--accent-color-4').trim();
        const accentColor5 = getComputedStyle(document.documentElement).getPropertyValue('--accent-color-5').trim();
        const textPrimary = getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim();
        const textSecondary = getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim();
        
        // Check if chart already exists and destroy it
        if (window.topicsChart) {
            window.topicsChart.destroy();
        }
        
        // Sort topics by percentage
        const sortedTopics = topics.sort((a, b) => b.percentage - a.percentage);
        
        // Get labels and data
        const labels = sortedTopics.map(item => item.topic);
        const data = sortedTopics.map(item => item.percentage);
        
        // Create the chart
        window.topicsChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: [
                        accentColor,
                        accentColor2,
                        accentColor3,
                        accentColor4,
                        accentColor5
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Topic Distribution',
                        font: {
                            size: 16,
                            color: textPrimary
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.label}: ${context.parsed}%`;
                            }
                        }
                    },
                    legend: {
                        position: 'right',
                        labels: {
                            boxWidth: 12,
                            padding: 10,
                            font: {
                                size: 11,
                                color: textSecondary
                            }
                        }
                    }
                },
                animation: {
                    animateRotate: true,
                    animateScale: true
                }
            }
        });
    }

    // Common stop words to filter out
    const commonStopWords = [
        "the", "and", "that", "have", "for", "not", "with", "you", "this", 
        "but", "his", "from", "they", "she", "her", "will", "what", "all", 
        "would", "there", "their", "when", "who", "make", "can", "like", 
        "time", "just", "him", "know", "take", "into", "year", "your", "good"
    ];

    function createWordCloud(text, container) {
        // Clear previous word cloud
        d3.select(container).html("");
        
        // Process text to get word frequencies
        const words = text.toLowerCase()
            .replace(/[^\w\s]/g, '')
            .split(/\s+/)
            .filter(word => word.length > 3 && !commonStopWords.includes(word));
        
        // Count word frequencies
        const wordFreq = {};
        words.forEach(word => {
            wordFreq[word] = (wordFreq[word] || 0) + 1;
        });
        
        // Convert to array of objects for d3
        const wordArray = Object.entries(wordFreq)
            .map(([word, frequency]) => ({ text: word, size: frequency }))
            .filter(item => item.size > 1)  // Only include words that appear more than once
            .sort((a, b) => b.size - a.size)
            .slice(0, 50);  // Limit to top 50 words
        
        // Set scaling function for word sizes
        const fontScale = d3.scaleLog()
            .domain([Math.min(...wordArray.map(d => d.size)), 
                    Math.max(...wordArray.map(d => d.size))])
            .range([10, 60]);  // min/max font sizes
        
        // Set dimensions
        const width = d3.select(container).node().getBoundingClientRect().width;
        const height = 300;
        
        // Create layout
        const layout = d3.layout.cloud()
            .size([width, height])
            .words(wordArray)
            .padding(5)
            .rotate(() => 0)  // No rotation for better readability
            .fontSize(d => fontScale(d.size))
            .spiral('archimedean')  // Use archimedean spiral for better spacing
            .on("end", draw);
        
        // Start layout calculation
        layout.start();
        
        function draw(words) {
            // Create SVG
            const svg = d3.select(container).append("svg")
                .attr("width", width)
                .attr("height", height)
                .attr("class", "word-cloud")
                .append("g")
                .attr("transform", `translate(${width/2},${height/2})`);
            
            // Add words
            const wordElements = svg.selectAll("text")
                .data(words)
                .enter().append("text")
                .style("font-size", d => `${d.size}px`)
                .style("fill", (d, i) => d3.schemeCategory10[i % 10])
                .attr("text-anchor", "middle")
                .attr("transform", d => `translate(${d.x},${d.y})`)
                .attr("class", "word-cloud-word")
                .style("opacity", 0)
                .text(d => d.text);
            
            // Animate words appearing with staggered delay
            wordElements.transition()
                .duration(500)
                .delay((d, i) => i * 20)
                .style("opacity", 1);
            
            // Add tooltip showing frequency
            wordElements
                .append("title")
                .text(d => `${d.text}: ${d.size} occurrences`);
        }
    }

    // Function to debounce word cloud generation
    function debounce(func, wait) {
        let timeout;
        return function() {
            const context = this;
            const args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                func.apply(context, args);
            }, wait);
        };
    }

    // Update the displayKeywordCloud function
    function displayKeywordCloud() {
        const cloudContainer = document.getElementById('keyword-cloud');
        cloudContainer.innerHTML = '';
        
        if (!textEditor.value.trim()) {
            cloudContainer.innerHTML = '<div class="keyword-tag">Start writing to see your most used words</div>';
            return;
        }
        
        // Create debounced word cloud function
        const debouncedWordCloud = debounce((text) => {
            createWordCloud(text, cloudContainer);
        }, 500);
        
        // Generate word cloud
        debouncedWordCloud(textEditor.value);
    }

    function showCelebration() {
        celebrationContainer.classList.add('show');
        createConfetti();
        
        setTimeout(() => {
            celebrationContainer.classList.remove('show');
        }, 5000);
    }

    function createConfetti() {
        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = `${Math.random() * 100}%`;
            confetti.style.animationDelay = `${Math.random() * 3}s`;
            celebrationContainer.appendChild(confetti);
        }
    }

    // Update saveProgress function
    async function saveProgress() {
        if (currentUser) {
            try {
                const metadata = {
                    wordHistory,
                    writingSpeedData,
                    keywords: Array.from(keywords),
                    emotions: window.emotionsChart ? window.emotionsChart.data : null,
                    topics: window.topicsChart ? window.topicsChart.data : null
                };
                
                await storageManager.saveWriting(textEditor.value, metadata);
            } catch (error) {
                console.error("Failed to save progress:", error);
                // Fallback to localStorage
                localStorage.setItem(`morning-pages-${currentUser}`, JSON.stringify({
                    text: textEditor.value,
                    wordCount: optimizedCountWords(textEditor.value),
                    timestamp: Date.now(),
                    wordHistory,
                    writingSpeedData,
                    keywords: Array.from(keywords)
                }));
            }
        }
    }

    // Update loadProgress function
    async function loadProgress() {
        if (!currentUser) {
            console.log('No current user, skipping progress load');
            return;
        }
        
        try {
            console.log('Loading progress for user:', currentUser);
            const todayWriting = await storageManager.getTodayWriting();
            
            if (todayWriting) {
                console.log('Found today\'s writing, updating editor...');
                // Update editor content
                textEditor.value = todayWriting.text;
                
                // Update word history and speed data
                wordHistory = todayWriting.wordHistory || [];
                writingSpeedData = todayWriting.writingSpeedData || [];
                keywords = new Set(todayWriting.keywords || []);
                
                // Update word count and progress bar
                const wordCount = todayWriting.wordCount || optimizedCountWords(todayWriting.text);
                updateWordCount(wordCount);
                
                // Restore charts if data exists
                if (todayWriting.emotions) {
                    displayEmotionsChart(todayWriting.emotions);
                }
                if (todayWriting.topics) {
                    displayTopicsChart(todayWriting.topics);
                }
                
                // Update writing speed display
                if (writingSpeedData.length > 0) {
                    const latestSpeed = writingSpeedData[writingSpeedData.length - 1].speed;
                    document.getElementById('avg-pace').textContent = `⚡ ${Math.round(latestSpeed)} wpm`;
                }
                
                // Analyze text if it exists
                if (todayWriting.text.trim()) {
                    analyzeText(todayWriting.text);
                }
            } else {
                console.log('No writing found for today');
            }
        } catch (error) {
            console.error("Failed to load progress:", error);
            // Try localStorage fallback
            try {
                const savedProgress = localStorage.getItem(`morning-pages-${currentUser}`);
                if (savedProgress) {
                    console.log('Found progress in localStorage, restoring...');
                    const progress = JSON.parse(savedProgress);
                    textEditor.value = progress.text;
                    wordHistory = progress.wordHistory || [];
                    writingSpeedData = progress.writingSpeedData || [];
                    keywords = new Set(progress.keywords || []);
                    updateWordCount(progress.wordCount);
                    analyzeText(progress.text);
                } else {
                    console.log('No saved progress found in localStorage');
                }
            } catch (localStorageError) {
                console.error("Failed to load from localStorage:", localStorageError);
                throw new Error('Failed to load your saved data');
            }
        }
    }

    // Update loadUserData function
    async function loadUserData() {
        try {
            console.log('Starting to load user data...');
            
            if (!currentUser) {
                console.error('No current user found');
                throw new Error('No user logged in');
            }

            // Load progress first
            console.log('Loading progress for user:', currentUser);
            await loadProgress();
            
            // Skip streak and total words for now since they're not defined
            console.log('Initializing UI elements...');
            
            // Initialize analysis if there's text
            if (textEditor.value.trim()) {
                console.log('Analyzing existing text...');
                analyzeText(textEditor.value);
            }
            
            console.log('User data loaded successfully');
        } catch (error) {
            console.error("Failed to load user data:", error);
            throw error; // Let the login handler handle the error
        }
    }

    // Update autosave function
    const autosave = debounce(async function(text) {
        if (currentUser) {
            try {
                const metadata = {
                    wordHistory,
                    writingSpeedData,
                    keywords: Array.from(keywords),
                    emotions: window.emotionsChart ? window.emotionsChart.data : null,
                    topics: window.topicsChart ? window.topicsChart.data : null
                };
                
                await storageManager.saveWriting(text, metadata);
            } catch (error) {
                console.error("Failed to autosave:", error);
                // Fallback to localStorage
                localStorage.setItem(`morning-pages-${currentUser}`, JSON.stringify({
                    text,
                    wordCount: optimizedCountWords(text),
                    timestamp: Date.now(),
                    wordHistory,
                    writingSpeedData,
                    keywords: Array.from(keywords)
                }));
            }
        }
    }, 1000);

    // Auto-save every 30 seconds
    setInterval(saveProgress, 30000);

    // Performance optimization utilities
    function throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    // TextAnalyzer class for background processing
    class TextAnalyzer {
        constructor() {
            this.worker = null;
            this.isAnalyzing = false;
            this.queue = [];
            this.initWorker();
            
            // Emotion and topic keywords
            this.emotionKeywords = {
                'happy': ['happy', 'joy', 'excited', 'glad', 'pleased', 'delight', 'smile', 'laugh'],
                'sad': ['sad', 'unhappy', 'depressed', 'miserable', 'sorrow', 'cry', 'tears'],
                'angry': ['angry', 'mad', 'furious', 'rage', 'upset', 'annoyed', 'irritated'],
                'anxious': ['anxious', 'worry', 'nervous', 'stress', 'tense', 'afraid', 'fear'],
                'calm': ['calm', 'peaceful', 'relaxed', 'tranquil', 'serene', 'quiet'],
                'grateful': ['grateful', 'thankful', 'appreciate', 'thanks', 'blessed']
            };
            
            this.topicKeywords = {
                'work': ['work', 'job', 'office', 'project', 'boss', 'career', 'meeting'],
                'family': ['family', 'mom', 'dad', 'parent', 'child', 'son', 'daughter', 'wife', 'husband'],
                'health': ['health', 'exercise', 'workout', 'gym', 'diet', 'eat', 'food', 'sleep'],
                'creative': ['write', 'create', 'idea', 'design', 'art', 'music', 'book', 'story'],
                'future': ['future', 'plan', 'goal', 'dream', 'hope', 'wish']
            };
        }
        
        initWorker() {
            if (window.Worker) {
                this.worker = new Worker('text-analysis-worker.js');
                
                this.worker.onmessage = (e) => {
                    const { emotions, topics } = e.data;
                    
                    // Process results
                    const callback = this.queue.shift();
                    if (callback) {
                        callback(emotions, topics);
                    }
                    
                    this.isAnalyzing = false;
                    this.processQueue();
                };
            }
        }
        
        analyzeText(text, callback) {
            // Queue the analysis request
            this.queue.push(callback);
            
            // Process the queue if not already analyzing
            if (!this.isAnalyzing) {
                this.processQueue();
            }
        }
        
        processQueue() {
            if (this.queue.length === 0 || this.isAnalyzing) {
                return;
            }
            
            this.isAnalyzing = true;
            
            // Send to worker
            this.worker.postMessage({
                text,
                emotionKeywords: this.emotionKeywords,
                topicKeywords: this.topicKeywords
            });
        }
    }

    // Initialize TextAnalyzer
    const textAnalyzer = new TextAnalyzer();

    // Optimized word counting
    function optimizedCountWords(text) {
        const matches = text.trim().match(/\S+/g);
        return matches ? matches.length : 0;
    }

    // Optimized celebration animation
    function optimizedShowCelebration() {
        celebrationContainer.classList.add('show');
        
        // Create confetti in batches
        createConfettiBatch(0, 50);
        
        setTimeout(() => {
            celebrationContainer.classList.remove('show');
        }, 5000);
    }

    function createConfettiBatch(start, count) {
        const batchSize = 10;
        const end = Math.min(start + batchSize, start + count);
        
        // Create a batch of confetti
        for (let i = start; i < end; i++) {
            createConfetti();
        }
        
        // Schedule next batch if needed
        if (end < start + count) {
            setTimeout(() => {
                createConfettiBatch(end, count - batchSize);
            }, 100);
        }
    }

    // Update event listeners
    textEditor.addEventListener('input', function() {
        const text = this.value;
        updateWordCount();
        autosave(text);
        
        // Use TextAnalyzer for analysis
        textAnalyzer.analyzeText(text, (emotions, topics) => {
            displayEmotionsChart(emotions);
            displayTopicsChart(topics);
            displaySpeedGraph();
            displayKeywordCloud();
        });
    });

    // Add these missing functions
    function updateStreak() {
        console.log('Updating streak (placeholder)');
        // This would normally update the streak UI based on writing habits
        // For now, just display a placeholder value
        const streakElement = document.getElementById('streak-count');
        if (streakElement) {
            streakElement.textContent = streak.toString();
        }
    }

    function updateTotalWords() {
        console.log('Updating total words (placeholder)');
        // This would normally calculate and display total words written
        // For now, just display a placeholder calculation
        totalWords = textEditor.value ? optimizedCountWords(textEditor.value) : 0;
        
        const totalWordsElement = document.getElementById('total-words');
        if (totalWordsElement) {
            totalWordsElement.textContent = totalWords.toString();
        }
    }
}); 