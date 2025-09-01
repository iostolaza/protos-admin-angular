describe('Contacts Component', () => {
  beforeEach(() => {
    // Mock Amplify Auth response
    cy.intercept('POST', '**/oauth2/token', {
      statusCode: 200,
      body: { access_token: 'mock-token', id_token: 'mock-id-token', userId: 'test-sub' },
    }).as('authRequest');

    // Mock user data API call
    cy.intercept('POST', 'https://k4yq5rxwurbq3gotczvoexu4ya.appsync-api.us-west-1.amazonaws.com/graphql', (req) => {
      if (req.body.operationName === 'ListUsers') {
        req.reply({
          statusCode: 200,
          body: {
            data: {
              listUsers: {
                items: [
                  {
                    id: 'user1',
                    firstName: 'Test',
                    lastName: 'User',
                    username: 'testuser',
                    email: 'test@example.com',
                    status: 'online',
                    profileImageKey: '',
                  },
                ],
              },
            },
          },
        });
      }
    }).as('listUsers');

    // Visit the contacts page
    cy.visit('/contacts');
    cy.wait('@authRequest');
    cy.wait('@listUsers');
  });

  it('searches, adds, deletes user', () => {
    // Mock search API response
    cy.intercept('POST', 'https://k4yq5rxwurbq3gotczvoexu4ya.appsync-api.us-west-1.amazonaws.com/graphql', (req) => {
      if (req.body.operationName === 'ListUsers' && req.body.variables.filter.or) {
        req.reply({
          statusCode: 200,
          body: {
            data: {
              listUsers: {
                items: [
                  {
                    id: 'user2',
                    firstName: 'Search',
                    lastName: 'Result',
                    username: 'searchuser',
                    email: 'search@example.com',
                    status: 'online',
                    profileImageKey: '',
                  },
                ],
              },
            },
          },
        });
      }
    }).as('searchUsers');

    // Mock add contact API
    cy.intercept('POST', 'https://k4yq5rxwurbq3gotczvoexu4ya.appsync-api.us-west-1.amazonaws.com/graphql', (req) => {
      if (req.body.operationName === 'CreateFriend') {
        req.reply({ statusCode: 200, body: { data: { createFriend: { id: 'friend1', userId: 'test-sub', friendId: 'user2', createdAt: new Date().toISOString() } } } });
      }
    }).as('addContact');

    // Mock delete contact API
    cy.intercept('POST', 'https://k4yq5rxwurbq3gotczvoexu4ya.appsync-api.us-west-1.amazonaws.com/graphql', (req) => {
      if (req.body.operationName === 'DeleteFriend') {
        req.reply({ statusCode: 200, body: { data: { deleteFriend: { id: 'friend1' } } } });
      }
    }).as('deleteContact');

    cy.get('input[placeholder="Search by name or email..."]').type('test');
    cy.get('button').contains('Search').click();
    cy.wait('@searchUsers');
    cy.get('li').should('exist'); // Verify search results
    cy.get('li').first().find('button').click(); // Add contact
    cy.wait('@addContact');
    cy.get('table').find('tr').should('have.length.greaterThan', 0); // Verify contact added
    cy.get('table').find('tr').first().find('button').click(); // Delete contact
    cy.wait('@deleteContact');
    cy.get('table').find('tr').should('have.length', 0); // Verify contact removed
  });

  it('displays user profile details', () => {
    // Mock user profile API
    cy.intercept('POST', 'https://k4yq5rxwurbq3gotczvoexu4ya.appsync-api.us-west-1.amazonaws.com/graphql', (req) => {
      if (req.body.operationName === 'ListUsers') {
        req.reply({
          statusCode: 200,
          body: {
            data: {
              listUsers: {
                items: [
                  {
                    id: 'test-sub',
                    firstName: 'First Name',
                    lastName: 'Last Name',
                    username: 'testuser',
                    email: 'test@example.com',
                    accessLevel: 'basic',
                    profileImageKey: '',
                  },
                ],
              },
            },
          },
        });
      }
    }).as('getUser');

    cy.visit('/messages'); // Updated to messages route where UserProfileComponent is used
    cy.wait('@authRequest');
    cy.wait('@getUser');
    cy.get('.user-profile').should('contain', 'First Name Last Name');
    cy.get('.user-profile').should('contain', 'test@example.com');
    cy.get('.user-profile').should('contain', 'basic');
    cy.get('img[alt="Profile"]').should('have.attr', 'src').and('include', 'avatar-default.svg');
  });
});
