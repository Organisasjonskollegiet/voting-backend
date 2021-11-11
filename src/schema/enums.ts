import { enumType } from 'nexus';

export const Role = enumType({
    name: 'Role',
    members: ['ADMIN', 'PARTICIPANT', 'COUNTER'],
});

export const VotationType = enumType({
    name: 'VotationType',
    members: ['QUALIFIED', 'SIMPLE', 'STV'],
});

export const MeetingStatus = enumType({
    name: 'MeetingStatus',
    members: ['UPCOMING', 'ONGOING', 'ENDED'],
});

export const VotationStatus = enumType({
    name: 'VotationStatus',
    members: ['UPCOMING', 'OPEN', 'CHECKING_RESULT', 'PUBLISHED_RESULT', 'INVALID'],
});
