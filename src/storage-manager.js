// Enhanced Data Persistence with IndexedDB
class StorageManager {
  constructor() {
    this.dbName = 'morning-pages-db';
    this.dbVersion = 1;
    this.db = null;
    this.storeName = 'writings';
    this.initialized = false;
    this.initPromise = this.initDatabase();
  }

  async initDatabase() {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        console.log("Your browser doesn't support IndexedDB. Falling back to localStorage.");
        this.initialized = false;
        reject(new Error("IndexedDB not supported"));
        return;
      }

      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = (event) => {
        console.error("Database error:", event.target.error);
        this.initialized = false;
        reject(event.target.error);
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        this.initialized = true;
        console.log("Database initialized successfully");
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        console.log("Database upgrade needed");
        
        // Create object store for writings
        if (!db.objectStoreNames.contains('writings')) {
          console.log("Creating writings store");
          const writingsStore = db.createObjectStore('writings', { keyPath: 'id', autoIncrement: true });
          writingsStore.createIndex('date', 'date', { unique: false });
          writingsStore.createIndex('userId', 'userId', { unique: false });
        }
        
        // Create users store
        if (!db.objectStoreNames.contains('users')) {
          console.log("Creating users store");
          const usersStore = db.createObjectStore('users', { keyPath: 'email' });
          usersStore.createIndex('createdAt', 'createdAt', { unique: false });
          usersStore.createIndex('lastLogin', 'lastLogin', { unique: false });
        }
        
        console.log("Database setup complete");
      };
    });
  }

  async ensureInitialized() {
    if (!this.initialized) {
      console.log("Database not initialized, waiting for initialization...");
      await this.initPromise;
      console.log("Database initialization complete");
    }
  }

  // Save the current writing session
  async saveWriting(text, metadata = {}) {
    try {
      await this.ensureInitialized();
      
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
      
      const writingData = {
        text: text,
        date: dateStr,
        dateTime: now.toISOString(),
        wordCount: this.countWords(text),
        complete: metadata.complete || false,
        emotions: metadata.emotions || null,
        topics: metadata.topics || null,
        ...metadata
      };
      
      // Get existing session for today or create new one
      const existingSession = await this.getTodayWriting();
      
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([this.storeName], 'readwrite');
        const objectStore = transaction.objectStore(this.storeName);
        let request;
        
        if (existingSession) {
          // Update existing session
          writingData.id = existingSession.id;
          request = objectStore.put(writingData);
        } else {
          // Create new session
          request = objectStore.add(writingData);
        }
        
        request.onsuccess = () => {
          console.log("Writing saved successfully");
          // Also save to localStorage as backup
          this.saveToLocalStorage(text);
          resolve();
        };
        
        request.onerror = (event) => {
          console.error("Error saving writing:", event.target.error);
          // Try localStorage as fallback
          this.saveToLocalStorage(text);
          reject(event.target.error);
        };
      });
      
    } catch (error) {
      console.error("Failed to save writing:", error);
      // Fallback to localStorage
      this.saveToLocalStorage(text);
      throw error;
    }
  }

  // Save to localStorage as a backup method
  saveToLocalStorage(text) {
    try {
      localStorage.setItem('savedText', text);
      localStorage.setItem('lastSaved', new Date().toISOString());
    } catch (e) {
      console.error("LocalStorage save failed:", e);
      // If localStorage fails (e.g., quota exceeded), try saving a truncated version
      if (e.name === 'QuotaExceededError') {
        const truncated = text.substring(0, 1000000); // ~1MB max
        try {
          localStorage.setItem('savedText', truncated);
          localStorage.setItem('lastSaved', new Date().toISOString());
          localStorage.setItem('truncated', 'true');
        } catch (innerError) {
          console.error("Even truncated save failed");
        }
      }
    }
  }

  // Get today's writing session
  async getTodayWriting() {
    try {
      await this.ensureInitialized();
      
      const today = new Date().toISOString().split('T')[0];
      
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([this.storeName], 'readonly');
        const objectStore = transaction.objectStore(this.storeName);
        const dateIndex = objectStore.index('date');
        const request = dateIndex.get(today);
        
        request.onsuccess = () => {
          console.log("Today's writing retrieved successfully");
          resolve(request.result);
        };
        
        request.onerror = (event) => {
          console.error("Error getting today's writing:", event.target.error);
          // Try localStorage as fallback
          const savedText = localStorage.getItem('savedText');
          if (savedText) {
            resolve({
              text: savedText,
              date: today,
              dateTime: localStorage.getItem('lastSaved')
            });
          } else {
            resolve(null);
          }
        };
      });
    } catch (error) {
      console.error("Failed to get today's writing:", error);
      // Fallback to localStorage
      const savedText = localStorage.getItem('savedText');
      if (savedText) {
        return {
          text: savedText,
          date: new Date().toISOString().split('T')[0],
          dateTime: localStorage.getItem('lastSaved')
        };
      }
      return null;
    }
  }

  // Get all writings
  async getAllWritings() {
    try {
      await this.ensureInitialized();
      
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([this.storeName], 'readonly');
        const objectStore = transaction.objectStore(this.storeName);
        const request = objectStore.getAll();
        
        request.onsuccess = () => {
          resolve(request.result);
        };
        
        request.onerror = (event) => {
          console.error("Error getting all writings:", event.target.error);
          reject(event.target.error);
        };
      });
    } catch (error) {
      console.error("Failed to get all writings:", error);
      return [];
    }
  }

  // Get writings by date range
  async getWritingsByDateRange(startDate, endDate) {
    try {
      await this.ensureInitialized();
      
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([this.storeName], 'readonly');
        const objectStore = transaction.objectStore(this.storeName);
        const dateIndex = objectStore.index('date');
        const request = dateIndex.getAll(IDBKeyRange.bound(startDate, endDate));
        
        request.onsuccess = () => {
          resolve(request.result);
        };
        
        request.onerror = (event) => {
          console.error("Error getting writings by date range:", event.target.error);
          reject(event.target.error);
        };
      });
    } catch (error) {
      console.error("Failed to get writings by date range:", error);
      return [];
    }
  }

  // Count words in text
  countWords(text) {
    const matches = text.trim().match(/\S+/g);
    return matches ? matches.length : 0;
  }

  // Delete a writing session
  async deleteWriting(id) {
    try {
      await this.ensureInitialized();
      
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([this.storeName], 'readwrite');
        const objectStore = transaction.objectStore(this.storeName);
        const request = objectStore.delete(id);
        
        request.onsuccess = () => {
          resolve();
        };
        
        request.onerror = (event) => {
          console.error("Error deleting writing:", event.target.error);
          reject(event.target.error);
        };
      });
    } catch (error) {
      console.error("Failed to delete writing:", error);
      throw error;
    }
  }

  // User management methods
  async createUser(email, password) {
    try {
      await this.ensureInitialized();
      const hashedPassword = await this.hashPassword(password);
      
      const userData = {
        email,
        password: hashedPassword,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      };
      
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(['users'], 'readwrite');
        const objectStore = transaction.objectStore('users');
        const request = objectStore.add(userData);
        
        request.onsuccess = () => {
          console.log('User created successfully');
          resolve();
        };
        
        request.onerror = (event) => {
          console.error('Error creating user:', event.target.error);
          reject(event.target.error);
        };
      });
    } catch (error) {
      console.error('Failed to create user:', error);
      throw error;
    }
  }

  async getUser(email) {
    try {
      await this.ensureInitialized();
      
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(['users'], 'readonly');
        const objectStore = transaction.objectStore('users');
        const request = objectStore.get(email);
        
        request.onsuccess = () => {
          resolve(request.result);
        };
        
        request.onerror = (event) => {
          console.error('Error getting user:', event.target.error);
          reject(event.target.error);
        };
      });
    } catch (error) {
      console.error('Failed to get user:', error);
      throw error;
    }
  }

  async getAllUsers() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['users'], 'readonly');
      const store = transaction.objectStore('users');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async updateUserLastLogin(email) {
    try {
      await this.ensureInitialized();
      
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(['users'], 'readwrite');
        const objectStore = transaction.objectStore('users');
        const request = objectStore.get(email);
        
        request.onsuccess = () => {
          const user = request.result;
          if (user) {
            user.lastLogin = new Date().toISOString();
            const updateRequest = objectStore.put(user);
            
            updateRequest.onsuccess = () => {
              console.log('Last login updated successfully');
              resolve();
            };
            
            updateRequest.onerror = (event) => {
              console.error('Error updating last login:', event.target.error);
              reject(event.target.error);
            };
          } else {
            reject(new Error('User not found'));
          }
        };
        
        request.onerror = (event) => {
          console.error('Error getting user for last login update:', event.target.error);
          reject(event.target.error);
        };
      });
    } catch (error) {
      console.error('Failed to update last login:', error);
      throw error;
    }
  }

  // Hash password using SHA-256
  async hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
}

// Export the StorageManager class
export default StorageManager; 