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
