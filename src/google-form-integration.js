/**
 * Google Form Integration for Morning Pages App
 * This module provides a simple way to submit user emails to a Google Form
 * when they register or log in to the app.
 */

class GoogleFormSubmitter {
  constructor(formActionUrl) {
    this.formActionUrl = formActionUrl;
    this.entryIdField = 'entry.123456789'; // You'll need to replace this with your actual entry ID
    this.enabled = false;
  }

  /**
   * Initialize with form settings
   * @param {String} formActionUrl - The action URL of your Google Form
   * @param {String} entryIdField - The entry ID for the email field in your form
   */
  init(formActionUrl, entryIdField) {
    if (formActionUrl) this.formActionUrl = formActionUrl;
    if (entryIdField) this.entryIdField = entryIdField;
    this.enabled = !!(this.formActionUrl && this.entryIdField);
    
    console.log('%c[Google Form] Integration initialized:', 'color: #4CAF50; font-weight: bold', {
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
    if (!this.enabled || !email) {
      console.log('%c[Google Form] Submission skipped:', 'color: #FFA500; font-weight: bold', {
        enabled: this.enabled,
        emailProvided: !!email
      });
      return false;
    }

    try {
      // Create form data for the request
      const formData = new FormData();
      formData.append(this.entryIdField, email);
      
      console.log('%c[Google Form] Attempting submission:', 'color: #2196F3; font-weight: bold', {
        url: this.formActionUrl,
        entryId: this.entryIdField,
        email: email
      });
      
      // Submit the data using fetch API
      const response = await fetch(this.formActionUrl, {
        method: 'POST',
        mode: 'no-cors', // This is important for cross-origin requests to Google Forms
        body: formData
      });
      
      console.log('%c[Google Form] Submission response:', 'color: #4CAF50; font-weight: bold', {
        status: response.status,
        type: response.type,
        ok: response.ok
      });
      
      return true;
    } catch (error) {
      // Log error but don't interrupt the app flow
      console.error('%c[Google Form] Submission failed:', 'color: #f44336; font-weight: bold', {
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
    console.log('%c[Google Form] Starting test submission...', 'color: #2196F3; font-weight: bold');
    
    if (!this.enabled) {
      console.log('%c[Google Form] Test failed: Integration not enabled', 'color: #f44336; font-weight: bold');
      return false;
    }

    try {
      const formData = new FormData();
      formData.append(this.entryIdField, testEmail);
      
      console.log('%c[Google Form] Test submission data:', 'color: #2196F3; font-weight: bold', {
        url: this.formActionUrl,
        entryId: this.entryIdField,
        email: testEmail
      });
      
      const response = await fetch(this.formActionUrl, {
        method: 'POST',
        mode: 'no-cors',
        body: formData
      });
      
      console.log('%c[Google Form] Test submission response:', 'color: #4CAF50; font-weight: bold', {
        status: response.status,
        type: response.type,
        ok: response.ok
      });
      
      return true;
    } catch (error) {
      console.error('%c[Google Form] Test submission failed:', 'color: #f44336; font-weight: bold', {
        error: error.message,
        stack: error.stack
      });
      return false;
    }
  }
}

// Create and export a single instance
const googleFormSubmitter = new GoogleFormSubmitter();
export default googleFormSubmitter;
