/**
 * Google Form Integration for Morning Pages App
 * This module provides a simple way to submit user emails to a Google Form
 * when they register or log in to the app.
 */

class GoogleFormSubmitter {
  constructor(formActionUrl) {
    this.formActionUrl = formActionUrl;
    this.entryIdField = 'entry.123456789';
    this.enabled = false;
    console.log('GoogleFormSubmitter instance created');
  }

  /**
   * Initialize with form settings
   * @param {String} formActionUrl - The action URL of your Google Form
   * @param {String} entryIdField - The entry ID for the email field in your form
   */
  init(formActionUrl, entryIdField) {
    console.log('Initializing GoogleFormSubmitter with:', {
      formActionUrl,
      entryIdField
    });

    if (formActionUrl) this.formActionUrl = formActionUrl;
    if (entryIdField) this.entryIdField = entryIdField;
    
    this.enabled = !!(this.formActionUrl && this.entryIdField);
    
    console.log('GoogleFormSubmitter initialization complete:', {
      enabled: this.enabled,
      formUrl: this.formActionUrl,
      entryId: this.entryIdField
    });
    
    return this.enabled;
  }

  /**
   * Submit an email address to the Google Form
   * @param {String} email - The email address to submit
   * @returns {Promise} - Resolves when submission is complete
   */
  async submitEmail(email) {
    console.log('submitEmail called with:', email);

    if (!this.enabled || !email) {
      console.warn('Form submission skipped:', {
        enabled: this.enabled,
        emailProvided: !!email
      });
      return false;
    }

    try {
      console.log('Creating form data for submission...');
      const formData = new FormData();
      formData.append(this.entryIdField, email);
      
      console.log('Attempting form submission with:', {
        url: this.formActionUrl,
        entryId: this.entryIdField,
        email: email
      });

      // First, try to validate the form URL
      try {
        new URL(this.formActionUrl);
      } catch (urlError) {
        console.error('Invalid form URL:', this.formActionUrl);
        return false;
      }
      
      const response = await fetch(this.formActionUrl, {
        method: 'POST',
        mode: 'no-cors',
        body: formData,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        }
      });
      
      console.log('Form submission response:', {
        status: response.status,
        type: response.type,
        ok: response.ok
      });
      
      // In no-cors mode, we can't actually check the response status
      // So we'll assume success if we got here without an error
      return true;
    } catch (error) {
      console.error('Form submission failed:', {
        error: error.message,
        stack: error.stack
      });
      return false;
    }
  }

  /**
   * Test the Google Form submission
   * @param {String} testEmail - The test email to submit
   */
  async testSubmission(testEmail = 'test@example.com') {
    console.log('Starting test submission...');
    
    if (!this.enabled) {
      console.error('Test failed: Integration not enabled');
      return false;
    }

    try {
      console.log('Creating test form data...');
      const formData = new FormData();
      formData.append(this.entryIdField, testEmail);
      
      console.log('Test submission data:', {
        url: this.formActionUrl,
        entryId: this.entryIdField,
        email: testEmail
      });
      
      const response = await fetch(this.formActionUrl, {
        method: 'POST',
        mode: 'no-cors',
        body: formData,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        }
      });
      
      console.log('Test submission response:', {
        status: response.status,
        type: response.type,
        ok: response.ok
      });
      
      return true;
    } catch (error) {
      console.error('Test submission failed:', {
        error: error.message,
        stack: error.stack
      });
      return false;
    }
  }
}

// Create and export a single instance
const googleFormSubmitter = new GoogleFormSubmitter();
console.log('GoogleFormSubmitter instance exported');
export default googleFormSubmitter;
