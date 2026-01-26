import { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

const IS_DEMO = process.env.NEXT_PUBLIC_IS_DEMO_MODE === 'true';

// Keys for sessionStorage
const DEMO_STORAGE_KEY = 'scort_demo_writes';

interface CachedWrite {
    method: string;
    url: string;
    data: any;
    timestamp: number;
}

/**
 * Applies the Demo Mode interceptor to an Axios instance.
 * If NEXT_PUBLIC_IS_DEMO_MODE is not 'true', this does nothing.
 */
export const applyDemoMode = (instance: AxiosInstance) => {
    if (!IS_DEMO) return;

    console.log('🚧 Application running in DEMO MODE. Write operations will be intercepted.');

    // Attach the interceptor to replace the adapter dynamically
    instance.interceptors.request.use((config) => {
        // We wrap the original adapter to handle the "Read" passthrough
        // Use instance.defaults.adapter as fallback if config.adapter is missing
        const originalAdapter = config.adapter || instance.defaults.adapter;

        config.adapter = demoAdapter(originalAdapter);
        return config;
    });
};

/**
 * A custom Axios adapter that intercepts write operations.
 */
const demoAdapter = (originalAdapter: any) => async (config: InternalAxiosRequestConfig): Promise<AxiosResponse> => {
    const { method, url } = config;
    const lowerMethod = method?.toLowerCase();

    // 1. PASSTHROUGH RULES
    // Allow all GET/HEAD/OPTIONS
    if (!lowerMethod || ['get', 'head', 'options'].includes(lowerMethod)) {
        return runOriginalAdapter(originalAdapter, config);
    }

    // Allow Auth endpoints (Login, Register, Session)
    if (url?.includes('/api/auth') || url?.includes('/auth/')) {
        return runOriginalAdapter(originalAdapter, config);
    }

    // 2. INTERCEPTION RULES (POST, PUT, PATCH, DELETE)
    console.log(`🔒 DEMO MODE: Intercepted ${method} ${url}`, config.data);

    // Simulate Network Delay
    await new Promise(resolve => setTimeout(resolve, 600));

    // Store the operation in sessionStorage for debugging/persistence simulation (optional)
    if (typeof window !== 'undefined' && window.sessionStorage) {
        try {
            const writes = JSON.parse(sessionStorage.getItem(DEMO_STORAGE_KEY) || '[]');
            writes.push({
                method,
                url,
                data: config.data ? JSON.parse(config.data as string) : null,
                timestamp: Date.now()
            });
            sessionStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(writes));
        } catch (e) {
            console.warn('Failed to log demo write to sessionStorage', e);
        }
    }

    // Return a Generic Success Response
    // We try to mimic the structure based on the request data
    return {
        data: config.data ? JSON.parse(config.data as string) : { success: true, message: 'Operation simulated in Demo Mode' },
        status: 200,
        statusText: 'OK',
        headers: { 'content-type': 'application/json' },
        config,
        request: {}
    };
};

// Helper to handle the original adapter call which might be a promise or function
async function runOriginalAdapter(adapter: any, config: any) {
    // Axios adapters can be promises or functions.
    // If it's the default axios adapter, it usually handles this.
    // But since we are wrapping it, we just call it.

    // Note: 'adapter' in config might be async.

    if (adapter instanceof Promise) {
        return (await adapter)(config);
    }
    return adapter(config);
}
