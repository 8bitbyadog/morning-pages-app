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
    console.log('%c[Google Form] Instance created', 'color: #4CAF50; font-weight: bold;');
  }

  /**
   * Initialize with form settings
   * @param {String} formActionUrl - The action URL of your Google Form
   * @param {String} entryIdField - The entry ID for the email field in your form
   */
  init(formActionUrl, entryIdField) {
    console.log('%c[Google Form] Initializing with:', 'color: #4CAF50; font-weight: bold;', {
      formActionUrl,
      entryIdField
    });

    if (formActionUrl) this.formActionUrl = formActionUrl;
    if (entryIdField) this.entryIdField = entryIdField;
    
    this.enabled = !!(this.formActionUrl && this.entryIdField);
    
    console.log('%c[Google Form] Initialization complete:', 'color: #4CAF50;', {
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
    console.log('%c[Google Form] Submitting email:', 'color: #4CAF50; font-weight: bold;', email);

    if (!this.enabled || !email) {
      console.warn('%c[Google Form] Submission skipped:', 'color: #FFA000;', {
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
      
      console.log('%c[Google Form] Submitting to URL:', 'color: #4CAF50;', submissionUrl);

      // First, try to validate the form URL
      try {
        new URL(submissionUrl);
      } catch (urlError) {
        console.error('%c[Google Form] Invalid URL:', 'color: #FF5252;', submissionUrl);
        return false;
      }
      
      const response = await fetch(submissionUrl, {
        method: 'GET',
        mode: 'no-cors',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      console.log('%c[Google Form] Submission response:', 'color: #4CAF50;', {
        status: response.status,
        type: response.type,
        ok: response.ok
      });
      
      return true;
    } catch (error) {
      console.error('%c[Google Form] Submission failed:', 'color: #FF5252;', {
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
    console.log('%c[Google Form] Starting test submission...', 'color: #4CAF50; font-weight: bold;');
    
    if (!this.enabled) {
      console.error('%c[Google Form] Test failed: Integration not enabled', 'color: #FF5252;');
      return false;
    }

    try {
      // Create the URL with parameters
      const params = new URLSearchParams({
        [this.entryIdField]: testEmail
      });
      
      const submissionUrl = `${this.formActionUrl}?${params.toString()}`;
      
      console.log('%c[Google Form] Test submission URL:', 'color: #4CAF50;', submissionUrl);
      
      const response = await fetch(submissionUrl, {
        method: 'GET',
        mode: 'no-cors',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      console.log('%c[Google Form] Test submission response:', 'color: #4CAF50;', {
        status: response.status,
        type: response.type,
        ok: response.ok
      });
      
      return true;
    } catch (error) {
      console.error('%c[Google Form] Test submission failed:', 'color: #FF5252;', {
        error: error.message,
        stack: error.stack
      });
      return false;
    }
  }
}

// Create and export a single instance
const googleFormSubmitter = new GoogleFormSubmitter();
console.log('%c[Google Form] Instance exported', 'color: #4CAF50; font-weight: bold;');
export default googleFormSubmitter;
