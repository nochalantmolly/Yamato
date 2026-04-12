import {useEffect, useRef, useCallback} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {AppState} from 'react-native';

const WS_BASE = 'ws://10.0.2.2:8000'; // Android emulator; use ws://localhost:8000 for iOS simulator

export function useWebSocket(path: string | null, onMessage: (data: any) => void) {
  const ws = useRef<WebSocket | null>(null);
  const onMessageRef = useRef(onMessage);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unmounted = useRef(false);
  onMessageRef.current = onMessage;

  const connect = useCallback(async () => {
    if (!path || unmounted.current) return;
    ws.current?.close();
    const token = await AsyncStorage.getItem('access_token');
    const url = `${WS_BASE}${path}${token ? `?token=${token}` : ''}`;
    const socket = new WebSocket(url);

    socket.onmessage = event => {
      try {
        const data = JSON.parse(event.data);
        onMessageRef.current(data);
      } catch {}
    };

    socket.onclose = () => {
      if (!unmounted.current) {
        reconnectTimer.current = setTimeout(connect, 3000);
      }
    };

    ws.current = socket;
  }, [path]);

  useEffect(() => {
    unmounted.current = false;
    connect();
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') connect();
    });
    return () => {
      unmounted.current = true;
      if (reconnectTimer.current !== null) {
        clearTimeout(reconnectTimer.current);
      }
      sub.remove();
      ws.current?.close();
    };
  }, [connect]);
}
