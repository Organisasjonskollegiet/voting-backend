import { Invite, Meeting, Role, User } from '@prisma/client';
import moment from 'moment';

const Recipient = require('mailersend').Recipient;
const EmailParams = require('mailersend').EmailParams;
const MailerSend = require('mailersend');

moment.locale('nb');

const roleToText = new Map([
    [Role.ADMIN, 'administrator'],
    [Role.COUNTER, 'teller'],
    [Role.PARTICIPANT, 'deltaker'],
]);

const createEmail = (email: string, role: Role, meeting: Meeting, userIsRegistered: boolean) => {
    const recipient = [new Recipient(email)];
    const emailParams = new EmailParams()
        .setFrom('vedtatt@organisasjonskollegiet.no')
        .setRecipients(recipient)
        .setSubject('Du er invitert til et nytt møte.')
        .setHtml(
            `<p>Hei</p><p>Du er lagt til som ${roleToText.get(role)} på <b>${meeting.title}</b>. Møtet stater ${moment(
                meeting.startTime
            ).format('dddd DD.MM.YYYY')} kl. ${moment(meeting.startTime).format('HH:MM')}. ${
                !userIsRegistered
                    ? `Vennligst registrer deg <a href="${process.env.FRONTEND_URL}">her</a> i forkant av møtet`
                    : ''
            }. Du vil finne møtet under "Mine møter".`
        )
        .setText('Du er lagt til i møte.');
    return emailParams;
};

const sendEmail = async (invites: Invite[], participants: { role: Role; user: User }[], meeting: Meeting) => {
    try {
        const mailersend = new MailerSend({
            api_key: process.env.EMAIL_API_KEY,
        });

        const promises: Promise<string>[] = [];

        invites.forEach((invite) => {
            const emailParams = createEmail(invite.email, invite.role, meeting, false);
            promises.push(
                new Promise(async (resolve, reject) => {
                    const response = await mailersend.send(emailParams);
                    if (response.status !== 202) reject('Could not send email.');
                    resolve(invite.email);
                })
            );
        });

        participants.forEach((participant) => {
            const emailParams = createEmail(participant.user.email, participant.role, meeting, true);
            promises.push(
                new Promise(async (resolve, reject) => {
                    const response = await mailersend.send(emailParams);
                    if (response.status !== 202) reject('Could not send email.');
                    resolve(participant.user.email);
                })
            );
        });

        const resolved = await Promise.all(promises);
        return resolved;
    } catch (error) {
        console.log(error);
    }
};

export default sendEmail;
