import { enumType } from 'nexus';

export const Role = enumType({
    name: 'Role',
    members: ['ADMIN', 'PARTICIPANT', 'COUNTER'],
});

export const MajorityType = enumType({
    name: 'MajorityType',
    members: ['QUALIFIED', 'SIMPLE'],
});

export const Status = enumType({
    name: 'Status',
    members: ['UPCOMING', 'ONGOING', 'ENDED'],
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
