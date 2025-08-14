const { Client } = require('@microsoft/microsoft-graph-client');
const { ConfidentialClientApplication } = require('@azure/msal-node');

const logger = require('../logger');

class MicrosoftGraphService {
  constructor() {
    this.clientId = process.env.MICROSOFT_GRAPH_CLIENT_ID;
    this.clientSecret = process.env.MICROSOFT_GRAPH_CLIENT_SECRET;
    this.tenantId = process.env.MICROSOFT_GRAPH_TENANT_ID;
    this.senderEmail = process.env.MICROSOFT_GRAPH_EMAIL;
    this.scopes = [process.env.MICROSOFT_GRAPH_SCOPES || 'https://graph.microsoft.com/.default'];

    if (!this.clientId || !this.clientSecret || !this.tenantId || !this.senderEmail) {
      logger.error('Microsoft Graph configuration incomplete. Required: CLIENT_ID, CLIENT_SECRET, TENANT_ID, EMAIL');
      throw new Error('Microsoft Graph configuration incomplete');
    }

    // Initialize MSAL
    this.clientConfig = {
      auth: {
        clientId: this.clientId,
        clientSecret: this.clientSecret,
        authority: `https://login.microsoftonline.com/${this.tenantId}`
      }
    };

    this.clientApp = new ConfidentialClientApplication(this.clientConfig);
    this.graphClient = null;
  }

  /**
   * Get access token using client credentials flow
   */
  async getAccessToken() {
    try {
      const clientCredentialRequest = {
        scopes: this.scopes,
      };

      const response = await this.clientApp.acquireTokenByClientCredential(clientCredentialRequest);
      
      if (!response || !response.accessToken) {
        throw new Error('Failed to acquire access token');
      }

      logger.info('Microsoft Graph access token acquired successfully');
      return response.accessToken;
    } catch (error) {
      logger.error('Error acquiring access token:', error);
      throw error;
    }
  }

  /**
   * Initialize Graph client with access token
   */
  async initializeGraphClient() {
    try {
      const accessToken = await this.getAccessToken();
      
      this.graphClient = Client.init({
        authProvider: (done) => {
          done(null, accessToken);
        }
      });

      logger.info('Microsoft Graph client initialized successfully');
      return this.graphClient;
    } catch (error) {
      logger.error('Error initializing Graph client:', error);
      throw error;
    }
  }

  /**
   * Send email using Microsoft Graph
   * @param {Object} options - Email options
   * @param {string} options.to - Recipient email
   * @param {string} options.subject - Email subject
   * @param {string} options.html - Email HTML content
   * @param {string} options.text - Plain text alternative (optional)
   * @param {Array} options.cc - CC recipients (optional)
   * @param {Array} options.bcc - BCC recipients (optional)
   * @returns {Promise} - Resolves when email sent, rejects on error
   */
  async sendEmail(options) {
    try {
      if (!this.graphClient) {
        await this.initializeGraphClient();
      }

      // Prepare recipients
      const toRecipients = options.to.split(',').map(email => ({
        emailAddress: {
          address: email.trim()
        }
      }));

      const ccRecipients = options.cc ? options.cc.split(',').map(email => ({
        emailAddress: {
          address: email.trim()
        }
      })) : [];

      const bccRecipients = options.bcc ? options.bcc.split(',').map(email => ({
        emailAddress: {
          address: email.trim()
        }
      })) : [];

      // Prepare message
      const message = {
        subject: options.subject,
        body: {
          contentType: 'HTML',
          content: options.html || options.text || ''
        },
        toRecipients: toRecipients,
        ccRecipients: ccRecipients,
        bccRecipients: bccRecipients,
        from: {
          emailAddress: {
            address: this.senderEmail
          }
        }
      };

      // Send email
      const result = await this.graphClient
        .api(`/users/${this.senderEmail}/sendMail`)
        .post({
          message: message,
          saveToSentItems: true
        });

      logger.info(`Email sent successfully via Microsoft Graph to: ${options.to}`);
      return {
        success: true,
        messageId: result?.id || 'sent',
        info: result
      };

    } catch (error) {
      logger.error('Microsoft Graph email sending failed:', error);
      
      // Handle specific Graph API errors
      if (error.code === 'Forbidden') {
        logger.error('Microsoft Graph permissions error: Check Mail.Send permissions');
      } else if (error.code === 'Unauthorized') {
        logger.error('Microsoft Graph authentication error: Check credentials');
      }
      
      throw error;
    }
  }

  /**
   * Test the Microsoft Graph connection
   */
  async testConnection() {
    try {
      if (!this.graphClient) {
        await this.initializeGraphClient();
      }

      // Test by getting user profile
      const user = await this.graphClient
        .api(`/users/${this.senderEmail}`)
        .select('id,mail,displayName')
        .get();

      logger.info('Microsoft Graph connection test successful:', {
        id: user.id,
        email: user.mail,
        displayName: user.displayName
      });

      return {
        success: true,
        user: user
      };

    } catch (error) {
      logger.error('Microsoft Graph connection test failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send a test email
   */
  async sendTestEmail(toEmail, testMessage = 'Test email from Microsoft Graph API') {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2563eb;">Microsoft Graph Email Test</h2>
        <p>This is a test email sent using Microsoft Graph API.</p>
        <p><strong>Message:</strong> ${testMessage}</p>
        <div style="background-color: #f0f9ff; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0;"><strong>✅ Microsoft Graph Integration Working!</strong></p>
        </div>
        <p style="color: #6b7280; font-size: 14px;">
          Sent on: ${new Date().toLocaleString()}
        </p>
      </div>
    `;

    return this.sendEmail({
      to: toEmail,
      subject: 'Microsoft Graph Email Test - ' + new Date().toLocaleString(),
      html: htmlContent,
      text: `Microsoft Graph Email Test\n\n${testMessage}\n\nSent on: ${new Date().toLocaleString()}`
    });
  }
}

module.exports = MicrosoftGraphService;