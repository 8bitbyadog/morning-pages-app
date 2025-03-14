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
    
    console.log('Google Form integration ' + (this.enabled ? 'enabled' : 'disabled'));
    console.log('Form URL:', this.formActionUrl);
    console.log('Entry ID field:', this.entryIdField);
    return this.enabled;
  }

  /**
   * Submit an email address to the Google Form
   * @param {String} email - The email address to submit
   * @returns {Promise} - Resolves when submission is complete
   */
  async submitEmail(email) {
    if (!this.enabled || !email) {
      console.log('Form submission skipped: integration disabled or no email provided');
      return false;
    }

    console.log('Preparing to submit email to Google Form:', email);
    console.log('Form URL:', this.formActionUrl);
    console.log('Entry ID field:', this.entryIdField);

    try {
      // Create form data for the request
      const formData = new FormData();
      formData.append(this.entryIdField, email);
      
      console.log('FormData created:', this.entryIdField, '=', email);
      
      // Submit the data using fetch API
      console.log('Submitting form data to:', this.formActionUrl);
      const response = await fetch(this.formActionUrl, {
        method: 'POST',
        mode: 'no-cors', // This is important for cross-origin requests to Google Forms
        body: formData
      });
      
      console.log('Form submission response received, no-cors mode so details limited');
      console.log('Email submitted to Google Form:', email);
      return true;
    } catch (error) {
      // Log error but don't interrupt the app flow
      console.error('Failed to submit email to Google Form:', error);
      return false;
    }
  }
}

// Create and export a single instance
const googleFormSubmitter = new GoogleFormSubmitter();
export default googleFormSubmitter;
