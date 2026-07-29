import { useState, useCallback, useRef } from 'react';
import { request } from '../services/api';

/**
 * useApi — eliminates the repetitive try/catch/loading/error boilerplate
 * that appears in almost every SafeWalk component.
 *
 * Usage — imperative (fire on demand):
 * ─────────────────────────────────────
 *   const { data, status, error, execute } = useApi();
 *
 *   const load = () => execute('/reports');
 *   const update = (id, body) =>
 *     execute(`/reports/${id}`, { method: 'PUT', body: JSON.stringify(body) });
 *
 * Usage — automatic on mount (pass `path` option):
 * ──────────────────────────────────────────────────
 *   const { data, status, error, refresh } = useApi('/reports', { autoFetch: true });
 *
 * Returned values:
 *   data      — last successful response value (null until first success)
 *   status    — 'idle' | 'loading' | 'success' | 'error'
 *   error     — error message string or null
 *   execute   — (path, fetchOptions?) => Promise<data>  — manual trigger
 *   refresh   — () => void — re-runs the last execute call
 *   reset     — () => void — clears data/error/status back to idle
 */
export function useApi(defaultPath = null, { autoFetch = false } = {}) {
  const [data,   setData]   = useState(null);
  const [status, setStatus] = useState('idle');
  const [error,  setError]  = useState(null);

  // Keep track of the last call so refresh() can repeat it
  const lastCallRef = useRef({ path: defaultPath, options: {} });
  // Abort stale requests when a new one starts
  const abortRef = useRef(null);

  const execute = useCallback(async (path, options = {}) => {
    // Cancel any in-flight request
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    lastCallRef.current = { path, options };
    setStatus('loading');
    setError(null);

    try {
      const result = await request(path, {
        ...options,
        signal: controller.signal,
      });
      if (!controller.signal.aborted) {
        setData(result);
        setStatus('success');
      }
      return result;
    } catch (err) {
      if (err.name === 'AbortError') return;
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      setStatus('error');
      throw err; // re-throw so callers can handle inline if needed
    }
  }, []);

  const refresh = useCallback(() => {
    const { path, options } = lastCallRef.current;
    if (path) execute(path, options);
  }, [execute]);

  const reset = useCallback(() => {
    setData(null);
    setStatus('idle');
    setError(null);
  }, []);

  // Auto-fetch on mount when configured
  // (uses a ref so the effect doesn't need execute in its deps array)
  const executeRef = useRef(execute);
  executeRef.current = execute;

  useState(() => {
    if (autoFetch && defaultPath) {
      executeRef.current(defaultPath);
    }
  });

  return { data, status, error, execute, refresh, reset };
}
