document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const textEditor = document.getElementById('text-editor');
    const wordCount = document.getElementById('word-count');
    const progressBar = document.getElementById('progress');
    const analysisSection = document.getElementById('analysis-section');
    const celebrationContainer = document.getElementById('celebration-container');
    const emotionsSummary = document.getElementById('emotions-summary');
    const topicsSummary = document.getElementById('topics-summary');
    const paceSummary = document.getElementById('pace-summary');
    const streakCount = document.getElementById('streak-count');
    const totalWordsElement = document.getElementById('total-words');

    // Application state
    let wordGoal = 750;
    let timerId;
    let startTime;
    let wordHistory = [];
    let goalReached = false;
    let totalWords = localStorage.getItem('totalWords') || 0;
    let streak = localStorage.getItem('streak') || 0;
    let lastWritingDate = localStorage.getItem('lastWritingDate') || '';

    // Initialize stats display
    updateStats();

    // Load saved progress if it exists
    loadProgress();

    // Event listeners
    textEditor.addEventListener('input', handleTextInput);
    
    // Check streak on load
    checkStreak();

    /**
     * Handle text input event
     */
    function handleTextInput() {
        // Start timer on first input
        if (!startTime) {
            startTime = new Date();
            // Record word count every 30 seconds for pace analysis
            timerId = setInterval(recordWordCount, 30000);
        }

        const text = textEditor.value;
        const words = countWords(text);
        
        // Update word count display
        wordCount.textContent = words;
        
        // Update progress bar
        const progress = Math.min(100, (words / wordGoal) * 100);
        progressBar.style.width = `${progress}%`;
        
        // Save progress
        saveProgress(text);
        
        // If goal is reached and wasn't reached before
        if (words >= wordGoal && !goalReached) {
            goalReached = true;
            
            // Show celebration
            showCelebration();
            
            // Update stats
            updateTotalWords(words);
            updateStreak();
            
            // Show analysis
            analyzeText(text);
            analysisSection.style.display = 'block';
        }
    }

    /**
     * Count words in text
     */
    function countWords(text) {
        // Trim whitespace and split by whitespace
        return text.trim() ? text.trim().split(/\s+/).length : 0;
    }

    /**
     * Record word count history for pace analysis
     */
    function recordWordCount() {
        const currentWords = countWords(textEditor.value);
        const currentTime = new Date();
        const elapsedMinutes = (currentTime - startTime) / 60000;
        
        wordHistory.push({
            time: elapsedMinutes,
            words: currentWords
        });
    }

    /**
     * Save progress to local storage
     */
    function saveProgress(text) {
        localStorage.setItem('savedText', text);
        localStorage.setItem('lastSaved', new Date().toISOString());
    }

    /**
     * Load progress from local storage
     */
    function loadProgress() {
        const savedText = localStorage.getItem('savedText');
        const lastSaved = localStorage.getItem('lastSaved');
        
        // Check if there's saved text and it's from today
        if (savedText && lastSaved) {
            const lastSavedDate = new Date(lastSaved).toDateString();
            const today = new Date().toDateString();
            
            // Only load if it's from today (morning pages should be fresh each day)
            if (lastSavedDate === today) {
                textEditor.value = savedText;
                handleTextInput(); // Trigger count update
            } else {
                // Clear old text if it's a new day
                localStorage.removeItem('savedText');
            }
        }
    }

    /**
     * Update streak and last writing date
     */
    function updateStreak() {
        const today = new Date().toDateString();
        
        if (lastWritingDate) {
            // Check if last writing was yesterday
            const lastDate = new Date(lastWritingDate);
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            
            if (lastDate.toDateString() === yesterday.toDateString()) {
                streak = parseInt(streak) + 1;
            } else if (lastDate.toDateString() !== today) {
                // Reset streak if last writing wasn't yesterday and isn't today
                streak = 1;
            }
        } else {
            // First time writing
            streak = 1;
        }
        
        // Save streak and date
        localStorage.setItem('streak', streak);
        localStorage.setItem('lastWritingDate', today);
        
        // Update display
        updateStats();
    }

    /**
     * Check streak on load
     */
    function checkStreak() {
        if (lastWritingDate) {
            const lastDate = new Date(lastWritingDate);
            const today = new Date().toDateString();
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            
            // If didn't write yesterday and hasn't written today
            if (lastDate.toDateString() !== yesterday.toDateString() && 
                lastDate.toDateString() !== today) {
                // Reset streak
                streak = 0;
                localStorage.setItem('streak', streak);
                updateStats();
            }
        }
    }

    /**
     * Update total words written
     */
    function updateTotalWords(words) {
        totalWords = parseInt(totalWords) + words;
        localStorage.setItem('totalWords', totalWords);
        updateStats();
    }

    /**
     * Update statistics display
     */
    function updateStats() {
        streakCount.textContent = `Streak: ${streak} days`;
        totalWordsElement.textContent = `Total words: ${totalWords}`;
    }

    /**
     * Analyze text for emotions and topics
     */
    function analyzeText(text) {
        // Emotion analysis
        const emotions = analyzeEmotions(text);
        displayEmotionsAnalysis(emotions);
        
        // Topic analysis
        const topics = analyzeTopics(text);
        displayTopicsAnalysis(topics);
        
        // Pace analysis
        displayPaceAnalysis();
    }

    /**
     * Analyze text for emotions
     * This is a simplified version - in production you'd use more sophisticated NLP
     */
    function analyzeEmotions(text) {
        // Define emotion keywords (simplified version)
        const emotionKeywords = {
            'happy': ['happy', 'joy', 'excited', 'glad', 'pleased', 'delight', 'smile', 'laugh'],
            'sad': ['sad', 'unhappy', 'depressed', 'miserable', 'sorrow', 'cry', 'tears'],
            'angry': ['angry', 'mad', 'furious', 'rage', 'upset', 'annoyed', 'irritated'],
            'anxious': ['anxious', 'worry', 'nervous', 'stress', 'tense', 'afraid', 'fear'],
            'calm': ['calm', 'peaceful', 'relaxed', 'tranquil', 'serene', 'quiet'],
            'grateful': ['grateful', 'thankful', 'appreciate', 'thanks', 'blessed']
        };
        
        // Convert text to lowercase and split into words
        const words = text.toLowerCase().match(/\b\w+\b/g) || [];
        
        // Initialize emotion counts
        const emotions = {};
        Object.keys(emotionKeywords).forEach(emotion => {
            emotions[emotion] = 0;
        });
        
        // Count emotion keywords
        words.forEach(word => {
            Object.keys(emotionKeywords).forEach(emotion => {
                if (emotionKeywords[emotion].includes(word)) {
                    emotions[emotion]++;
                }
            });
        });
        
        // Convert counts to percentages
        const total = Object.values(emotions).reduce((sum, count) => sum + count, 0) || 1;
        Object.keys(emotions).forEach(emotion => {
            emotions[emotion] = {
                count: emotions[emotion],
                percentage: Math.round((emotions[emotion] / total) * 100)
            };
        });
        
        return emotions;
    }

    /**
     * Analyze text for topics
     * This is a simplified version - in production you'd use more sophisticated NLP
     */
    function analyzeTopics(text) {
        // Define topic keywords (simplified version)
        const topicKeywords = {
            'work': ['work', 'job', 'office', 'project', 'boss', 'career', 'meeting'],
            'family': ['family', 'mom', 'dad', 'parent', 'child', 'son', 'daughter', 'wife', 'husband'],
            'health': ['health', 'exercise', 'workout', 'gym', 'diet', 'eat', 'food', 'sleep'],
            'creative': ['write', 'create', 'idea', 'design', 'art', 'music', 'book', 'story'],
            'future': ['future', 'plan', 'goal', 'dream', 'hope', 'wish']
        };
        
        // Convert text to lowercase and split into words
        const words = text.toLowerCase().match(/\b\w+\b/g) || [];
        
        // Initialize topic counts
        const topics = {};
        Object.keys(topicKeywords).forEach(topic => {
            topics[topic] = 0;
        });
        
        // Count topic keywords
        words.forEach(word => {
            Object.keys(topicKeywords).forEach(topic => {
                if (topicKeywords[topic].includes(word)) {
                    topics[topic]++;
                }
            });
        });
        
        // Convert counts to percentages
        const total = Object.values(topics).reduce((sum, count) => sum + count, 0) || 1;
        Object.keys(topics).forEach(topic => {
            topics[topic] = {
                count: topics[topic],
                percentage: Math.round((topics[topic] / total) * 100)
            };
        });
        
        return topics;
    }

    /**
     * Display emotions analysis with simple bar charts
     */
    function displayEmotionsAnalysis(emotions) {
        // Sort emotions by percentage (descending)
        const sortedEmotions = Object.entries(emotions)
            .sort((a, b) => b[1].percentage - a[1].percentage);
        
        // Create emotion chart bars
        let chartHTML = '';
        sortedEmotions.forEach(([emotion, data]) => {
            const color = getEmotionColor(emotion);
            chartHTML += `
                <div class="chart-bar-container">
                    <div class="chart-label">${emotion}</div>
                    <div class="chart-bar" style="width: ${data.percentage}%; background-color: ${color};"></div>
                    <div class="chart-value">${data.percentage}%</div>
                </div>
            `;
        });
        
        document.getElementById('emotions-chart').innerHTML = chartHTML;
        
        // Create summary
        let summary = '';
        const topEmotion = sortedEmotions[0];
        if (topEmotion && topEmotion[1].count > 0) {
            summary += `<p>Your writing today appears to be predominantly <strong>${topEmotion[0]}</strong>.</p>`;
        } else {
            summary += `<p>No strong emotions detected in your writing today.</p>`;
        }
        
        emotionsSummary.innerHTML = summary;
    }

    /**
     * Display topics analysis with simple bar charts
     */
    function displayTopicsAnalysis(topics) {
        // Sort topics by percentage (descending)
        const sortedTopics = Object.entries(topics)
            .sort((a, b) => b[1].percentage - a[1].percentage);
        
        // Create topic chart bars
        let chartHTML = '';
        sortedTopics.forEach(([topic, data]) => {
            chartHTML += `
                <div class="chart-bar-container">
                    <div class="chart-label">${topic}</div>
                    <div class="chart-bar" style="width: ${data.percentage}%;"></div>
                    <div class="chart-value">${data.percentage}%</div>
                </div>
            `;
        });
        
        document.getElementById('topics-chart').innerHTML = chartHTML;
        
        // Create summary
        let summary = '';
        const topTopic = sortedTopics[0];
        if (topTopic && topTopic[1].count > 0) {
            summary += `<p>You wrote most about <strong>${topTopic[0]}</strong> today.</p>`;
        } else {
            summary += `<p>No specific topics were prominently detected.</p>`;
        }
        
        topicsSummary.innerHTML = summary;
    }

    /**
     * Display pace analysis
     */
    function displayPaceAnalysis() {
        if (wordHistory.length < 2) {
            paceSummary.innerHTML = '<p>Not enough data to analyze writing pace.</p>';
            return;
        }
        
        // Calculate words per minute
        const firstRecord = wordHistory[0];
        const lastRecord = wordHistory[wordHistory.length - 1];
        const totalMinutes = lastRecord.time - firstRecord.time || 1; // Avoid division by zero
        const wordsPerMinute = Math.round((lastRecord.words - firstRecord.words) / totalMinutes);
        
        // Determine if pace is steady or variable
        let paceVariability = 'steady';
        let paceVariabilityScore = 0;
        
        for (let i = 1; i < wordHistory.length; i++) {
            const prevWords = wordHistory[i-1].words;
            const currWords = wordHistory[i].words;
            const prevTime = wordHistory[i-1].time;
            const currTime = wordHistory[i].time;
            
            const wordsAdded = currWords - prevWords;
            const timeElapsed = currTime - prevTime;
            const instantWPM = wordsAdded / timeElapsed;
            
            // Accumulate variability score based on deviation from average
            paceVariabilityScore += Math.abs(instantWPM - wordsPerMinute);
        }
        
        // Normalize variability score
        paceVariabilityScore = paceVariabilityScore / wordHistory.length;
        
        if (paceVariabilityScore > 5) {
            paceVariability = 'variable';
        }
        
        // Create pace chart (simple representation)
        let chartHTML = `
            <div class="pace-meter">
                <div class="pace-value" style="width: ${Math.min(100, wordsPerMinute * 3)}%"></div>
            </div>
            <div class="pace-scale">
                <span>0</span>
                <span>10</span>
                <span>20</span>
                <span>30+</span>
            </div>
        `;
        
        document.getElementById('pace-chart').innerHTML = chartHTML;
        
        // Create summary
        let summary = `
            <p>Your average writing speed was <strong>${wordsPerMinute} words per minute</strong>.</p>
            <p>Your writing pace was <strong>${paceVariability}</strong>.</p>
        `;
        
        // Add writing time
        const totalWritingMinutes = Math.round(totalMinutes);
        summary += `<p>You took approximately <strong>${totalWritingMinutes} minutes</strong> to reach your goal.</p>`;
        
        paceSummary.innerHTML = summary;
    }

    /**
     * Get color for emotion
     */
    function getEmotionColor(emotion) {
        const colors = {
            'happy': '#FFD700',    // Gold
            'sad': '#6495ED',      // Blue
            'angry': '#FF6347',    // Red
            'anxious': '#9370DB',  // Purple
            'calm': '#20B2AA',     // Teal
            'grateful': '#3CB371'  // Green
        };
        
        return colors[emotion] || '#3498db';
    }

    /**
     * Show celebration animation
     */
    function showCelebration() {
        // Make container visible
        celebrationContainer.style.display = 'block';
        
        // Create confetti
        for (let i = 0; i < 150; i++) {
            createConfetti();
        }
        
        // Show congratulatory message
        const message = document.createElement('div');
        message.className = 'congrats-message';
        
        message.innerHTML = `
            <h2>Congratulations!</h2>
            <p>You've reached your goal of ${wordGoal} words!</p>
            <button id="close-celebration">Continue</button>
        `;
        
        celebrationContainer.appendChild(message);
        
        // Add close button event
        document.getElementById('close-celebration').addEventListener('click', function() {
            celebrationContainer.style.display = 'none';
            celebrationContainer.innerHTML = '';
        });
        
        // Auto-hide after 8 seconds
        setTimeout(function() {
            celebrationContainer.style.display = 'none';
            celebrationContainer.innerHTML = '';
        }, 8000);
    }

    /**
     * Create a single confetti element
     */
    function createConfetti() {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        
        // Random position, color, and animation duration
        const left = Math.random() * 100;
        const animationDuration = 3 + (Math.random() * 5);
        const hue = Math.random() * 360;
        
        confetti.style.left = `${left}vw`;
        confetti.style.backgroundColor = `hsl(${hue}, 80%, 60%)`;
        confetti.style.animationDuration = `${animationDuration}s`;
        
        // Add to container
        celebrationContainer.appendChild(confetti);
        
        // Remove after animation
        setTimeout(() => {
            confetti.remove();
        }, animationDuration * 1000);
    }
}); 