# Spec Delta

## Purpose

Gives each collaboration a single conversation thread so the two parties can clarify the brief, agree on a schedule, and discuss revisions, with an unread signal and a read-only close once the work is finished.

## ADDED Requirements

### Requirement: One conversation per request, opened with the brief

The system SHALL keep one conversation per request, opened when the request is submitted, and SHALL record the brief as that conversation's first message so both parties can see what was agreed.

#### Scenario: A request is submitted

- **WHEN** a business submits a request with a brief
- **THEN** the request has one conversation holding one message whose body is that brief

#### Scenario: A thread already exists

- **WHEN** a request that already has a conversation is submitted again
- **THEN** the request still has exactly one conversation

### Requirement: A message records its sender, body, and time

The system SHALL record, for every message, the conversation it belongs to, the party that sent it, its text, and the time it was sent, and SHALL return the messages of a thread oldest first.

#### Scenario: A party sends a message

- **WHEN** a party sends a message on its request
- **THEN** one message exists on that request's conversation, naming the sender, with its body and time

#### Scenario: An empty message

- **WHEN** a party tries to send an empty or blank message
- **THEN** the message is refused and none is stored

### Requirement: Chat is open while the request is in progress

The system SHALL let either party send a message while the request is `PENDING` through `DISPUTED`, and SHALL refuse a message on a request that is `COMPLETED`, `CANCELLED`, or `REJECTED`. A role that is not one of the booking's two parties SHALL be refused.

#### Scenario: A party sends while the request is in progress

- **WHEN** a party sends a message on a request whose work is not finished
- **THEN** the message is stored on the conversation

#### Scenario: Sending on a finished request

- **WHEN** a party tries to send a message on a completed or cancelled request
- **THEN** the message is refused and none is stored

#### Scenario: A non-party sends

- **WHEN** a signed-in user who is not a party to the request tries to send a message
- **THEN** the message is refused and none is stored

### Requirement: Read state is tracked per message and cleared for the counterparty

The system SHALL record when a message was read, SHALL let a party mark the messages the other party sent as read, and SHALL derive the unread count from the messages the caller has not read.

#### Scenario: A party opens a thread
- **WHEN** a party opens a thread with unread messages from the other party
- **THEN** those messages are marked read for the caller and the number changed is returned

#### Scenario: The unread badge
- **WHEN** a party's thread has messages the other party sent that the reader has not read
- **THEN** the unread count is the number of those messages

#### Scenario: Reading twice

- **WHEN** a party marks an already-read conversation read again
- **THEN** the change count is zero

### Requirement: A conversation and its messages are readable only by the two parties

The system SHALL let each party read the conversation and the messages on the bookings it is named on, and SHALL return nothing for a caller who is not a party, whether signed in or signed out.

#### Scenario: A party reads its thread

- **WHEN** a signed-in party to a booking opens the chat page
- **THEN** the system returns that booking's conversation and its messages, oldest first

#### Scenario: A non-party reads a thread

- **WHEN** a signed-in user named on neither side requests a booking's conversation or messages
- **THEN** the system returns no rows for that request

#### Scenario: A signed-out visitor reads a thread

- **WHEN** a visitor with no session requests any conversation or message
- **THEN** the system returns no rows for that request
