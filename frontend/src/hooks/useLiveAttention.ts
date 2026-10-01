import { useState, useEffect } from 'react';
import { liveWs } from '../lib/ws';
import { LiveStreamPacket, AlertData } from '../lib/types';

export function useLiveAttention() {
  const [packet, setPacket] = useState<LiveStreamPacket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [activeAlert, setActiveAlert] = useState<AlertData | null>(null);
  const [historyScores, setHistoryScores] = useState<{ time: string; score: number }[]>([]);

  useEffect(() => {
    liveWs.connect();

    const unsubStatus = liveWs.onStatusChange((status) => {
      setIsConnected(status);
    });

    const unsubPacket = liveWs.onPacket((newPacket) => {
      setPacket(newPacket);

      if (newPacket.alert) {
        setActiveAlert(newPacket.alert);
      }

      // Keep last 30 live score data points for real-time sparkline
      const timeStr = new Date(newPacket.timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

      setHistoryScores((prev) => {
        const next = [...prev, { time: timeStr, score: Math.round(newPacket.attention_score * 100) }];
        return next.slice(-30);
      });
    });

    return () => {
      unsubStatus();
      unsubPacket();
    };
  }, []);

  const dismissAlert = () => {
    setActiveAlert(null);
  };

  return {
    packet,
    isConnected,
    activeAlert,
    dismissAlert,
    historyScores,
  };
}
