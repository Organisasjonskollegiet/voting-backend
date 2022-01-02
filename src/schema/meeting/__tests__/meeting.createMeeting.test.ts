import { createTestContext } from '../../../lib/tests/testContext';
import { gql } from 'graphql-request';
const ctx = createTestContext();

const createMeetingVariables = {
    meeting: {
        title: 'title',
        organization: 'Organisasjonskollegiet',
        startTime: '2021-04-13T11:45:43.000Z',
        description: 'description',
        allowSelfRegistration: false,
    },
};

it('should create a meeting successfully', async () => {
    const createMeeting = await ctx.client.request(
        gql`
            mutation CreateMeeting($meeting: CreateMeetingInput!) {
                createMeeting(meeting: $meeting) {
                    title
                    organization
                    description
                    startTime
                    allowSelfRegistration
                    owner {
                        id
                    }
                    participants {
                        role
                        isVotingEligible
                        user {
                            id
                        }
                    }
                }
            }
        `,
        createMeetingVariables
    );
    const meeting = createMeeting.createMeeting;
    expect(meeting).toEqual({
        ...createMeetingVariables.meeting,
        owner: {
            id: ctx.userId,
        },
        participants: [
            {
                role: 'ADMIN',
                isVotingEligible: true,
                user: {
                    id: ctx.userId,
                },
            },
        ],
    });
});
