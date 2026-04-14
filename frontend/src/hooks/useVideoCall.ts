// src/hooks/useVideoCall.ts
import { useEffect, useState } from 'react';
import { StreamVideoClient, User } from '@stream-io/video-react-sdk';

export function useVideoCall(roomId: string | undefined, token: string | null, userId: string, currentUser: any) {
    const [client, setClient] = useState<StreamVideoClient | null>(null);
    const [call, setCall] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!roomId || !token || client) return;

        const apiKey = import.meta.env.VITE_STREAM_API_KEY;
        if (!apiKey) {
            console.error('Missing VITE_STREAM_API_KEY in .env');
            setError('Missing API Key');
            return;
        }

        const user: User = {
            id: userId,
            name: currentUser?.name || userId,
            image: currentUser?.avatar || undefined,
        };

        const _client = new StreamVideoClient({ apiKey });

        const initVideo = async () => {
            try {
                console.log('🔌 Connecting user:', userId);
                await _client.connectUser(user, token);

                console.log('📞 Creating/Joining call:', roomId);
                const _call = _client.call('default', roomId);
                await _call.join({ create: true });

                // ⭐ QUAN TRỌNG: Bật camera và microphone
                console.log('🎥 Enabling camera and microphone...');
                try {
                    // Kiểm tra permissions trước
                    const devices = await navigator.mediaDevices.enumerateDevices();
                    const hasCamera = devices.some(d => d.kind === 'videoinput');
                    const hasMic = devices.some(d => d.kind === 'audioinput');

                    console.log('📹 Camera available:', hasCamera);
                    console.log('🎤 Microphone available:', hasMic);

                    if (!hasCamera) {
                        console.warn('⚠️ No camera found!');
                        setError('No camera detected');
                    }

                    // Bật camera và mic
                    await _call.camera.enable();
                    await _call.microphone.enable();

                    console.log('✅ Camera and microphone enabled');

                    // Kiểm tra sau khi bật
                    setTimeout(() => {
                        console.log('📹 Camera state after enable:', _call.camera.state);
                        console.log('🎤 Microphone state:', _call.microphone.state);
                    }, 1000);

                } catch (mediaError) {
                    console.error('❌ Failed to enable camera/mic:', mediaError);
                    setError('Camera/Microphone access denied');
                }

                setClient(_client);
                setCall(_call);
                console.log('✅ Stream Video connected successfully - Room:', roomId);
            } catch (err) {
                console.error('❌ Lỗi kết nối video call:', err);
                setError(err instanceof Error ? err.message : 'Connection failed');
                await _client.disconnectUser();
            }
        };

        initVideo();

        return () => {
            const cleanup = async () => {
                if (call) {
                    try {
                        await call.leave();
                    } catch (err) {
                        console.error('Error leaving call:', err);
                    }
                }
                if (_client) {
                    await _client.disconnectUser();
                }
            };
            cleanup();
        };
    }, [roomId, token, userId, client]);

    return { client, call, error };
}