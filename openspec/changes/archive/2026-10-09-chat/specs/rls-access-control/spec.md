# Spec Delta

## MODIFIED Requirements

### Requirement: Data for capabilities that have not shipped is not readable

The system SHALL return no rows for dispute, dispute information, and notification records, because the capabilities that own that data are not part of the current scope and no access is granted to them yet. Records whose capability has already shipped — settlement offers, conversations, and messages — are read under their own party-scoped policies instead.

#### Scenario: Party requests their booking's conversation

- **WHEN** a signed-in party to a booking requests the conversation or messages belonging to that booking
- **THEN** the system returns them under the chat capability's party-scoped policy

#### Scenario: Party requests dispute, offer, or notification records

- **WHEN** a signed-in user requests dispute, dispute information, settlement offer, or notification records
- **THEN** the settlement offers the user is a party to are returned under the offer policy, while disputes, dispute information, and notifications return no rows for that request
