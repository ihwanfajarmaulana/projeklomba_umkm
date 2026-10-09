# rls-access-control Specification

## Purpose
Define which rows each kind of caller may read from the Kolab.id database: public catalog data for everyone, a user's own profile for that user, and a booking's records for the two parties named on it, while everything belonging to capabilities that have not shipped stays closed.

## Requirements

### Requirement: Public catalog data is readable without an account

The system SHALL allow any visitor, whether signed in or not, to read creator catalog data: categories, creators, creator packages, UMKM business records, and published reviews.

#### Scenario: Signed-out visitor reads the creator catalog

- **WHEN** a visitor with no session opens the creator list or a creator's public profile
- **THEN** the system returns that creator's catalog data, including packages, city, category, rating, and the reviews written by UMKM

#### Scenario: Signed-out visitor sees landing page totals

- **WHEN** a visitor with no session opens the landing page and the system computes totals such as the number of creators and the number of UMKM
- **THEN** those totals are computed over every catalog record, not only over the records that visitor may read individually

#### Scenario: Signed-in user reads the same catalog as a visitor

- **WHEN** a signed-in UMKM or creator opens the catalog
- **THEN** the system returns the same catalog content it returns to a signed-out visitor

### Requirement: A user reads only their own profile

The system SHALL restrict profile records so that a signed-in user can read their own profile and no other user's profile.

#### Scenario: User reads their own profile

- **WHEN** a signed-in user reads their own profile record
- **THEN** the system returns that record, including their role and the business or creator row they are linked to

#### Scenario: User requests another user's profile

- **WHEN** a signed-in user requests the profile record belonging to a different user
- **THEN** the system returns no rows for that request

#### Scenario: Signed-out visitor requests a profile

- **WHEN** a visitor with no session requests any profile record
- **THEN** the system returns no rows for that request

### Requirement: Booking data is readable only by its two parties

The system SHALL restrict a booking, and every record that belongs to that booking, to the UMKM and the creator named on it. This covers the delivered content versions, the revision requests, the payment record, and the booking's event timeline.

#### Scenario: UMKM reads a booking they submitted

- **WHEN** a signed-in UMKM reads a booking on which they are the named party
- **THEN** the system returns that booking together with its content versions, revision requests, payment record, and event timeline

#### Scenario: Creator reads a booking addressed to them

- **WHEN** a signed-in creator reads a booking on which they are the named party
- **THEN** the system returns that booking together with its content versions, revision requests, payment record, and event timeline

#### Scenario: Unrelated signed-in user requests the booking

- **WHEN** a signed-in user who is not a party to a booking requests that booking
- **THEN** the system returns no rows for that request

#### Scenario: Unrelated signed-in user requests a booking's child record directly

- **WHEN** a signed-in user who is not a party to a booking requests one of that booking's content versions, revision requests, payment record, or timeline events directly by identifier
- **THEN** the system returns no rows for that request

#### Scenario: Signed-out visitor requests a booking

- **WHEN** a visitor with no session requests any booking or any of its content versions, revision requests, payment record, or timeline events
- **THEN** the system returns no rows for that request

#### Scenario: Admin account that is not a party requests the booking

- **WHEN** a signed-in user whose role is admin, but who is not named on the booking, requests that booking or its records
- **THEN** the system returns no rows, because administrative read access is not granted by role alone

### Requirement: Data for capabilities that have not shipped is not readable

The system SHALL return no rows for dispute, dispute information, and notification records, because the capabilities that own that data are not part of the current scope and no access is granted to them yet. Records whose capability has already shipped — settlement offers, conversations, and messages — are read under their own party-scoped policies instead.

#### Scenario: Party requests their booking's conversation

- **WHEN** a signed-in party to a booking requests the conversation or messages belonging to that booking
- **THEN** the system returns them under the chat capability's party-scoped policy

#### Scenario: Party requests dispute, offer, or notification records

- **WHEN** a signed-in user requests dispute, dispute information, settlement offer, or notification records
- **THEN** the settlement offers the user is a party to are returned under the offer policy, while disputes, dispute information, and notifications return no rows for that request

### Requirement: Writes are not accepted from the browser

The system SHALL reject every insert, update, and delete that is attempted directly from the browser using the browser-exposed database key, so that all writes are performed server-side.

#### Scenario: Browser attempts to insert a booking

- **WHEN** a browser session attempts to insert a booking using the browser-exposed database key
- **THEN** the database rejects the write and no booking is created

#### Scenario: Browser attempts to change a booking's status

- **WHEN** a browser session attempts to update the status of an existing booking using the browser-exposed database key
- **THEN** the database rejects the write and the booking's status is unchanged

#### Scenario: Browser attempts to insert a message or a review

- **WHEN** a browser session attempts to insert a chat message or a review using the browser-exposed database key
- **THEN** the database rejects the write and no message or review is created
