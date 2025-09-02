import { getVerificationTokenByEmail } from '@/data/verficiation-token';
import { getPasswordResetTokenByEmail } from '@/data/password-reset-token';
import { v4 as uuidv4 } from 'uuid';
import { db } from "@/lib/db";

export const generateResetPasswordToken = async (email: string) => {
    const token = uuidv4();
    const expires = new Date(Date.now() + 30 * 60 * 1000); // Token valid for 30 minutes

    const existingToken = await getPasswordResetTokenByEmail(email);

    if (existingToken) {
        await db.passwordResetToken.delete({
            where: {
                id: existingToken.id
            }
        })
    }

    const ResetPasswordToken = await db.passwordResetToken.create({
        data: {
            token,
            email,
            expires
        }
    });

    return ResetPasswordToken;
}

export const generateVerificationToken = async (email: string) => {
    const token = uuidv4();
    const expires = new Date(Date.now() + 30 * 60 * 1000); // Token valid for 30 minutes

    const existingToken = await getVerificationTokenByEmail(email);

    if (existingToken) {
        await db.verificationToken.delete({
            where: {
                id: existingToken.id
            }
        })
    }

    const verficiationToken = await db.verificationToken.create({
        data: {
            token,
            email,
            expires
        }
    });

    return verficiationToken;
}