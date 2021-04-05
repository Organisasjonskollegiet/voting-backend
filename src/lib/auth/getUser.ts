import { Request } from 'express';
import { verifyToken } from './verifyToken';

export const userFromRequest = async (req: Request) => {
    const token = req.headers['authorization'] || '';
    if (token) {
        // Remove the Bearer part
        const decoded = await verifyToken(token.split(' ')[1]);
        if (!decoded) throw new Error('Could not find a valid token.');
        // Removes auth0 part from auth0|<userId>.
        return decoded.sub.split('|')[1];
    }
    return '';
};
