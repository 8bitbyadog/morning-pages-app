// Import StorageManager
import StorageManager from './storage-manager.js';

document.addEventListener('DOMContentLoaded', () => {
    // Initialize StorageManager
    const storageManager = new StorageManager();

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
    let currentUser = 'local';
    let writingSpeedData = [];
    let keywords = new Set();

    // Sidebar Toggle
    sidebarToggle.addEventListener('click', () => {
        sidebar.classList.toggle('open');
        mainContent.classList.toggle('sidebar-open');
    });

    // Initialize app directly — no login required
    (async () => {
        try {
            void appContent.offsetWidth; // force reflow for CSS transition
            appContent.classList.add('visible');
            await loadUserData();
            startTime = Date.now();
            textEditor.addEventListener('keydown', handleKeyDown);
        } catch (error) {
            console.error('Error initializing app:', error);
        }
    })();

    function downloadMarkdown() {
        const text = textEditor.value.trim();
        if (!text) return;

        const date = new Date().toLocaleDateString('en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });
        const wordCount = optimizedCountWords(text);

        const md = `# Morning Pages\n\n**${date}** · ${wordCount} words\n\n---\n\n${text}\n`;

        const blob = new Blob([md], { type: 'text/markdown' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = `morning-pages-${new Date().toISOString().split('T')[0]}.md`;
        a.click();
        URL.revokeObjectURL(url);
    }

    function downloadTXT() {
        const text = textEditor.value.trim();
        if (!text) return;

        const date = new Date().toLocaleDateString('en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });
        const wordCount = optimizedCountWords(text);

        const output = `Morning Pages — ${date} — ${wordCount} words\n\n${text}\n`;

        const blob = new Blob([output], { type: 'text/plain' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = `morning-pages-${new Date().toISOString().split('T')[0]}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    }

    async function downloadPDF() {
        const text = textEditor.value.trim();
        if (!text) return;

        const { jsPDF } = window.jspdf;
        const date = new Date().toLocaleDateString('en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });
        const wordCount = optimizedCountWords(text);
        const minutesSpent = startTime ? Math.round((Date.now() - startTime) / 60000) : 0;
        const statLine = minutesSpent > 0
            ? `${wordCount} words · ${minutesSpent} min`
            : `${wordCount} words`;
        const dateSlug = new Date().toISOString().split('T')[0];

        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const pageW = doc.internal.pageSize.getWidth();
        const pageH = doc.internal.pageSize.getHeight();
        const margin = 18;
        const contentW = pageW - margin * 2;
        const bottomMargin = pageH - margin;

        // ── Pages 1+: written text ────────────────────────────────────────
        doc.setFontSize(16);
        doc.setTextColor(0, 200, 130);
        doc.text('Morning Pages', margin, margin + 5);

        doc.setFontSize(9);
        doc.setTextColor(110, 110, 110);
        doc.text(date, margin, margin + 12);
        doc.text(statLine, margin, margin + 17);

        doc.setDrawColor(70, 70, 70);
        doc.line(margin, margin + 21, pageW - margin, margin + 21);

        doc.setFontSize(11);
        doc.setTextColor(30, 30, 30);

        const bodyLines = doc.splitTextToSize(text, contentW);
        const lineH = 6.5;
        let y = margin + 28;

        for (const line of bodyLines) {
            if (y + lineH > bottomMargin) {
                doc.addPage();
                y = margin;
            }
            doc.text(line, margin, y);
            y += lineH;
        }

        // ── Final page: analysis ──────────────────────────────────────────
        doc.addPage();

        doc.setFontSize(13);
        doc.setTextColor(0, 200, 130);
        doc.text('Writing Analysis', margin, margin + 5);

        doc.setFontSize(8);
        doc.setTextColor(110, 110, 110);
        doc.text(`${date} · ${statLine}`, margin, margin + 11);

        doc.setDrawColor(70, 70, 70);
        doc.line(margin, margin + 15, pageW - margin, margin + 15);

        const bgColor = getComputedStyle(document.documentElement)
            .getPropertyValue('--bg-primary').trim() || '#1a1a1a';
        const analysisEl = document.querySelector('.analysis-container');
        const capturedCanvas = await html2canvas(analysisEl, { scale: 2, backgroundColor: bgColor });
        const imgData = capturedCanvas.toDataURL('image/png');

        const imgY = margin + 19;
        const maxImgW = contentW;
        const maxImgH = pageH - imgY - margin;
        const aspect = capturedCanvas.height / capturedCanvas.width;

        let finalW = maxImgW;
        let finalH = finalW * aspect;
        if (finalH > maxImgH) { finalH = maxImgH; finalW = finalH / aspect; }

        doc.addImage(imgData, 'PNG', margin, imgY, finalW, finalH);

        doc.setFontSize(7);
        doc.setTextColor(140, 140, 140);
        doc.text(`Morning Pages · ${new Date().toISOString()}`, margin, pageH - 5);

        doc.save(`morning-pages-${dateSlug}.pdf`);
    }

    // Wire download buttons
    document.getElementById('celebration-md-btn').addEventListener('click', downloadMarkdown);
    document.getElementById('celebration-pdf-btn').addEventListener('click', downloadPDF);
    document.getElementById('celebration-txt-btn').addEventListener('click', downloadTXT);

    // Header Save dropdown
    const dlTrigger = document.querySelector('.dl-trigger');
    const dlMenu    = document.querySelector('.dl-menu');

    dlTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        dlMenu.classList.toggle('open');
    });

    document.addEventListener('click', () => dlMenu.classList.remove('open'));

    dlMenu.querySelectorAll('li').forEach(item => {
        item.addEventListener('click', () => {
            dlMenu.classList.remove('open');
            const fmt = item.dataset.dl;
            if (fmt === 'md')  downloadMarkdown();
            if (fmt === 'pdf') downloadPDF();
            if (fmt === 'txt') downloadTXT();
        });
    });

    function handleTextInput() {
        const text = textEditor.value;
        const wordCount = countWords(text);
        updateWordCount(wordCount);
        recordWordCountHistory(wordCount);
        analyzeText(text);
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
            showAnalysis();
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
        const { counts: emotions, matchedWords } = analyzeEmotions(text);
        const topics = analyzeTopics(text);
        displayEmotionsChart(emotions, matchedWords);
        displayTopicsChart(topics);
        displaySentimentArc(analyzeSentimentArc(text));
        displayKeywordCloud();
    }

    function analyzeEmotions(text) {
        const counts = {
            joy: 0, sadness: 0, anger: 0, fear: 0, longing: 0,
            peace: 0, awe: 0, shame: 0, gratitude: 0, restlessness: 0, tenderness: 0
        };
        const matched = {};
        Object.keys(counts).forEach(e => { matched[e] = new Set(); });

        const emotionKeywords = {
            joy:          ['happy','happiness','glad','pleased','delight','delighted','bright','laugh','laughing','smile','smiled','bliss','blissful','elated','cheerful','wonderful','amazing','love','loved','loving','glee','gleeful','contented','jubilant','radiant','joyful','joyous'],
            sadness:      ['sad','sadness','unhappy','grief','grieve','sorrow','sorrowful','depressed','depression','lonely','loneliness','hurt','heartbreak','heartbroken','cry','crying','tears','weep','weeping','loss','mourn','mourning','heavy','empty','hollow','blue','gloomy','gloom','despair','despairing','bereft'],
            anger:        ['angry','anger','furious','fury','rage','hate','hatred','hated','hateful','annoyed','irritated','frustrated','frustration','bitter','bitterness','resentment','resent','hostile','outrage','outraged','livid','seething','contempt'],
            fear:         ['afraid','fear','fearful','scared','anxiety','anxious','worried','worry','panic','panicked','terror','terrified','dread','dreading','nervous','nervousness','horror','horrified','uneasy','apprehensive','timid'],
            longing:      ['longing','miss','missed','missing','yearn','yearning','nostalgia','nostalgic','wistful','wish','wishing','hunger','hungering','thirst','craving','desire','desiring','lonesome','pine','pining','absence'],
            peace:        ['peace','peaceful','calm','calming','serene','serenity','tranquil','tranquility','quiet','stillness','restful','relaxed','relaxing','ease','settled','centered','grounded','acceptance','accepting','surrender','surrendering'],
            awe:          ['awe','amazed','amazement','astonished','breathtaking','magnificent','beautiful','beauty','sublime','vast','infinite','moved','speechless','reverent','reverence','sacred','mystery','mysterious','miracle','miraculous','holy','luminous','radiant','stunning'],
            shame:        ['shame','ashamed','guilty','guilt','embarrassed','embarrassment','humiliated','humiliation','regret','regretful','worthless','failure','failed','disgrace','disgraced','inadequate','flawed','unworthy'],
            gratitude:    ['grateful','gratitude','thankful','appreciate','appreciated','appreciation','blessed','blessing','bless','fortunate','lucky','abundance','abundant','gift'],
            restlessness: ['restless','restlessness','agitated','agitation','edgy','unsettled','jumpy','frantic','hectic','overwhelmed','scattered','distracted','racing','fidgety','impatient','impatience','frenzied','spinning','churning'],
            tenderness:   ['tender','tenderness','gentle','soft','delicate','fragile','vulnerable','vulnerability','compassion','compassionate','empathy','empathetic','caring','nurture','nurturing','cherish','cherished','affection','affectionate','kindness']
        };

        const words = text.toLowerCase().match(/\b[a-z]+\b/g) || [];
        words.forEach(word => {
            for (const [emotion, kws] of Object.entries(emotionKeywords)) {
                if (kws.includes(word)) {
                    counts[emotion]++;
                    matched[emotion].add(word);
                }
            }
        });

        const matchedWords = {};
        Object.entries(matched).forEach(([e, s]) => { matchedWords[e] = [...s]; });

        return { counts, matchedWords };
    }

    function analyzeTopics(text) {
        const counts = {
            nature: 0, body: 0, memory: 0, self: 0,
            creativity: 0, relationships: 0, work: 0
        };

        const topicKeywords = {
            nature: ['light','water','wild','earth','sky','river','morning','grass','tree','trees','forest','ocean','sea','lake','mountain','mountains','field','fields','bird','birds','flower','flowers','stone','stones','sand','wind','rain','sun','sunlight','moon','moonlight','shadow','shadows','leaf','leaves','root','roots','soil','ground','snow','ice','cloud','clouds','air','fire','seed','seeds','garden','path','wave','waves','stream','spring','summer','winter','autumn','dark','darkness','night','bloom','blooming'],
            body: ['body','skin','hand','hands','heart','breath','breathing','bones','bone','blood','chest','face','eyes','eye','tears','voice','throat','spine','shoulder','arms','arm','back','legs','leg','feet','foot','fingers','finger','tongue','mouth','belly','stomach','muscles','muscle','hair','ears','ear','nose','flesh','lungs','lung','pulse','knees','knee','wrists','wrist'],
            memory: ['remember','remembering','memory','memories','past','childhood','child','yesterday','ago','once','before','forgotten','forget','forgetting','nostalgia','nostalgic','old','older','young','younger','recall','recalling','reminds','reminded','returned','returning','history','formerly','used','long','days','years','time','when','then'],
            self: ['self','myself','identity','becoming','growing','changing','evolving','being','inner','soul','spirit','essence','authentic','authenticity','truth','whole','healing','healed','transform','transformation','emerge','emerging','growth','discovery','discover','discovering','knowing','finding','seeing','learning','understand','understanding','realizing','realize','aware','awareness'],
            creativity: ['write','writing','wrote','written','draw','drawing','drew','paint','painting','painted','music','song','songs','story','stories','idea','ideas','art','artist','create','creating','created','imagine','imagination','dream','dreaming','expression','express','vision','craft','crafting','make','making','poem','poetry','dance','dancing','compose','composing','make','play','playing'],
            relationships: ['friend','friends','friendship','family','partner','relationship','relationships','love','loved','lover','together','connection','connected','lonely','isolation','isolated','community','people','person','someone','bond','bonds','trust','trusted','betrayal','betrayed','mother','father','sister','brother','child','children','parent','parents','companion','alone','together'],
            work: ['work','working','job','career','business','project','meeting','deadline','boss','office','task','tasks','money','income','client','clients','email','schedule','professional','employed','salary','wage','effort','labor','labour','role','duty','duties','responsibility','responsibilities','achieve','goal','goals','success','fail','failure']
        };

        const words = text.toLowerCase().match(/\b[a-z]+\b/g) || [];
        words.forEach(word => {
            for (const [topic, kws] of Object.entries(topicKeywords)) {
                if (kws.includes(word)) counts[topic]++;
            }
        });

        return counts;
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

    function getEmotionColor(emotion, alpha = 1) {
        const colors = {
            'joy':          `rgba(255, 215,   0, ${alpha})`,
            'sadness':      `rgba(100, 149, 237, ${alpha})`,
            'anger':        `rgba(255,  99,  71, ${alpha})`,
            'fear':         `rgba(147, 112, 219, ${alpha})`,
            'longing':      `rgba(218, 112, 214, ${alpha})`,
            'peace':        `rgba( 32, 178, 170, ${alpha})`,
            'awe':          `rgba(  0, 191, 255, ${alpha})`,
            'shame':        `rgba(160,  82,  45, ${alpha})`,
            'gratitude':    `rgba(154, 205,  50, ${alpha})`,
            'restlessness': `rgba(255,  69,   0, ${alpha})`,
            'tenderness':   `rgba(255, 182, 193, ${alpha})`
        };
        return colors[emotion] || `rgba(52, 152, 219, ${alpha})`;
    }

    function displayEmotionsChart(emotions, matchedWords = {}) {
        const MIN_THRESHOLD = 3;
        const qualifying = Object.entries(emotions).filter(([, count]) => count >= MIN_THRESHOLD);
        const total = qualifying.reduce((sum, [, count]) => sum + count, 0);
        const emotionsWithData = qualifying.map(([emotion, count]) => ({
            emotion,
            count,
            percentage: total > 0 ? (count / total) * 100 : 0,
            words: matchedWords[emotion] || []
        }));
        createEmotionsChart(emotionsWithData, 'emotions-chart');
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

    function analyzeSentimentArc(text) {
        const words = text.trim().split(/\s+/).filter(w => w.length > 0);
        if (words.length < 30) return null;

        const positiveWords = new Set([
            // joy
            'happy','happiness','glad','pleased','delight','delighted','bright','laugh','laughing',
            'smile','smiled','bliss','blissful','elated','cheerful','wonderful','amazing','love',
            'loved','loving','glee','gleeful','content','contented','jubilant','radiant','joyful','joyous',
            // peace
            'peace','peaceful','calm','calming','serene','serenity','tranquil','tranquility','quiet',
            'stillness','still','restful','rest','relaxed','relaxing','ease','settled','centered',
            'grounded','acceptance','accepting','surrender','surrendering',
            // awe
            'awe','wonder','amazed','amazement','astonished','breathtaking','magnificent','beautiful',
            'beauty','sublime','vast','infinite','moved','speechless','reverent','reverence','sacred',
            'mystery','mysterious','miracle','miraculous','holy','luminous','stunning',
            // gratitude
            'grateful','gratitude','thankful','thank','thanks','appreciate','appreciated','appreciation',
            'blessed','blessing','bless','fortunate','lucky','abundance','abundant','gift','given',
            'receive','received','grace','gracious',
            // tenderness
            'tender','tenderness','gentle','soft','delicate','fragile','vulnerable','vulnerability',
            'compassion','compassionate','empathy','empathetic','caring','nurture','nurturing',
            'cherish','cherished','held','holding','affection','affectionate','kind','kindness'
        ]);

        const negativeWords = new Set([
            // sadness
            'sad','sadness','unhappy','grief','grieve','sorrow','sorrowful','depressed','depression',
            'lonely','loneliness','hurt','heartbreak','heartbroken','cry','crying','tears','weep',
            'weeping','loss','mourn','mourning','heavy','empty','hollow','blue','gloomy','gloom',
            'despair','despairing','bereft',
            // anger
            'angry','anger','mad','furious','fury','rage','hate','hatred','hated','hateful','annoyed',
            'irritated','frustrated','frustration','bitter','bitterness','resentment','resent',
            'hostile','outrage','outraged','livid','seething','contempt',
            // fear
            'afraid','fear','fearful','scared','anxiety','anxious','worried','worry','panic',
            'panicked','terror','terrified','dread','dreading','nervous','nervousness','tense',
            'tension','horror','horrified','uneasy','apprehensive','timid',
            // shame
            'shame','ashamed','guilty','guilt','embarrassed','embarrassment','humiliated','humiliation',
            'regret','regretful','sorry','worthless','failure','failed','disgrace','disgraced',
            'inadequate','flawed','unworthy','small',
            // restlessness
            'restless','restlessness','agitated','agitation','edgy','unsettled','jumpy','frantic',
            'hectic','overwhelmed','scattered','distracted','racing','fidgety','impatient','impatience',
            'frenzied','spinning','churning'
        ]);

        const segmentCount = 5;
        const segmentSize = Math.floor(words.length / segmentCount);
        const scores = [];

        for (let i = 0; i < segmentCount; i++) {
            const start = i * segmentSize;
            const end = i === segmentCount - 1 ? words.length : start + segmentSize;
            const segment = words.slice(start, end);

            let positive = 0;
            let negative = 0;
            for (const word of segment) {
                const clean = word.toLowerCase().replace(/[^a-z]/g, '');
                if (positiveWords.has(clean)) positive++;
                else if (negativeWords.has(clean)) negative++;
            }

            const total = positive + negative;
            scores.push(total === 0 ? 0 : (positive - negative) / total);
        }

        return scores;
    }

    function displaySentimentArc(scores) {
        const canvas = document.getElementById('speed-graph');
        const ctx = canvas.getContext('2d');
        const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent-color').trim() || '#00ff9d';

        let placeholder = document.getElementById('sentiment-placeholder');
        if (!scores) {
            canvas.style.display = 'none';
            if (!placeholder) {
                placeholder = document.createElement('div');
                placeholder.id = 'sentiment-placeholder';
                placeholder.style.cssText = 'display:flex;align-items:center;justify-content:center;height:100%;color:rgba(179,179,179,0.7);font-size:13px;text-align:center;padding:1rem;';
                canvas.parentNode.appendChild(placeholder);
            }
            placeholder.textContent = 'Write more to see your sentiment arc';
            return;
        }

        canvas.style.display = '';
        if (placeholder) placeholder.remove();

        if (window.speedChart) {
            window.speedChart.data.datasets[0].data = scores;
            window.speedChart.update('none');
            return;
        }

        window.speedChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Start', 'Early', 'Middle', 'Late', 'End'],
                datasets: [{
                    data: scores,
                    borderColor: accentColor,
                    backgroundColor: 'rgba(0, 255, 157, 0.12)',
                    borderWidth: 2,
                    pointRadius: 5,
                    pointBackgroundColor: accentColor,
                    tension: 0.4,
                    fill: 'origin'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const v = context.parsed.y;
                                if (v > 0.1) return `Positive (${Math.round(v * 100)}%)`;
                                if (v < -0.1) return `Negative (${Math.round(Math.abs(v) * 100)}%)`;
                                return 'Neutral';
                            }
                        }
                    }
                },
                scales: {
                    x: { grid: { display: false } },
                    y: {
                        min: -1,
                        max: 1,
                        grid: { color: 'rgba(255,255,255,0.05)' },
                        ticks: {
                            stepSize: 0.5,
                            callback: function(v) {
                                if (v === 1) return 'Positive';
                                if (v === -1) return 'Negative';
                                if (v === 0) return 'Neutral';
                                return '';
                            }
                        }
                    }
                },
                animation: { duration: 600 }
            }
        });
    }

    // Create or update the emotions chart
    function createEmotionsChart(emotions, containerId) {
        const canvas = document.getElementById(containerId);
        let placeholder = document.getElementById('emotions-placeholder');

        if (emotions.length === 0) {
            canvas.style.display = 'none';
            if (!placeholder) {
                placeholder = document.createElement('div');
                placeholder.id = 'emotions-placeholder';
                placeholder.style.cssText = 'display:flex;align-items:center;justify-content:center;height:100%;color:rgba(179,179,179,0.7);font-size:13px;text-align:center;padding:1rem;';
                canvas.parentNode.appendChild(placeholder);
            }
            placeholder.textContent = 'Keep writing — emotions appear after 3 keyword matches';
            return;
        }

        canvas.style.display = '';
        if (placeholder) placeholder.remove();

        const sortedEmotions = emotions.sort((a, b) => b.percentage - a.percentage);
        const labels = sortedEmotions.map(item => item.emotion);
        const data = sortedEmotions.map(item => item.percentage);
        const backgroundColors = sortedEmotions.map(item => getEmotionColor(item.emotion, 0.7));
        const borderColors = sortedEmotions.map(item => getEmotionColor(item.emotion, 1));
        const wordsByIndex = sortedEmotions.map(item => item.words || []);

        if (window.emotionsChart) {
            window.emotionsChart._matchedWords = wordsByIndex;
            window.emotionsChart.data.labels = labels;
            window.emotionsChart.data.datasets[0].data = data;
            window.emotionsChart.data.datasets[0].backgroundColor = backgroundColors;
            window.emotionsChart.data.datasets[0].borderColor = borderColors;
            window.emotionsChart.update('none');
            return;
        }

        const ctx = canvas.getContext('2d');
        const textPrimary = getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim();
        const textSecondary = getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim();

        window.emotionsChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'Emotional Tone',
                    data,
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
                                const pct = Math.round(context.parsed.x);
                                const words = (window.emotionsChart._matchedWords || [])[context.dataIndex] || [];
                                const lines = [`${pct}% of emotional content`];
                                if (words.length) lines.push(`matched: ${words.join(', ')}`);
                                return lines;
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
                    duration: 300
                }
            }
        });
        window.emotionsChart._matchedWords = wordsByIndex;
    }

    function createTopicsChart(topics, containerId) {
        const palette = ['#4CAF50','#FF9800','#9C27B0','#2196F3','#F44336','#E91E63','#607D8B'];
        const sortedTopics = topics.sort((a, b) => b.percentage - a.percentage);
        const labels = sortedTopics.map(item => item.topic);
        const data = sortedTopics.map(item => item.percentage);
        const backgroundColors = sortedTopics.map((_, i) => palette[i]);

        if (window.topicsChart) {
            window.topicsChart.data.labels = labels;
            window.topicsChart.data.datasets[0].data = data;
            window.topicsChart.data.datasets[0].backgroundColor = backgroundColors;
            window.topicsChart.update('none');
            return;
        }

        const canvas = document.getElementById(containerId);
        const ctx = canvas.getContext('2d');
        const textPrimary = getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim();
        const textSecondary = getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim();

        window.topicsChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: palette,
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
                        font: { size: 16, color: textPrimary }
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
                            font: { size: 11, color: textSecondary }
                        }
                    }
                },
                animation: { animateRotate: true, animateScale: true }
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

    const debouncedWordCloud = debounce((text) => {
        createWordCloud(text, document.getElementById('keyword-cloud'));
    }, 600);

    function displayKeywordCloud() {
        const text = textEditor.value.trim();
        if (!text) {
            document.getElementById('keyword-cloud').innerHTML = '<div class="keyword-tag">Start writing to see your most used words</div>';
            return;
        }
        debouncedWordCloud(text);
    }

    function showAnalysis() {
        document.querySelector('.analysis-container').classList.add('visible');
        analyzeText(textEditor.value);
    }

    function showCelebration() {
        celebrationContainer.classList.add('show');
        createConfetti();
    }

    function hideCelebration() {
        celebrationContainer.classList.remove('show');
    }

    document.getElementById('celebration-close-btn').addEventListener('click', hideCelebration);

    celebrationContainer.addEventListener('click', (e) => {
        if (e.target === celebrationContainer) hideCelebration();
    });

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
                
                const wordCount = todayWriting.wordCount || optimizedCountWords(todayWriting.text);
                if (wordCount >= wordGoal) {
                    goalReached = true;
                    document.querySelector('.analysis-container').classList.add('visible');
                }
                updateWordCount();

                if (writingSpeedData.length > 0) {
                    const latestSpeed = writingSpeedData[writingSpeedData.length - 1].speed;
                    document.getElementById('avg-pace').textContent = `⚡ ${Math.round(latestSpeed)} wpm`;
                }

                if (goalReached && todayWriting.text.trim()) {
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
                    const savedWordCount = progress.wordCount || optimizedCountWords(progress.text);
                    if (savedWordCount >= wordGoal) {
                        goalReached = true;
                        document.querySelector('.analysis-container').classList.add('visible');
                    }
                    updateWordCount();
                    if (goalReached && progress.text.trim()) {
                        analyzeText(progress.text);
                    }
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

    textEditor.addEventListener('input', function() {
        const text = this.value;
        updateWordCount();
        autosave(text);
        if (goalReached) analyzeText(text);
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
        totalWords = textEditor.value ? optimizedCountWords(textEditor.value) : 0;
        const totalWordsElement = document.getElementById('total-words');
        if (totalWordsElement) {
            totalWordsElement.textContent = totalWords.toString();
        }
    }

    // ─── Settings Panel ───────────────────────────────────────────────────────

    const SETTINGS_KEY = 'morning-pages-settings';

    const THEMES = {
        default: {
            '--bg-primary': '#1a1a1a', '--bg-secondary': '#2d2d2d', '--bg-tertiary': '#3d3d3d',
            '--text-primary': '#ffffff', '--text-secondary': '#b3b3b3', '--accent-color': '#00ff9d',
            '--border-color': '#404040', '--card-bg': '#2d2d2d', '--card-border': '#404040',
            '--hover-color': '#4a4a4a', '--button-bg': '#2d2d2d', '--button-hover': '#3d3d3d',
            '--input-bg': '#2d2d2d', '--input-border': '#404040', '--input-focus': '#4a4a4a',
        },
        sunrise: {
            '--bg-primary': '#FFF8DC', '--bg-secondary': '#F3ECC8', '--bg-tertiary': '#E8DEB5',
            '--text-primary': '#7B5E8C', '--text-secondary': '#A88DAC', '--accent-color': '#B584C7',
            '--border-color': '#D9CEB6', '--card-bg': '#F3ECC8', '--card-border': '#D9CEB6',
            '--hover-color': '#E8DEB5', '--button-bg': '#F3ECC8', '--button-hover': '#E8DEB5',
            '--input-bg': '#FFF8DC', '--input-border': '#D9CEB6', '--input-focus': '#EDE4CA',
        },
        'lavender-fog': {
            '--bg-primary': '#E8E4F3', '--bg-secondary': '#DDD8EE', '--bg-tertiary': '#D2CCE9',
            '--text-primary': '#4A3B5C', '--text-secondary': '#7A6890', '--accent-color': '#8470A8',
            '--border-color': '#C4BEDD', '--card-bg': '#DDD8EE', '--card-border': '#C4BEDD',
            '--hover-color': '#D2CCE9', '--button-bg': '#DDD8EE', '--button-hover': '#D2CCE9',
            '--input-bg': '#E8E4F3', '--input-border': '#C4BEDD', '--input-focus': '#D2CCE9',
        },
        'mint-paper': {
            '--bg-primary': '#E8F3EC', '--bg-secondary': '#DCEEE2', '--bg-tertiary': '#CFE8D7',
            '--text-primary': '#3D5A47', '--text-secondary': '#6D8A77', '--accent-color': '#5B8B6E',
            '--border-color': '#BDD5C5', '--card-bg': '#DCEEE2', '--card-border': '#BDD5C5',
            '--hover-color': '#CFE8D7', '--button-bg': '#DCEEE2', '--button-hover': '#CFE8D7',
            '--input-bg': '#E8F3EC', '--input-border': '#BDD5C5', '--input-focus': '#CFE8D7',
        },
        'peach-cream': {
            '--bg-primary': '#FCE8D8', '--bg-secondary': '#F5DBCA', '--bg-tertiary': '#EDCEBB',
            '--text-primary': '#8B4A3B', '--text-secondary': '#B8796C', '--accent-color': '#C97D5D',
            '--border-color': '#E0C4B0', '--card-bg': '#F5DBCA', '--card-border': '#E0C4B0',
            '--hover-color': '#EDCEBB', '--button-bg': '#F5DBCA', '--button-hover': '#EDCEBB',
            '--input-bg': '#FCE8D8', '--input-border': '#E0C4B0', '--input-focus': '#EDCEBB',
        },
        'sky-wash': {
            '--bg-primary': '#E3EDF5', '--bg-secondary': '#D6E3EF', '--bg-tertiary': '#C8D8E8',
            '--text-primary': '#2C3E50', '--text-secondary': '#5C7080', '--accent-color': '#547B9C',
            '--border-color': '#B5CBE0', '--card-bg': '#D6E3EF', '--card-border': '#B5CBE0',
            '--hover-color': '#C8D8E8', '--button-bg': '#D6E3EF', '--button-hover': '#C8D8E8',
            '--input-bg': '#E3EDF5', '--input-border': '#B5CBE0', '--input-focus': '#C8D8E8',
        },
        'dusk-rose': {
            '--bg-primary': '#F5E1E3', '--bg-secondary': '#EDD4D8', '--bg-tertiary': '#E5C7CC',
            '--text-primary': '#5C3A4A', '--text-secondary': '#8C6A77', '--accent-color': '#94586A',
            '--border-color': '#D4B8BE', '--card-bg': '#EDD4D8', '--card-border': '#D4B8BE',
            '--hover-color': '#E5C7CC', '--button-bg': '#EDD4D8', '--button-hover': '#E5C7CC',
            '--input-bg': '#F5E1E3', '--input-border': '#D4B8BE', '--input-focus': '#E5C7CC',
        },
    };

    const FONT_FAMILIES = {
        system: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif",
        serif: "Georgia, 'Times New Roman', serif",
        mono: "Menlo, Monaco, 'Courier New', monospace",
        handwritten: "'Kalam', cursive",
    };

    function adjustHex(hex, amount) {
        const num = parseInt(hex.replace('#', ''), 16);
        const r = Math.max(0, Math.min(255, (num >> 16) + amount));
        const g = Math.max(0, Math.min(255, ((num >> 8) & 0xff) + amount));
        const b = Math.max(0, Math.min(255, (num & 0xff) + amount));
        return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
    }

    function blendHex(hex1, hex2, ratio) {
        const parse = h => [parseInt(h.slice(1,3),16), parseInt(h.slice(3,5),16), parseInt(h.slice(5,7),16)];
        const [r1,g1,b1] = parse(hex1), [r2,g2,b2] = parse(hex2);
        return '#' + [
            Math.round(r1*(1-ratio)+r2*ratio),
            Math.round(g1*(1-ratio)+g2*ratio),
            Math.round(b1*(1-ratio)+b2*ratio)
        ].map(v => v.toString(16).padStart(2,'0')).join('');
    }

    function hexToLuminance(hex) {
        const parse = h => parseInt(h, 16) / 255;
        const lin = c => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        const r = lin(parse(hex.slice(1,3)));
        const g = lin(parse(hex.slice(3,5)));
        const b = lin(parse(hex.slice(5,7)));
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    }

    function contrastRatio(hex1, hex2) {
        const l1 = hexToLuminance(hex1), l2 = hexToLuminance(hex2);
        return (Math.max(l1,l2) + 0.05) / (Math.min(l1,l2) + 0.05);
    }

    function deriveCustomVars(bg, text, accent) {
        const lum = hexToLuminance(bg);
        const step = lum > 0.5 ? -12 : 20;
        return {
            '--bg-primary':    bg,
            '--bg-secondary':  adjustHex(bg, step),
            '--bg-tertiary':   adjustHex(bg, step * 2),
            '--text-primary':  text,
            '--text-secondary': blendHex(text, bg, 0.4),
            '--accent-color':  accent,
            '--border-color':  adjustHex(bg, Math.round(step * 2.5)),
            '--card-bg':       adjustHex(bg, step),
            '--card-border':   adjustHex(bg, Math.round(step * 2.5)),
            '--hover-color':   adjustHex(bg, Math.round(step * 1.5)),
            '--button-bg':     adjustHex(bg, step),
            '--button-hover':  adjustHex(bg, Math.round(step * 1.5)),
            '--input-bg':      bg,
            '--input-border':  adjustHex(bg, step * 2),
            '--input-focus':   adjustHex(bg, Math.round(step * 1.5)),
        };
    }

    function applyVars(vars) {
        for (const [k, v] of Object.entries(vars)) {
            document.documentElement.style.setProperty(k, v);
        }
    }

    function loadKalam() {
        if (!document.getElementById('kalam-font')) {
            const link = document.createElement('link');
            link.id = 'kalam-font';
            link.rel = 'stylesheet';
            link.href = 'https://fonts.googleapis.com/css2?family=Kalam:wght@400;700&display=swap';
            document.head.appendChild(link);
        }
    }

    function applySettings(s) {
        if (s.preset === 'custom') {
            applyVars(deriveCustomVars(s.customBg || '#1a1a1a', s.customText || '#ffffff', s.customAccent || '#00ff9d'));
        } else if (THEMES[s.preset]) {
            applyVars(THEMES[s.preset]);
        }
        if (s.fontFamily) {
            document.documentElement.style.setProperty('--font-family', FONT_FAMILIES[s.fontFamily] || FONT_FAMILIES.system);
            if (s.fontFamily === 'handwritten') loadKalam();
        }
        if (s.fontSize) {
            document.documentElement.style.setProperty('--font-size-base', s.fontSize + 'px');
        }
        if (s.lineHeight) {
            document.documentElement.style.setProperty('--line-height-base', s.lineHeight);
        }
    }

    function loadStoredSettings() {
        try { return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {}; }
        catch { return {}; }
    }

    function saveStoredSettings(s) {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
    }

    // DOM refs for settings panel
    const settingsBtn     = document.getElementById('settings-btn');
    const settingsPanel   = document.getElementById('settings-panel');
    const settingsOverlay = document.getElementById('settings-overlay');
    const settingsClose   = document.getElementById('settings-close');
    const bgPicker        = document.getElementById('bg-color-picker');
    const textPicker      = document.getElementById('text-color-picker');
    const accentPicker    = document.getElementById('accent-color-picker');
    const fontSelect      = document.getElementById('font-family-select');
    const contrastWarn    = document.getElementById('contrast-warning');

    let currentSettings = loadStoredSettings();
    if (!currentSettings.preset) currentSettings.preset = 'default';

    // Apply saved settings on load
    applySettings(currentSettings);
    syncSettingsUI();

    function openSettingsPanel() {
        settingsPanel.classList.add('open');
        settingsOverlay.classList.add('open');
        settingsBtn.setAttribute('aria-expanded', 'true');
    }

    function closeSettingsPanel() {
        settingsPanel.classList.remove('open');
        settingsOverlay.classList.remove('open');
        settingsBtn.setAttribute('aria-expanded', 'false');
    }

    settingsBtn.addEventListener('click', openSettingsPanel);
    settingsClose.addEventListener('click', closeSettingsPanel);
    settingsOverlay.addEventListener('click', closeSettingsPanel);

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && settingsPanel.classList.contains('open')) closeSettingsPanel();
    });

    // Preset buttons
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            currentSettings.preset = btn.dataset.preset;
            if (btn.dataset.preset !== 'custom') {
                const vars = THEMES[btn.dataset.preset];
                if (vars) {
                    currentSettings.customBg     = vars['--bg-primary'];
                    currentSettings.customText   = vars['--text-primary'];
                    currentSettings.customAccent = vars['--accent-color'];
                }
            }
            applySettings(currentSettings);
            syncSettingsUI();
            saveStoredSettings(currentSettings);
        });
    });

    // Color pickers — any change auto-switches to custom
    bgPicker.addEventListener('input', () => {
        currentSettings.preset    = 'custom';
        currentSettings.customBg  = bgPicker.value;
        applyVars(deriveCustomVars(currentSettings.customBg, currentSettings.customText || '#ffffff', currentSettings.customAccent || '#00ff9d'));
        syncSettingsUI();
        saveStoredSettings(currentSettings);
    });

    textPicker.addEventListener('input', () => {
        currentSettings.preset      = 'custom';
        currentSettings.customText  = textPicker.value;
        applyVars(deriveCustomVars(currentSettings.customBg || '#1a1a1a', currentSettings.customText, currentSettings.customAccent || '#00ff9d'));
        syncSettingsUI();
        saveStoredSettings(currentSettings);
    });

    accentPicker.addEventListener('input', () => {
        currentSettings.preset        = 'custom';
        currentSettings.customAccent  = accentPicker.value;
        document.documentElement.style.setProperty('--accent-color', accentPicker.value);
        syncSettingsUI();
        saveStoredSettings(currentSettings);
    });

    // Font family
    fontSelect.addEventListener('change', () => {
        currentSettings.fontFamily = fontSelect.value;
        document.documentElement.style.setProperty('--font-family', FONT_FAMILIES[fontSelect.value]);
        if (fontSelect.value === 'handwritten') loadKalam();
        saveStoredSettings(currentSettings);
    });

    // Font size buttons
    document.querySelectorAll('.size-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            currentSettings.fontSize = parseInt(btn.dataset.size);
            document.documentElement.style.setProperty('--font-size-base', btn.dataset.size + 'px');
            document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            saveStoredSettings(currentSettings);
        });
    });

    // Line spacing buttons
    document.querySelectorAll('.spacing-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            currentSettings.lineHeight = btn.dataset.spacing;
            document.documentElement.style.setProperty('--line-height-base', btn.dataset.spacing);
            document.querySelectorAll('.spacing-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            saveStoredSettings(currentSettings);
        });
    });

    function syncSettingsUI() {
        // Preset active state
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.preset === currentSettings.preset);
        });

        // Color pickers reflect current colors
        const vars = currentSettings.preset !== 'custom' && THEMES[currentSettings.preset]
            ? THEMES[currentSettings.preset] : null;
        bgPicker.value     = vars?.['--bg-primary']    || currentSettings.customBg    || '#1a1a1a';
        textPicker.value   = vars?.['--text-primary']   || currentSettings.customText  || '#ffffff';
        accentPicker.value = vars?.['--accent-color']   || currentSettings.customAccent || '#00ff9d';

        // Contrast warning (only in custom mode)
        if (currentSettings.preset === 'custom') {
            const bg   = currentSettings.customBg    || '#1a1a1a';
            const text = currentSettings.customText  || '#ffffff';
            try {
                contrastWarn.style.display = contrastRatio(bg, text) < 4.5 ? 'block' : 'none';
            } catch { contrastWarn.style.display = 'none'; }
        } else {
            contrastWarn.style.display = 'none';
        }

        // Font family
        fontSelect.value = currentSettings.fontFamily || 'system';

        // Font size
        document.querySelectorAll('.size-btn').forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.size) === (currentSettings.fontSize || 16));
        });

        // Line spacing
        document.querySelectorAll('.spacing-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.spacing === (String(currentSettings.lineHeight) || '1.5'));
        });
    }
}); 