# ER diagram (renders on GitHub, or paste into https://mermaid.live)

```mermaid
erDiagram
    USER ||--o{ ISSUERECORD : "borrows (student)"
    USER ||--o{ ISSUERECORD : "issues (librarian)"
    BOOK ||--o{ ISSUERECORD : "is borrowed in"

    USER {
        ObjectId _id PK
        string name
        string email UK
        string password "bcrypt hash"
        string role "student | librarian | admin"
        string rollNo
        string refreshToken "SHA-256 hash"
    }
    BOOK {
        ObjectId _id PK
        string title
        string author
        string category "indexed"
        string isbn UK
        number totalCopies
        number availableCopies
    }
    ISSUERECORD {
        ObjectId _id PK
        ObjectId book FK
        ObjectId student FK
        ObjectId issuedBy FK
        date issueDate
        date dueDate
        date returnDate
        string status "issued | returned"
        number fine
        boolean finePaid
    }
```

Indexes: `User.email` (unique), `User.role`, `Book.isbn` (unique), `Book.category`, `Book.{title, author}`, `IssueRecord.{student, status}`, `IssueRecord.{status, dueDate}`.
