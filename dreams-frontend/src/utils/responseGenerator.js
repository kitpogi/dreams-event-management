import { RESPONSE_TEMPLATES, getTemplatesByEventType, getTemplateById } from '../config/responseTemplates';

/**
 * Format currency for display
 */
const formatCurrency = (amount) => {
  if (!amount) return 'Not specified';
  return `₱${parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

/**
 * Format date for display
 */
const formatDate = (dateString) => {
  if (!dateString) return 'Not specified';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch (e) {
    return dateString;
  }
};

/**
 * Format event type for display
 */
const formatEventType = (eventType) => {
  if (!eventType) return 'Event';
  return eventType.charAt(0).toUpperCase() + eventType.slice(1);
};

/**
 * Check if event is urgent (within 30 days)
 */
const isUrgent = (eventDate) => {
  if (!eventDate) return false;
  try {
    const date = new Date(eventDate);
    const today = new Date();
    const diffTime = date - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 && diffDays <= 30;
  } catch (e) {
    return false;
  }
};

/**
 * Replace placeholders in template with actual values
 */
const replacePlaceholders = (template, data) => {
  let result = template;
  
  // Get inquiry name
  const name = data.name || 
    `${data.first_name || ''} ${data.last_name || ''}`.trim() || 
    'Valued Customer';
  
  // Replace simple placeholders
  const replacements = {
    '{{name}}': name,
    '{{event_type}}': formatEventType(data.event_type),
    '{{event_date}}': formatDate(data.date_of_event),
    '{{venue}}': data.preferred_venue || 'your preferred venue',
    '{{guests}}': data.estimated_guests || 'Not specified',
    '{{budget}}': formatCurrency(data.budget),
  };

  // Replace all placeholders
  Object.keys(replacements).forEach(placeholder => {
    const regex = new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g');
    result = result.replace(regex, replacements[placeholder]);
  });

  // Handle conditional blocks (simple implementation)
  // Remove lines with {{#if budget}} if budget is not available
  if (!data.budget) {
    // Remove the entire conditional block including the line break before it
    result = result.replace(/\n?\{\{#if budget\}\}[\s\S]*?\{\{\/if\}\}/g, '');
  } else {
    // Keep the content but remove the conditional markers
    result = result.replace(/\{\{#if budget\}\}/g, '');
    result = result.replace(/\{\{\/if\}\}/g, '');
  }

  return result.trim();
};

/**
 * Select the best template based on inquiry data
 */
const selectBestTemplate = (inquiry) => {
  // Check if event is urgent
  if (isUrgent(inquiry.date_of_event)) {
    const urgentTemplate = RESPONSE_TEMPLATES.find(t => t.id === 'urgent_response');
    if (urgentTemplate) return urgentTemplate;
  }

  // Get event type specific templates
  if (inquiry.event_type) {
    const eventTypeTemplates = getTemplatesByEventType(inquiry.event_type);
    const specificTemplate = eventTypeTemplates.find(t => t.eventType === inquiry.event_type);
    if (specificTemplate) return specificTemplate;
  }

  // Default to generic acknowledgment
  return getTemplateById('generic_acknowledgment') || RESPONSE_TEMPLATES[0];
};

/**
 * Generate automatic response based on inquiry data
 * @param {Object} inquiry - The contact inquiry object
 * @param {string} templateId - Optional template ID to use (if not provided, auto-selects)
 * @returns {string} Generated response message
 */
export const generateResponse = (inquiry, templateId = null) => {
  if (!inquiry) {
    return '';
  }

  // Get template
  let template;
  if (templateId) {
    template = getTemplateById(templateId);
  }
  
  if (!template) {
    template = selectBestTemplate(inquiry);
  }

  if (!template) {
    // Fallback to a simple message
    const name = inquiry.name || 
      `${inquiry.first_name || ''} ${inquiry.last_name || ''}`.trim() || 
      'Valued Customer';
    return `Hello ${name},\n\nThank you for your inquiry. We'll get back to you soon.\n\nBest regards,\nDreams Events Team`;
  }

  // Replace placeholders with actual data
  return replacePlaceholders(template.template, inquiry);
};

/**
 * Get available templates for an inquiry
 * @param {Object} inquiry - The contact inquiry object
 * @returns {Array} Array of available templates
 */
export const getAvailableTemplates = (inquiry) => {
  if (!inquiry) {
    return RESPONSE_TEMPLATES;
  }

  // If event type is specified, prioritize event-specific templates
  if (inquiry.event_type) {
    const eventTypeTemplates = getTemplatesByEventType(inquiry.event_type);
    const otherTemplates = RESPONSE_TEMPLATES.filter(t => 
      !eventTypeTemplates.includes(t)
    );
    return [...eventTypeTemplates, ...otherTemplates];
  }

  return RESPONSE_TEMPLATES;
};

/**
 * Generate subject line based on inquiry
 * @param {Object} inquiry - The contact inquiry object
 * @returns {string} Generated subject line
 */
export const generateSubject = (inquiry) => {
  if (!inquiry) {
    return 'Re: Your Event Inquiry';
  }

  const eventType = formatEventType(inquiry.event_type);
  return `Re: Your ${eventType} Inquiry - Dreams Events`;
};

