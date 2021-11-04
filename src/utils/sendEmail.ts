import { Meeting, Role } from '@prisma/client';
import moment from 'moment';
import { ParticipantOrInviteType } from '../schema/meeting';

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
        .setFrom('notification@vedtatt.no')
        .setRecipients(recipient)
        .setSubject('Du er invitert til et nytt møte.')
        .setHtml(
            `<p>Hei</p><p>Du er lagt til som ${roleToText.get(role)} på <b>${meeting.title}</b>. Møtet stater ${moment(
                meeting.startTime
            ).format('dddd DD.MM.YYYY')} kl. ${moment(meeting.startTime).format('HH:MM')}. ${
                !userIsRegistered
                    ? `Vennligst registrer deg på <a href="${process.env.FRONTEND_URL}">vedtatt.no</a> i forkant av møtet. Du vil finne møtet under "Mine møter".`
                    : `Møtet finner du under "Mine møter" på <a href="${process.env.FRONTEND_URL}">vedtatt.no</a>.`
            }`
        )
        .setText('Du er lagt til i møte.');
    return emailParams;
};

const sendEmail = async (participants: ParticipantOrInviteType[], userIsRegistered: boolean, meeting: Meeting) => {
    try {
        const mailersend = new MailerSend({
            api_key: process.env.EMAIL_API_KEY,
        });

        const promises: Promise<string>[] = [];

        participants.forEach((participant) => {
            const emailParams = createEmail(participant.email, participant.role, meeting, userIsRegistered);
            promises.push(
                new Promise(async (resolve, reject) => {
                    const response = await mailersend.send(emailParams);
                    if (response.status !== 202) reject('Could not send email.');
                    resolve(participant.email);
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
