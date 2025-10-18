// Crear esta página TEMPORALMENTE para debugging
// src/app/debug-session/page.tsx

import { auth } from "@/auth";
import { headers } from 'next/headers';

export default async function DebugSessionPage() {
    const session = await auth();
    const headersList = headers();

    // Obtener todas las cookies
    const cookieHeader = (await headersList).get('cookie');
    const cookies = cookieHeader?.split(';').map(c => c.trim()) || [];

    // Buscar cookies de NextAuth
    const nextAuthCookies = cookies.filter(c =>
        c.includes('next-auth') || c.includes('__Secure-next-auth')
    );

    console.log('🐛 [DEBUG SESSION PAGE] Session check:', {
        hasSession: !!session,
        userId: session?.user?.id,
        email: session?.user?.email,
        hasPassword: session?.user?.hasPassword,
        role: session?.user?.role,
        cookiesFound: nextAuthCookies.length,
        timestamp: new Date().toISOString(),
    });

    return (
        <div style={{ padding: '2rem', fontFamily: 'monospace' }}>
            <h1>🐛 Debug Session Page</h1>

            <div style={{ marginTop: '2rem', padding: '1rem', background: '#f5f5f5', borderRadius: '8px' }}>
                <h2>Session Status</h2>
                <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {JSON.stringify({
                        hasSession: !!session,
                        user: session?.user ? {
                            id: session.user.id,
                            email: session.user.email,
                            name: session.user.name,
                            role: session.user.role,
                            hasPassword: session.user.hasPassword,
                            emailVerified: session.user.emailVerified,
                            provider: session.user.provider,
                        } : null,
                    }, null, 2)}
                </pre>
            </div>

            <div style={{ marginTop: '2rem', padding: '1rem', background: '#fff3cd', borderRadius: '8px' }}>
                <h2>NextAuth Cookies Found</h2>
                <p>Total NextAuth cookies: {nextAuthCookies.length}</p>
                {nextAuthCookies.length > 0 ? (
                    <ul>
                        {nextAuthCookies.map((cookie, i) => (
                            <li key={i}>
                                {cookie.split('=')[0]} = [value hidden for security]
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p style={{ color: 'red' }}>❌ No NextAuth cookies found!</p>
                )}
            </div>

            <div style={{ marginTop: '2rem', padding: '1rem', background: '#d1ecf1', borderRadius: '8px' }}>
                <h2>Environment Check</h2>
                <pre>
                    {JSON.stringify({
                        NODE_ENV: process.env.NODE_ENV,
                        hasNEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
                        hasNEXTAUTH_URL: !!process.env.NEXTAUTH_URL,
                        NEXTAUTH_URL: process.env.NEXTAUTH_URL,
                        hasAPI_URL: !!process.env.NEXT_PUBLIC_API_URL,
                    }, null, 2)}
                </pre>
            </div>

            <div style={{ marginTop: '2rem' }}>
                <h2>Actions</h2>
                {session ? (
                    <div>
                        <p style={{ color: 'green' }}>✅ You are logged in as: {session.user.email}</p>
                        <a href="/cuenta" style={{
                            display: 'inline-block',
                            padding: '10px 20px',
                            background: '#007bff',
                            color: 'white',
                            textDecoration: 'none',
                            borderRadius: '4px',
                            marginTop: '1rem'
                        }}>
                            Go to /cuenta
                        </a>
                    </div>
                ) : (
                    <div>
                        <p style={{ color: 'red' }}>❌ You are NOT logged in</p>
                        <a href="/autenticacion/ingresar" style={{
                            display: 'inline-block',
                            padding: '10px 20px',
                            background: '#28a745',
                            color: 'white',
                            textDecoration: 'none',
                            borderRadius: '4px',
                            marginTop: '1rem'
                        }}>
                            Go to Login
                        </a>
                    </div>
                )}
            </div>

            <div style={{ marginTop: '2rem', padding: '1rem', background: '#f8d7da', borderRadius: '8px' }}>
                <h2>⚠️ Important Notes</h2>
                <ul>
                    <li>This page bypasses middleware checks to show raw session data</li>
                    <li>Check the console logs in Vercel for detailed information</li>
                    <li>If you see cookies but no session, there's a token parsing issue</li>
                    <li>If you see no cookies, the session isn't being created properly</li>
                    <li><strong>DELETE THIS PAGE after debugging!</strong></li>
                </ul>
            </div>
        </div>
    );
}