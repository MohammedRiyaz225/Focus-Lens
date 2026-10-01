import { useState, useCallback } from 'react';
import { api } from '../lib/api';
import { Session, SessionDetail } from '../lib/types';

export function useSession() {
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [sessionDetail, setSessionDetail] = useState<SessionDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const startSession = useCallback(async (mode: string, plannedMinutes: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const session = await api.startSession(mode, plannedMinutes);
      setCurrentSession(session);
      return session;
    } catch (err: any) {
      setError(err.message || 'Failed to start session');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const pauseSession = useCallback(async (sessionId: number) => {
    try {
      const session = await api.pauseSession(sessionId);
      setCurrentSession(session);
      return session;
    } catch (err: any) {
      setError(err.message);
    }
  }, []);

  const resumeSession = useCallback(async (sessionId: number) => {
    try {
      const session = await api.resumeSession(sessionId);
      setCurrentSession(session);
      return session;
    } catch (err: any) {
      setError(err.message);
    }
  }, []);

  const endSession = useCallback(async (sessionId: number) => {
    setIsLoading(true);
    try {
      const session = await api.endSession(sessionId);
      setCurrentSession(null);
      // Fetch full details
      const detail = await api.getSessionDetail(sessionId);
      setSessionDetail(detail);
      return detail;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadSessionDetail = useCallback(async (sessionId: number) => {
    setIsLoading(true);
    try {
      const detail = await api.getSessionDetail(sessionId);
      setSessionDetail(detail);
      return detail;
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    currentSession,
    sessionDetail,
    isLoading,
    error,
    startSession,
    pauseSession,
    resumeSession,
    endSession,
    loadSessionDetail,
  };
}
