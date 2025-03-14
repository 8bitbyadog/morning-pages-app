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
      // Create the URL with parameters
      const params = new URLSearchParams({
        [this.entryIdField]: email
      });
      
      const submissionUrl = `${this.formActionUrl}?${params.toString()}`;
      
      console.log('Attempting form submission with URL:', submissionUrl);

      // First, try to validate the form URL
      try {
        new URL(submissionUrl);
      } catch (urlError) {
        console.error('Invalid form URL:', submissionUrl);
        return false;
      }
      
      const response = await fetch(submissionUrl, {
        method: 'GET',
        mode: 'no-cors',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      console.log('Form submission response:', {
        status: response.status,
        type: response.type,
        ok: response.ok
      });
      
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
      // Create the URL with parameters
      const params = new URLSearchParams({
        [this.entryIdField]: testEmail
      });
      
      const submissionUrl = `${this.formActionUrl}?${params.toString()}`;
      
      console.log('Test submission URL:', submissionUrl);
      
      const response = await fetch(submissionUrl, {
        method: 'GET',
        mode: 'no-cors',
        headers: {
          'Accept': 'application/json'
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
