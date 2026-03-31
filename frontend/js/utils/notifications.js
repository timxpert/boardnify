// frontend/js/utils/notifications.js

/**
 * Handles simulated email notifications triggering Toast messages.
 * This abstraction layer integrates with EmailJS or defaults to a mailto fallback.
 */
window.triggerNotification = function(type, data = {}) {
  let subject = "Boardnify Notification";
  let body = "";
  let message = ""; // For Toast

  switch (type) {
    case 'invite':
      subject = "You've been invited to collaborate on Boardnify!";
      body = `Hi there,\n\nYou have been invited as a ${data.role || 'Client'} to collaborate on a Boardnify project.\n\nClick here to join: ${window.location.href}`;
      message = "Invitation sent to " + (data.email || 'user') + " as " + (data.role || 'Client') + ".";
      break;
    case 'delivery_video':
    case 'delivery':
      subject = "New Video Delivery Ready for Review";
      body = `Hi,\n\nA new video deliverable is ready for your review on Boardnify.\n\nView it here: ${window.location.href}`;
      message = "Client notified: 'New Video Delivery ready for review.'";
      break;
    case 'delivery_moodboard':
      subject = "Moodboard Shared With You";
      body = `Hi,\n\nA new Moodboard has been shared with you for your creative review.\n\nView here: ${window.location.href}`;
      message = "Client notified: 'A new Moodboard has been shared with you.'";
      break;
    case 'delivery_styleframes':
      subject = "Style Frames Ready for Review";
      body = `Hi,\n\nNew Style Frames are ready for your review and approval on Boardnify.\n\nView here: ${window.location.href}`;
      message = "Client notified: 'New Style Frames are ready for review.'";
      break;
    case 'revision_complete':
      subject = "Revisions Completed";
      body = `Hi,\n\nRevisions have been completed on your project ${data.projectName || ''}.\n\nReview them here: ${window.location.href}`;
      message = "Client notified: 'Revisions have been completed on your project.'";
      break;
    case 'comment_reply':
      subject = "New Reply on Boardnify";
      body = `Hi,\n\nThe designer has replied to your comment.\n\nView reply: ${window.location.href}`;
      message = "Client notified: 'Designer replied to your comment.'";
      break;
    case 'nudge_review':
      subject = "Pending Items for Review";
      body = `Hi,\n\nJust a friendly reminder that there are pending items waiting for your review on Boardnify.\n\nReview here: ${window.location.href}`;
      message = "Client nudged: 'Please review the pending items.'";
      break;
    case 'project_approved':
      subject = "Project Approved!";
      body = `Great news!\n\nThe project ${data.projectName || ''} has been marked as Approved!\n\nView details: ${window.location.href}`;
      message = "Team notified: 'Project has been marked as Approved!'";
      break;
    default:
      subject = "System Alert";
      body = "Action completed successfully.";
      message = "Action completed successfully.";
  }

  const tryEmailJS = typeof emailjs !== 'undefined';
  
  if(tryEmailJS) {
    emailjs.send("default_service", "template_default", {
      subject: subject,
      message: body,
      to_email: data.email || 'client@example.com'
    }).then(function() {
      if(window.showToast) window.showToast(message, 'success');
      console.log("[EMAILJS] Success:", type);
    }, function(error) {
      console.warn('EmailJS failed, falling back to mailto', error);
      triggerMailtoFallback(subject, body, data);
      if(window.showToast) window.showToast(message, 'info'); 
    });
  } else {
    // Fallback
    console.log("[EMAIL MOCK] Sending payload:", type, data);
    triggerMailtoFallback(subject, body, data);
    if(window.showToast) window.showToast(message, 'info');
  }
};

function triggerMailtoFallback(subject, body, data) {
    const to = data.email || '';
    const mailto = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    // Create an invisible iframe to trigger the mailto securely without page bouncing
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = mailto;
    document.body.appendChild(iframe);
    
    setTimeout(() => {
       if (iframe.parentNode) document.body.removeChild(iframe);
    }, 500);
}
