import { useEffect, useState, useCallback } from 'react';
import { api } from '../lib/api';
import { errorMessage } from '../lib/utils';

export function useResource(path) {
  const [state, setState] = useState({
    path: null,
    data: null,
    loading: true,
    error: '',
  });
  const [revision, setRevision] = useState(0);
  const retry = useCallback(() => setRevision((value) => value + 1), []);
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    if (!path) return;
    api
      .get(path, { signal: controller.signal })
      .then(({ data }) => {
        if (active) setState({ path, data, loading: false, error: '' });
      })
      .catch((error) => {
        if (active && error.code !== 'ERR_CANCELED')
          setState({
            path,
            data: null,
            loading: false,
            error: errorMessage(error),
          });
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [path, revision]);
  return {
    ...state,
    loading: Boolean(path) && (state.path !== path || state.loading),
    retry: () => {
      setState({ path, data: null, loading: true, error: '' });
      retry();
    },
  };
}
