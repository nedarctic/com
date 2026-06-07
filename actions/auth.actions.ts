'use server'

import z from 'zod';
import { cookies } from 'next/headers';

export async function loginAction(formData: FormData) {
    const loginSchema = z.object({
        email: z.email('Invalid email'),
        password: z.string().min(6, 'Password less than 6 characters')
    });

    const parsedData = loginSchema.safeParse({
        email: formData.get('email'),
        password: formData.get('password')
    })

    if (!parsedData.success) {
        console.log('Validation error:', parsedData.error.message)
        return { success: false, error: parsedData.error.message }
    }

    try {
        const res = await fetch(`${process.env.BACKEND_API}/auth/login`, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(parsedData.data)
        });

        if (!res.ok) {
            return { success: false, error: await res.json() }
        }

        const {access_token, refresh_token} = await res.json();
        console.log('Access token', access_token);
        console.log('Refresh token', refresh_token);

        console.log('Response headers', res.headers);
        
        return { success: true }
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
}

export async function logoutAction() {
    const cookieStore = await cookies();

    try {
        cookieStore.delete('access_token');
        cookieStore.delete('refresh_token');

        return { success: true }
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
}