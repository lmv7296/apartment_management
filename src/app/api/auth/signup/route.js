import { db } from '@/app/utils/db';
import { hash } from 'bcryptjs';
import { auth } from '@/app/utils/auth';

export async function POST(request) {
    try {
        const { email, password, name } = await request.json();

        if (!email || !password || !name) {
            return Response.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const user = await auth.api.signUpEmail({
            email,
            password,
            name,
        });

        return Response.json(
            { message: 'User created successfully', user },
            { status: 201 }
        );
    } catch (error) {
        return Response.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
