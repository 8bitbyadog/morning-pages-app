// text-analysis-worker.js
self.onmessage = function(e) {
  const { text, emotionKeywords, topicKeywords } = e.data;
  
  // Analyze emotions
  const emotions = analyzeEmotions(text, emotionKeywords);
  
  // Analyze topics
  const topics = analyzeTopics(text, topicKeywords);
  
  // Send results back to main thread
  self.postMessage({ emotions, topics });
};

function analyzeEmotions(text, emotionKeywords) {
  // Words preprocessing - more efficient with regular expressions
  const words = text.toLowerCase().match(/\b\w+\b/g) || [];
  
  // Initialize emotion counts
  const emotions = {};
  Object.keys(emotionKeywords).forEach(emotion => {
    emotions[emotion] = 0;
  });
  
  // Use a Set for faster lookups
  const emotionSets = {};
  Object.keys(emotionKeywords).forEach(emotion => {
    emotionSets[emotion] = new Set(emotionKeywords[emotion]);
  });
  
  // Count emotion keywords
  for (const word of words) {
    for (const emotion in emotionSets) {
      if (emotionSets[emotion].has(word)) {
        emotions[emotion]++;
      }
    }
  }
  
  // Convert counts to percentages
  const total = Object.values(emotions).reduce((sum, count) => sum + count, 0) || 1;
  
  // Format the result in one pass
  const result = {};
  Object.keys(emotions).forEach(emotion => {
    result[emotion] = {
      count: emotions[emotion],
      percentage: Math.round((emotions[emotion] / total) * 100)
    };
  });
  
  return result;
}

function analyzeTopics(text, topicKeywords) {
  // Words preprocessing
  const words = text.toLowerCase().match(/\b\w+\b/g) || [];
  
  // Initialize topic counts
  const topics = {};
  Object.keys(topicKeywords).forEach(topic => {
    topics[topic] = 0;
  });
  
  // Use a Set for faster lookups
  const topicSets = {};
  Object.keys(topicKeywords).forEach(topic => {
    topicSets[topic] = new Set(topicKeywords[topic]);
  });
  
  // Count topic keywords
  for (const word of words) {
    for (const topic in topicSets) {
      if (topicSets[topic].has(word)) {
        topics[topic]++;
      }
    }
  }
  
  // Convert counts to percentages
  const total = Object.values(topics).reduce((sum, count) => sum + count, 0) || 1;
  
  // Format the result in one pass
  const result = {};
  Object.keys(topics).forEach(topic => {
    result[topic] = {
      count: topics[topic],
      percentage: Math.round((topics[topic] / total) * 100)
    };
  });
  
  return result;
} 