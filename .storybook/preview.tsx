import type { Preview } from '@storybook/react-vite';
import React from 'react';
import '../src/index.css';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: { test: 'todo' },
    layout: 'fullscreen',
    options: {
      storySort: {
        order: [
          'Portal',
          ['Overview', 'Foundations', 'Components', 'Patterns', 'Install'],
          'Components',
          'Compositions',
          'Tokens',
        ],
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="min-h-screen bg-background font-sans text-foreground antialiased">
        <div className="mx-auto max-w-5xl px-8 py-10">
          <Story />
        </div>
      </div>
    ),
  ],
};

export default preview;
