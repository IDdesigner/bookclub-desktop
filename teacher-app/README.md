# Teacher Desktop App

A web-based desktop application for teachers to create, manage, and analyze AI-powered tutoring sessions for students.

## Features (MVP)

- **Book Management**: Create and manage books with public-domain content
- **Chapter Management**: Import text, define learning objectives, and configure AI tutor settings
- **Class Management**: Create classes, manage rosters, and assign chapters
- **Analytics Dashboard**: View student progress, mastery scores, and common misconceptions
- **AI Tutor Integration**: Powered by Supabase Edge Functions and LLM capabilities

## Tech Stack

- **Frontend**: React 18 + Vite + TypeScript
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **State Management**: Zustand + TanStack Query
- **Backend**: Supabase (Auth, Postgres, Storage, Edge Functions)
- **Forms**: React Hook Form

## Project Structure

```
src/
├── components/
│   ├── layout/        # Layout components (Sidebar, Layout)
│   ├── books/         # Book-related components
│   ├── chapters/      # Chapter-related components
│   ├── classes/       # Class management components
│   ├── analytics/     # Analytics components
│   └── common/        # Shared components
├── pages/             # Route pages
├── lib/               # Third-party library configs (Supabase)
├── hooks/             # Custom React hooks
├── stores/            # Zustand stores
├── types/             # TypeScript types and interfaces
├── utils/             # Utility functions
└── config/            # App configuration
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Supabase account and project

### Installation

1. Clone the repository and navigate to the teacher-app folder

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Add your Supabase credentials:
```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Start the development server:
```bash
npm run dev
```

5. Open your browser to `http://localhost:5173`

## Supabase Setup

### Database Tables

You'll need to create the following tables in your Supabase project. See the `Knowledge Bank/Teacher_Desktop_App_MVP_Spec.md` for detailed schema information:

- `books`
- `chapters`
- `objectives`
- `rubrics`
- `chapter_chunks`
- `classes`
- `class_students`
- `assignments`
- `tutor_sessions`
- `tutor_turns`
- `turn_grades`
- `mastery_snapshots`

### Row Level Security (RLS)

Enable RLS on all tables and configure policies so that:
- Teachers can only access their own classes and students
- Students can only access their own sessions and feedback
- Chunk tables are protected from direct student access

### Edge Functions

Create the following Supabase Edge Functions:
- `ingestChapterText`: Chunk and embed chapter text
- `startTutorSession`: Initialize a new tutoring session
- `tutorNextTurn`: Process student messages and generate AI responses
- `getTeacherAnalytics`: Aggregate mastery and analytics data

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint

## Next Steps

1. Set up Supabase database schema
2. Configure authentication flows
3. Implement book creation and text ingestion
4. Build chapter editor with objectives and rubrics
5. Create class management interface
6. Develop analytics dashboard
7. Integrate AI tutor functionality

## Contributing

This is an MVP project. Refer to the specification document in `Knowledge Bank/Teacher_Desktop_App_MVP_Spec.md` for implementation details.

## License

MIT
