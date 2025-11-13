(function() {
  // Prevent double execution
  if (window.__beaconSelectorHelper) {
    alert('Selector Helper is already running!');
    return;
  }
  window.__beaconSelectorHelper = true;

  let hoveredElement = null;
  let overlay = null;
  let toast = null;
  let isActive = true;
  let clickModifierPressed = false;

  // Create overlay for highlighting
  function createOverlay() {
    overlay = document.createElement('div');
    overlay.style.position = 'absolute';
    overlay.style.border = '3px solid #9333EA';
    overlay.style.backgroundColor = 'rgba(147, 51, 234, 0.2)';
    overlay.style.pointerEvents = 'none';
    overlay.style.zIndex = '2147483647'; // Max z-index
    overlay.style.display = 'none';
    overlay.style.transition = 'all 0.1s ease';
    document.body.appendChild(overlay);
  }

  // Create toast notification
  function showToast(message, selector) {
    if (toast) toast.remove();
    
    toast = document.createElement('div');
    toast.style.position = 'fixed';
    toast.style.bottom = '20px';
    toast.style.right = '20px';
    toast.style.backgroundColor = '#10B981';
    toast.style.color = 'white';
    toast.style.padding = '16px 20px';
    toast.style.borderRadius = '8px';
    toast.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
    toast.style.zIndex = '2147483647';
    toast.style.fontFamily = 'system-ui, -apple-system, sans-serif';
    toast.style.fontSize = '14px';
    toast.style.maxWidth = '400px';
    toast.style.animation = 'slideIn 0.3s ease';
    toast.innerHTML = `
      <div style="font-weight: 600; margin-bottom: 4px;">✓ ${message}</div>
      <code style="display: block; background: rgba(255,255,255,0.2); padding: 4px 8px; border-radius: 4px; font-size: 12px; margin-top: 8px;">${selector}</code>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      if (toast) {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
      }
    }, 3000);
  }

  // Generate CSS selector for element
  function getSelector(el) {
    // Prefer ID
    if (el.id) return '#' + el.id;
    
    // Try unique class
    if (el.className && typeof el.className === 'string') {
      const classes = el.className.trim().split(/\s+/).filter(c => c && !c.includes(':'));
      if (classes.length > 0) {
        const selector = el.tagName.toLowerCase() + '.' + classes.join('.');
        if (document.querySelectorAll(selector).length === 1) {
          return selector;
        }
        // Return first class if not unique
        return el.tagName.toLowerCase() + '.' + classes[0];
      }
    }
    
    // Fallback to tag with nth-of-type
    const parent = el.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children).filter(e => e.tagName === el.tagName);
      if (siblings.length > 1) {
        const index = siblings.indexOf(el) + 1;
        return el.tagName.toLowerCase() + ':nth-of-type(' + index + ')';
      }
    }
    
    return el.tagName.toLowerCase();
  }

  // Highlight element on hover
  function handleMouseOver(e) {
    hoveredElement = e.target;
    if (hoveredElement === overlay) return;
    
    const rect = hoveredElement.getBoundingClientRect();
    overlay.style.display = 'block';
    overlay.style.top = (rect.top + window.scrollY) + 'px';
    overlay.style.left = (rect.left + window.scrollX) + 'px';
    overlay.style.width = rect.width + 'px';
    overlay.style.height = rect.height + 'px';
  }

  // Select element on click (only when Alt/Cmd key is pressed)
  function handleClick(e) {
    // Only capture click if Alt (Windows/Linux) or Cmd (Mac) key is held
    if (!e.altKey && !e.metaKey) {
      return; // Let click pass through normally
    }
    
    e.preventDefault();
    e.stopPropagation();
    
    const selector = getSelector(hoveredElement);
    
    // Copy to clipboard
    navigator.clipboard.writeText(selector).then(() => {
      showToast('Selector copied!', selector);
    }).catch(() => {
      showToast('Copy failed - selector shown below', selector);
    });
  }

  // Stop helper
  function stopHelper() {
    isActive = false;
    document.removeEventListener('mouseover', handleMouseOver);
    document.removeEventListener('click', handleClick, true);
    document.removeEventListener('keydown', handleKeyDown);
    if (overlay && overlay.parentNode) {
      overlay.parentNode.removeChild(overlay);
    }
    if (toast && toast.parentNode) {
      toast.parentNode.removeChild(toast);
    }
    window.__beaconSelectorHelper = false;
    showToast('Selector Helper stopped', 'Press Cmd+Shift+S (Mac) or Alt+Shift+S (Windows) to restart');
    setTimeout(() => {
      if (toast) toast.remove();
    }, 2000);
  }

  // Handle ESC key to stop
  function handleKeyDown(e) {
    if (e.key === 'Escape') {
      stopHelper();
    }
  }

  // Add CSS animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateY(100%); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    @keyframes slideOut {
      from { transform: translateY(0); opacity: 1; }
      to { transform: translateY(100%); opacity: 0; }
    }
  `;
  document.head.appendChild(style);

  // Initialize
  createOverlay();
  document.addEventListener('mouseover', handleMouseOver);
  document.addEventListener('click', handleClick, true);
  document.addEventListener('keydown', handleKeyDown);

  // Show initial toast
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modifierKey = isMac ? 'Cmd' : 'Alt';
  showToast(
    'Selector Helper Active!',
    `Hover to highlight • ${modifierKey}+Click to copy • ESC to stop`
  );
})();
