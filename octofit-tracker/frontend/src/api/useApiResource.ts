import { useEffect, useState } from 'react';
import { getJson } from './client.js';

export function useApiResource<T>(path: string) {
  const [data, setData] = useState<T>();
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(undefined);
    setData(undefined);

    getJson<T>(path)
      .then((result) => {
        if (active) setData(result);
      })
      .catch((requestError: unknown) => {
        if (active) setError(requestError instanceof Error ? requestError.message : 'Unable to load data');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [path]);

  return { data, error, loading };
}