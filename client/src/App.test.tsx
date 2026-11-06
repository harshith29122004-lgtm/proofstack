import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import App from './App';

const documents = [{
  id: 'document-1',
  name: 'brief.txt',
  type: 'TXT',
  size: 123,
  createdAt: '2026-11-01T10:00:00.000Z',
  chunkCount: 2,
}];

const reports = [{
  id: 'report-1',
  title: 'Existing research',
  question: 'What is the release deadline?',
  createdAt: '2026-11-02T10:00:00.000Z',
  sourceCount: 1,
  coverage: 75,
  scope: 'brief.txt',
}];

const reportDetail = {
  id: 'report-1',
  title: 'Existing research',
  question: 'What is the release deadline?',
  createdAt: '2026-11-02T10:00:00.000Z',
  scope: { documentId: 'document-1', documentName: 'brief.txt' },
  answer: 'The saved search found one matching passage.',
  sources: [{
    citation: '[S1]',
    chunkId: 'chunk-1',
    documentId: 'document-1',
    document: 'brief.txt',
    location: 'Page 1',
    excerpt: 'Release deadline is Friday.',
    relevance: 100,
  }],
  coverage: 75,
  mode: 'extractive',
  notice: 'Verify the original source and surrounding context.',
};

function jsonResponse(data: unknown) {
  return { ok: true, json: async () => data } as Response;
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.endsWith('/api/documents')) return jsonResponse(documents);
    if (url.endsWith('/api/health')) return jsonResponse({ ok: true });
    if (url.endsWith('/api/reports/report-1')) return jsonResponse(reportDetail);
    if (url.endsWith('/api/reports')) return jsonResponse(reports);
    return jsonResponse({});
  }));
  vi.stubGlobal('confirm', vi.fn(() => true));
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('ProofStack workspace navigation', () => {
  it('loads source counts, filters and saved reports from the API', async () => {
    render(<App />);

    const scope = await screen.findByRole('combobox', { name: 'Search source scope' });
    expect(scope).toHaveValue('all');
    expect(screen.getByRole('option', { name: 'brief.txt' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Source library/ }));
    expect(await screen.findByRole('heading', { name: 'Source library' })).toBeInTheDocument();
    expect(screen.getAllByText('brief.txt').length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: /Saved reports/ }));
    expect(await screen.findByRole('heading', { name: 'Saved reports' })).toBeInTheDocument();
    expect(screen.getByText('Existing research')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Download/ })).toHaveAttribute(
      'href',
      expect.stringContaining('/api/reports/report-1/export'),
    );
  });

  it('opens a saved report and displays its preserved evidence citations', async () => {
    render(<App />);
    fireEvent.click(await screen.findByRole('button', { name: /Saved reports/ }));
    fireEvent.click(await screen.findByRole('button', { name: /^View$/ }));

    expect(await screen.findByRole('heading', { name: 'Existing research' })).toBeInTheDocument();
    expect(screen.getByText('What is the release deadline?')).toBeInTheDocument();
    expect(screen.getByText('The saved search found one matching passage.')).toBeInTheDocument();
    expect(screen.getByText('Release deadline is Friday.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Open original source/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Download Markdown/ })).toHaveAttribute(
      'href',
      expect.stringContaining('/api/reports/report-1/export'),
    );
  });

  it('keeps source upload and backup restore inputs mounted across workspace tabs', async () => {
    const { container } = render(<App />);
    await screen.findByRole('button', { name: /Saved reports/ });
    fireEvent.click(screen.getByRole('button', { name: /Saved reports/ }));

    expect(container.querySelector('input[type="file"][accept^=".pdf"]')).toBeInTheDocument();
    expect(container.querySelector('input[type="file"][accept=".json,application/json"]')).toBeInTheDocument();
  });
});
