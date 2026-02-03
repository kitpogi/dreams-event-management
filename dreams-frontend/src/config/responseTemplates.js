// Response templates for contact inquiry replies
// Templates use placeholders: {{name}}, {{event_type}}, {{event_date}}, {{venue}}, {{guests}}, {{budget}}

export const RESPONSE_TEMPLATES = [
  // Generic Templates
  {
    id: 'generic_acknowledgment',
    name: 'Generic Acknowledgment',
    category: 'generic',
    description: 'Standard thank you message',
    template: `Hello {{name}},

Thank you for your inquiry about your {{event_type}} event. We're excited to help make your event a success!

Our team will review your inquiry and contact you within 24-48 hours to discuss your requirements and provide a customized proposal.

If you have any immediate questions, please feel free to reply to this email.

Best regards,
Dreams Events Team`
  },

  // Event Type Specific Templates
  {
    id: 'wedding_acknowledgment',
    name: 'Wedding Inquiry',
    category: 'event_type',
    eventType: 'wedding',
    description: 'Personalized response for wedding inquiries',
    template: `Hello {{name}},

Thank you for considering Dreams Events for your special wedding day! We're thrilled to help you create an unforgettable celebration.

Based on your inquiry:
- Event Date: {{event_date}}
- Preferred Venue: {{venue}}
- Estimated Guests: {{guests}}
{{#if budget}}- Budget: {{budget}}{{/if}}

Our experienced wedding planning team will review your requirements and contact you within 24-48 hours to discuss your vision, answer any questions, and provide a customized proposal tailored to your needs.

We understand how important this day is to you, and we're committed to making it absolutely perfect!

Best regards,
Dreams Events Team`
  },

  {
    id: 'birthday_acknowledgment',
    name: 'Birthday Celebration',
    category: 'event_type',
    eventType: 'birthday',
    description: 'Response for birthday party inquiries',
    template: `Hello {{name}},

Thank you for your inquiry about your birthday celebration! We're excited to help make it a memorable occasion.

Based on your details:
- Event Date: {{event_date}}
- Preferred Venue: {{venue}}
- Estimated Guests: {{guests}}
{{#if budget}}- Budget: {{budget}}{{/if}}

Our team specializes in creating fun and memorable birthday celebrations. We'll review your inquiry and get back to you within 24-48 hours with a customized proposal that fits your vision and budget.

Let's make this birthday celebration one to remember!

Best regards,
Dreams Events Team`
  },

  {
    id: 'corporate_acknowledgment',
    name: 'Corporate Event',
    category: 'event_type',
    eventType: 'corporate',
    description: 'Professional response for corporate events',
    template: `Hello {{name}},

Thank you for your inquiry regarding your corporate event. We appreciate the opportunity to assist with your professional gathering.

Based on your requirements:
- Event Date: {{event_date}}
- Preferred Venue: {{venue}}
- Estimated Guests: {{guests}}
{{#if budget}}- Budget: {{budget}}{{/if}}

Our team has extensive experience in organizing successful corporate events. We'll review your inquiry and contact you within 24-48 hours to discuss your specific needs and provide a detailed proposal.

We look forward to working with you to create a professional and impactful event.

Best regards,
Dreams Events Team`
  },

  {
    id: 'debut_acknowledgment',
    name: 'Debut Celebration',
    category: 'event_type',
    eventType: 'debut',
    description: 'Response for debut inquiries',
    template: `Hello {{name}},

Thank you for your inquiry about your debut celebration! We're honored to be part of this special milestone in your life.

Based on your inquiry:
- Event Date: {{event_date}}
- Preferred Venue: {{venue}}
- Estimated Guests: {{guests}}
{{#if budget}}- Budget: {{budget}}{{/if}}

Our team specializes in creating elegant and memorable debut celebrations. We'll review your requirements and contact you within 24-48 hours to discuss your vision and provide a customized proposal.

Let's make your debut an unforgettable experience!

Best regards,
Dreams Events Team`
  },

  {
    id: 'anniversary_acknowledgment',
    name: 'Anniversary Celebration',
    category: 'event_type',
    eventType: 'anniversary',
    description: 'Response for anniversary inquiries',
    template: `Hello {{name}},

Thank you for your inquiry about your anniversary celebration! We're delighted to help you commemorate this special milestone.

Based on your details:
- Event Date: {{event_date}}
- Preferred Venue: {{venue}}
- Estimated Guests: {{guests}}
{{#if budget}}- Budget: {{budget}}{{/if}}

Our team will review your inquiry and contact you within 24-48 hours to discuss your vision and create a personalized proposal that reflects the significance of your anniversary.

Congratulations on this wonderful milestone!

Best regards,
Dreams Events Team`
  },

  // Follow-up Templates
  {
    id: 'follow_up_info',
    name: 'Request More Information',
    category: 'follow_up',
    description: 'Template for requesting additional details',
    template: `Hello {{name}},

Thank you for your inquiry about your {{event_type}} event. We're excited about the opportunity to work with you!

To provide you with the most accurate proposal, we would appreciate some additional information:

1. Do you have any specific theme or color scheme in mind?
2. Are there any special requirements or preferences we should know about?
3. What is your preferred timeline for finalizing the event details?

Once we receive this information, we'll be able to create a customized proposal that perfectly matches your vision.

Please feel free to reply with any additional details or questions you may have.

Best regards,
Dreams Events Team`
  },

  // Urgent/Time-Sensitive Templates
  {
    id: 'urgent_response',
    name: 'Urgent Event Response',
    category: 'urgent',
    description: 'For events happening soon',
    template: `Hello {{name}},

Thank you for your inquiry about your {{event_type}} event on {{event_date}}. We understand the time-sensitive nature of your request.

Based on your inquiry:
- Event Date: {{event_date}}
- Preferred Venue: {{venue}}
- Estimated Guests: {{guests}}
{{#if budget}}- Budget: {{budget}}{{/if}}

We'll prioritize your inquiry and contact you within 24 hours to discuss your requirements and see how we can assist with your upcoming event.

Please feel free to call us directly if you need immediate assistance.

Best regards,
Dreams Events Team`
  }
];

// Helper function to get templates by category
export const getTemplatesByCategory = (category) => {
  return RESPONSE_TEMPLATES.filter(template => template.category === category);
};

// Helper function to get templates by event type
export const getTemplatesByEventType = (eventType) => {
  return RESPONSE_TEMPLATES.filter(template => 
    template.eventType === eventType || template.category === 'generic'
  );
};

// Helper function to get template by ID
export const getTemplateById = (id) => {
  return RESPONSE_TEMPLATES.find(template => template.id === id);
};

