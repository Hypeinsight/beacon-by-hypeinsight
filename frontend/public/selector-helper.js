(function() {
  // Prevent double execution
  if (window.__beaconSelectorHelper) {
    alert('Selector Helper is already running!');
    return;
  }
  window.__beaconSelectorHelper = true;

  let hoveredElement = null;
  let overlay = null;

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

  // Select element on click
  function handleClick(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const selector = getSelector(hoveredElement);
    const elementInfo = hoveredElement.tagName.toLowerCase() + 
                       (hoveredElement.id ? '#' + hoveredElement.id : '') +
                       (hoveredElement.className ? '.' + hoveredElement.className.split(' ').join('.') : '');
    
    // Copy to clipboard
    navigator.clipboard.writeText(selector).then(() => {
      alert('✅ Selector copied to clipboard!\n\nElement: ' + elementInfo + '\n\nSelector: ' + selector + '\n\nPaste this into the Event Builder CSS Selector field.');
    }).catch(() => {
      prompt('Copy this selector:', selector);
    });
  }

  // Stop helper
  function stopHelper() {
    document.removeEventListener('mouseover', handleMouseOver);
    document.removeEventListener('click', handleClick, true);
    document.removeEventListener('keydown', handleKeyDown);
    if (overlay && overlay.parentNode) {
      overlay.parentNode.removeChild(overlay);
    }
    window.__beaconSelectorHelper = false;
    alert('Selector Helper stopped. Refresh to use again.');
  }

  // Handle ESC key to stop
  function handleKeyDown(e) {
    if (e.key === 'Escape') {
      stopHelper();
    }
  }

  // Initialize
  createOverlay();
  document.addEventListener('mouseover', handleMouseOver);
  document.addEventListener('click', handleClick, true);
  document.addEventListener('keydown', handleKeyDown);

  alert('🎯 Beacon Selector Helper Active!\n\n✓ Hover over elements to highlight\n✓ Click to copy selector\n✓ Press ESC to stop');
})();
