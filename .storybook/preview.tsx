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
          [
            'Get started',
            ['Overview', 'Install & usage'],
            'Foundations',
            ['Color', 'Typography', 'Spacing & radius', 'Elevation'],
            'Components',
            ['Components', 'Form elements', 'Tables', 'Charts'],
            'Patterns',
            ['App shell', 'Dashboard', 'Filtering', 'CRUD patterns', 'Flows'],
          ],
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
