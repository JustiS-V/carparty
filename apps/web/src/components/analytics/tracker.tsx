'use client';

import { useEffect, useRef } from 'react';
import { initTracker, track } from '@carparty/analytics';
import { API_URL, getToken } from '@/lib/api';

let trackerInitialized = false;

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (!trackerInitialized) {
      initTracker({
        apiUrl: API_URL,
        batchSize: 5,
        flushInterval: 3000,
        getAuthToken: getToken,
      });
      trackerInitialized = true;
    }
  }, []);

  return <>{children}</>;
}

interface TrackableViewProps {
  metric: string;
  dimensions?: Record<string, string | number | boolean>;
  children: React.ReactNode;
}

export function TrackableView({ metric, dimensions, children }: TrackableViewProps) {
  const tracked = useRef(false);

  useEffect(() => {
    if (!tracked.current) {
      track({ metric, dimensions });
      tracked.current = true;
    }
  }, [metric, dimensions]);

  return <>{children}</>;
}

interface TrackableClickProps {
  metric: string;
  dimensions?: Record<string, string | number | boolean>;
  children: React.ReactElement;
}

export function TrackableClick({ metric, dimensions, children }: TrackableClickProps) {
  return (
    <children.type
      {...children.props}
      onClick={(e: React.MouseEvent) => {
        track({ metric, dimensions });
        children.props.onClick?.(e);
      }}
    />
  );
}
