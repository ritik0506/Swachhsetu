/**
 * Notification Service
 * Handles multi-channel notifications (Socket.io, SMS, Email, Push)
 */

class NotificationService {
  constructor() {
    this.socketIO = null;
    this.smsProvider = process.env.SMS_PROVIDER || 'console'; // 'twilio', 'console'
    this.emailProvider = process.env.EMAIL_PROVIDER || 'console'; // 'sendgrid', 'console'
  }

  /**
   * Initialize Socket.IO instance
   */
  initializeSocketIO(io) {
    this.socketIO = io;
    console.log('✅ NotificationService: Socket.IO initialized');
  }

  /**
   * Send notification via Socket.IO
   */
  async sendSocketNotification(userId, notification) {
    try {
      if (!this.socketIO) {
        console.warn('Socket.IO not initialized');
        return { success: false, error: 'Socket.IO not initialized' };
      }

      // Emit to specific user room
      this.socketIO.to(`user_${userId}`).emit('notification', notification);
      
      console.log(`📡 Socket notification sent to user ${userId}`);
      return { success: true, channel: 'socket' };
    } catch (error) {
      console.error('Socket notification error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send SMS notification
   */
  async sendSMS(phoneNumber, message) {
    try {
      if (this.smsProvider === 'twilio') {
        return await this.sendViaTwilio(phoneNumber, message);
      } else {
        // Console fallback for development
        console.log('📱 SMS (Console Mode):');
        console.log(`   To: ${phoneNumber}`);
        console.log(`   Message: ${message}`);
        return { success: true, channel: 'sms', mode: 'console' };
      }
    } catch (error) {
      console.error('SMS notification error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send Email notification
   */
  async sendEmail(to, subject, htmlContent, textContent) {
    try {
      if (this.emailProvider === 'sendgrid') {
        return await this.sendViaSendGrid(to, subject, htmlContent, textContent);
      } else {
        // Console fallback for development
        console.log('📧 Email (Console Mode):');
        console.log(`   To: ${to}`);
        console.log(`   Subject: ${subject}`);
        console.log(`   Content: ${textContent || htmlContent}`);
        return { success: true, channel: 'email', mode: 'console' };
      }
    } catch (error) {
      console.error('Email notification error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send via Twilio (SMS/WhatsApp)
   */
  async sendViaTwilio(phoneNumber, message) {
    try {
      // Check if Twilio is configured
      if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
        console.warn('Twilio not configured, using console mode');
        return this.sendSMS(phoneNumber, message); // Fall back to console
      }

      const twilio = require('twilio');
      const client = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );

      const result = await client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phoneNumber
      });

      console.log(`✅ SMS sent via Twilio: ${result.sid}`);
      return { 
        success: true, 
        channel: 'sms', 
        provider: 'twilio',
        messageId: result.sid 
      };
    } catch (error) {
      console.error('Twilio error:', error);
      throw error;
    }
  }

  /**
   * Send via SendGrid
   */
  async sendViaSendGrid(to, subject, htmlContent, textContent) {
    try {
      // Check if SendGrid is configured
      if (!process.env.SENDGRID_API_KEY) {
        console.warn('SendGrid not configured, using console mode');
        return this.sendEmail(to, subject, htmlContent, textContent); // Fall back to console
      }

      const sgMail = require('@sendgrid/mail');
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);

      const msg = {
        to,
        from: process.env.SENDGRID_FROM_EMAIL || 'noreply@swachhsetu.com',
        subject,
        text: textContent || htmlContent.replace(/<[^>]*>/g, ''),
        html: htmlContent
      };

      const result = await sgMail.send(msg);

      console.log(`✅ Email sent via SendGrid`);
      return { 
        success: true, 
        channel: 'email', 
        provider: 'sendgrid',
        statusCode: result[0].statusCode 
      };
    } catch (error) {
      console.error('SendGrid error:', error);
      throw error;
    }
  }

  /**
   * Send multi-channel notification
   */
  async sendMultiChannel(userId, channels, notification) {
    const results = [];

    for (const channel of channels) {
      try {
        let result;
        
        switch (channel.type) {
          case 'socket':
            result = await this.sendSocketNotification(userId, notification);
            break;
            
          case 'sms':
            if (channel.phoneNumber) {
              result = await this.sendSMS(channel.phoneNumber, notification.message);
            }
            break;
            
          case 'email':
            if (channel.email) {
              result = await this.sendEmail(
                channel.email,
                notification.subject || notification.title,
                notification.htmlContent || notification.message,
                notification.message
              );
            }
            break;
            
          default:
            console.warn(`Unknown channel type: ${channel.type}`);
        }

        if (result) {
          results.push({ channel: channel.type, ...result });
        }
      } catch (error) {
        console.error(`Failed to send via ${channel.type}:`, error);
        results.push({ 
          channel: channel.type, 
          success: false, 
          error: error.message 
        });
      }
    }

    return results;
  }

  /**
   * Notify inspector of new assignment
   */
  async notifyInspectorAssignment(inspector, ticket) {
    const notification = {
      type: 'assignment',
      title: 'New Ticket Assigned',
      message: `You have been assigned to: ${ticket.title}`,
      data: {
        ticketId: ticket._id,
        category: ticket.category,
        severity: ticket.severity,
        location: ticket.location?.address
      }
    };

    const channels = [
      { type: 'socket' }
    ];

    // Add SMS if phone number available
    if (inspector.phoneNumber) {
      channels.push({ 
        type: 'sms', 
        phoneNumber: inspector.phoneNumber 
      });
    }

    // Add email if available
    if (inspector.email) {
      channels.push({ 
        type: 'email', 
        email: inspector.email 
      });
    }

    return await this.sendMultiChannel(inspector._id, channels, notification);
  }

  /**
   * Send follow-up to citizen
   */
  async sendFollowUp(user, followUp) {
    const channels = [
      { type: 'socket' }
    ];

    // Add preferred channel if specified
    if (followUp.channel === 'sms' && user.phoneNumber) {
      channels.push({ 
        type: 'sms', 
        phoneNumber: user.phoneNumber 
      });
    } else if (followUp.channel === 'email' && user.email) {
      channels.push({ 
        type: 'email', 
        email: user.email 
      });
    }

    const notification = {
      type: 'followup',
      title: 'Report Follow-up',
      message: followUp.messageText,
      data: {
        reportId: followUp.reportId,
        followUpId: followUp._id
      }
    };

    const results = await this.sendMultiChannel(user._id, channels, notification);

    // Update follow-up status
    if (results.some(r => r.success)) {
      followUp.status = 'sent';
      followUp.sentAt = new Date();
      await followUp.save();
    } else {
      followUp.deliveryAttempts += 1;
      followUp.lastAttemptAt = new Date();
      await followUp.save();
    }

    return results;
  }
}

module.exports = new NotificationService();
