import { Request } from 'express';
import { verifyToken } from './verifyToken';

export const userFromRequest = async (req: Request) => {
    const token = req.cookies['jwt'] || '';
    if (token) {
        const decoded = await verifyToken(token);
        if (!decoded) throw new Error('Could not find a valid token.');
        // Removes auth0 part from auth0|<userId>.
        return decoded.sub.split('|')[1];
    }
    return null;
};
