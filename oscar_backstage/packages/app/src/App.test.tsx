import { render, waitFor } from '@testing-library/react';
import App from './App';

describe('le portail', () => {
  it('demarre, avec les modules OSCAR', async () => {
    process.env = {
      NODE_ENV: 'test',
      APP_CONFIG: [
        {
          data: {
            app: { title: 'OSCAR' },
            backend: { baseUrl: 'http://localhost:7007' },
            auth: { environment: 'development' },
            techdocs: {
              storageUrl: 'http://localhost:7007/api/techdocs/static/docs',
            },
          },
          context: 'test',
        },
      ] as any,
    };

    const rendered = render(App.createRoot());

    await waitFor(() => {
      expect(rendered.baseElement).toBeInTheDocument();
    });
  });
});
