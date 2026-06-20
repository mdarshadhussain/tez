(function() {
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'attributes' && mutation.attributeName === 'bis_skin_checked') {
        mutation.target.removeAttribute('bis_skin_checked');
      } else if (mutation.addedNodes) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === 1) {
            if (node.hasAttribute('bis_skin_checked')) {
              node.removeAttribute('bis_skin_checked');
            }
            const children = node.querySelectorAll('[bis_skin_checked]');
            for (let i = 0; i < children.length; i++) {
              children[i].removeAttribute('bis_skin_checked');
            }
          }
        }
      }
    }
  });
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['bis_skin_checked']
  });
})();
