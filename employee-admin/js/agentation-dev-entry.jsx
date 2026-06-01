import React from 'react';
import { createRoot } from 'react-dom/client';
import { Agentation } from 'agentation';

const isLocal = ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);

if (isLocal && !document.querySelector('[data-agentation-root]')) {
  const rootEl = document.createElement('div');
  rootEl.dataset.agentationRoot = 'true';
  document.body.appendChild(rootEl);

  createRoot(rootEl).render(
    <Agentation endpoint="http://localhost:4747" />
  );
}
