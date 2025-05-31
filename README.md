# ThinkDrills 🧠

ThinkDrills is an innovative educational platform that generates personalized, themed worksheets for students. It combines academic subjects with students' interests to create engaging learning experiences.

## Features ✨

- **Personalized Learning**: Worksheets tailored to each student's grade level and interests
- **Theme-Based Questions**: Questions incorporate student interests (Space, Animals, Music) into academic subjects
- **Multiple Subjects**: Supports various subjects including:
  - Math
  - Science
  - Social Studies
  - Geography
  - Reading
  - Biology

- **Smart Question Generation**: Automatically generates age-appropriate questions with:
  - Multiple choice options
  - Detailed explanations
  - Interest-themed context
  - Grade-level appropriate difficulty

## Getting Started 🚀

### Prerequisites

- Node.js (v14 or higher)
- PostgreSQL
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/braingym.git
cd braingym
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Set up your environment variables:
```bash
cp .env.example .env
```
Edit `.env` with your database and authentication settings.

4. Set up the database:
```bash
npx prisma migrate dev
```

5. Start the development server:
```bash
npm run dev
# or
yarn dev
```

The application will be available at `http://localhost:3000`.

## Project Structure ��

```
ThinkDrills/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── components/        # Reusable components
│   ├── student/          # Student-specific pages
│   └── parent/           # Parent-specific pages
├── prisma/                # Database schema and migrations
├── public/                # Static assets
└── lib/                   # Shared utilities
```

## Usage 📚

### For Students
1. Log in with student credentials
2. Access personalized dashboard
3. Generate new worksheets based on interests
4. Complete worksheets and track progress

### For Parents
1. Log in with parent account
2. Manage student profiles
3. Set student interests and subjects
4. Monitor student progress

## Technology Stack 💻

- **Frontend**: Next.js, React, TypeScript
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Styling**: Tailwind CSS

## Contributing 🤝

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License 📄

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments 🙏

- Thanks to all contributors who have helped shape ThinkDrills
- Special thanks to educators who provided valuable feedback
- Inspired by the need for engaging, personalized education 