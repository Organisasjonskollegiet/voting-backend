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

export const ViewState = enumType({
    name: 'ViewState',
    description: `
        LOADING: When the votation is loading for a new votation,
        ONGOING: When the Votation is in process, 
        CLOSED: When the votation has closed and no new votes are allowed,
        ENDED: When the votation has ended, the result will be announced and then switch to LOADING
        `,
    members: ['LOADING', 'ONGOING', 'CLOSED', 'ENDED'],
});
