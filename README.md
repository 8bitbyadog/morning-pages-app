# Morning Pages App

A web application for writing morning pages with analysis and tracking features.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:3000`

## Features

- Write morning pages with real-time word counting
- Track writing streaks and progress
- Analyze writing patterns and emotions
- Visualize topics and keywords
- Secure local storage for your writing

## Development

- Built with vanilla JavaScript and ES modules
- Uses Vite for development and building
- Chart.js for data visualization
- D3.js for advanced visualizations

## Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Privacy

This app stores all your writing data locally in your browser. No data is sent to any server or stored in the cloud. Your privacy is important to us.

## How to Use

1. Visit the app at [8bitbyadog.github.io/morning-pages-app](https://8bitbyadog.github.io/morning-pages-app)
2. Start typing in the text editor
3. Aim to write 750 words (about 3 pages)
4. Your progress is automatically saved in your browser
5. When you reach 750 words, you'll see a celebration and writing analysis

## License

MIT License - feel free to use this project for your own purposes. 

## Admin Panel

This app includes a simple admin panel for managing user emails.

### 1. Simple Admin Page with Password Protection

This is the quickest solution with your current setup:

```javascript
document.addEventListener('DOMContentLoaded', () => {
  const adminPasswordHash = "5f4dcc3b5aa765d61d8327deb882cf99"; // "password" hashed - change this!
  
  const adminLogin = document.getElementById('admin-login');
  const emailList = document.getElementById('email-list');
  
  document.getElementById('admin-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const password = document.getElementById('admin-password').value;
    const hash = md5(password); // Using a simple MD5 implementation
    
    if (hash === adminPasswordHash) {
      adminLogin.style.display = 'none';
      emailList.style.display = 'block';
      loadEmails();
    } else {
      alert('Invalid password');
    }
  });
  
  function loadEmails() {
    const emails = [];
    // Loop through localStorage to find all users
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith('user_')) {
        const email = key.replace('user_', '');
        emails.push(email);
      }
    }
    
    const emailListEl = document.getElementById('emails');
    emailListEl.innerHTML = '';
    
    if (emails.length === 0) {
      emailListEl.innerHTML = '<li>No users found</li>';
      return;
    }
    
    emails.forEach(email => {
      const li = document.createElement('li');
      li.textContent = email;
      emailListEl.appendChild(li);
    });
    
    document.getElementById('export-button').addEventListener('click', () => {
      const csvContent = "data:text/csv;charset=utf-8," + emails.join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "morning_pages_users.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  }
  
  // Simple MD5 implementation for password hashing
  function md5(input) {
    // This would be replaced with an actual MD5 implementation
    // For production, use a better hashing algorithm
    return CryptoJS.MD5(input).toString();
  }
});
```

Then create an admin.html file that's not linked from anywhere in your main app:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Admin - Morning Pages</title>
  <link rel="stylesheet" href="styles/main.css">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js"></script>
  <script src="admin.js"></script>
  <style>
    .admin-container {
      max-width: 600px;
      margin: 50px auto;
      padding: 20px;
      background-color: var(--bg-secondary);
      border-radius: 8px;
    }
    #emails {
      list-style-type: none;
      padding: 0;
    }
    #emails li {
      padding: 8px;
      margin-bottom: 4px;
      background-color: var(--bg-tertiary);
      border-radius: 4px;
    }
    .button {
      background-color: var(--accent-color);
      color: var(--bg-primary);
      border: none;
      padding: 10px 15px;
      border-radius: 4px;
      cursor: pointer;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="admin-container">
    <h1>Morning Pages Admin</h1>
    
    <div id="admin-login">
      <p>Enter the admin password to access user emails:</p>
      <form id="admin-form">
        <input type="password" id="admin-password" placeholder="Admin password" required>
        <button type="submit" class="button">Login</button>
      </form>
    </div>
    
    <div id="email-list" style="display: none;">
      <h2>Registered Emails</h2>
      <ul id="emails"></ul>
      <button id="export-button" class="button">Export as CSV</button>
    </div>
  </div>
</body>
</html>
```

### 2. Firebase (Free Tier)

If you're willing to add Firebase to your project:

1. Sign up for a free Firebase account
2. Create a new project
3. Add Firebase to your web app
4. Replace your current storage code with Firebase Authentication and Firestore
5. Create simple admin access rules based on a specific admin user

### 3. Google Sheets Integration

If you prefer a spreadsheet approach:

1. Create a Google Form that sends data to a Google Sheet
2. Modify your app to submit user emails to this form when they register
3. You can access the Google Sheet anytime to see registered users

### Implementation Recommendation

The first option is the simplest to implement with your current setup. It's not highly secure but provides basic protection with a password. To improve security:

1. Use a stronger hashing algorithm
2. Store the admin page on a different URL not easily guessable
3. Set a strong password
4. Don't share the admin URL with anyone

Would you like me to help you implement the simple admin page solution? I can create the necessary files and provide instructions on how to upload them to your GitHub Pages site. 