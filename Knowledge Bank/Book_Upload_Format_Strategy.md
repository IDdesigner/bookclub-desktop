# Book Upload & Format Strategy

## Overview
This document outlines the strategy for handling book uploads and page/chapter selection in assignments.

## Format Options Analyzed

### Option 1: Plain Text with Metadata (Recommended for MVP) ✅
- **Format**: Plain text file (.txt) or markdown (.md)
- **Page Definition**: Virtual pages based on character/word count
  - Example: Every 2000 characters = 1 "page"
  - Or: Every 250 words = 1 "page"
- **Pros**:
  - Simple, universal, easy to parse
  - No special libraries needed
  - Works with any text content
  - Can paste directly or upload files
- **Cons**:
  - Page numbers are approximations
  - Not tied to physical book page numbers

### Option 2: PDF with Native Pages
- **Format**: PDF files
- **Page Definition**: Uses actual PDF page numbers
- **Pros**:
  - Exact page references
  - Matches physical books if scanned properly
  - Professional format
- **Cons**:
  - Need PDF parsing library (pdf.js, pdf-parse)
  - Harder to extract clean text
  - OCR quality varies for scanned books
  - More complex implementation

### Option 3: EPUB with Chapter-Based Sections
- **Format**: EPUB (e-book format)
- **Page Definition**: No fixed pages, use chapters/sections instead
- **Pros**:
  - Standard e-book format
  - Maintains book structure
  - Can extract chapters automatically
- **Cons**:
  - No traditional page numbers
  - Needs EPUB parser library
  - More complex than plain text

### Option 4: Structured JSON/Database (Most Flexible)
- **Format**: JSON with chapters, sections, and text chunks
```json
{
  "title": "To Kill a Mockingbird",
  "author": "Harper Lee",
  "chapters": [
    {
      "number": 1,
      "title": "Chapter 1",
      "sections": [
        {
          "page": 1,
          "startWord": 0,
          "endWord": 250,
          "text": "..."
        },
        {
          "page": 2,
          "startWord": 251,
          "endWord": 500,
          "text": "..."
        }
      ]
    }
  ]
}
```
- **Pros**:
  - Complete control over structure
  - Can map to actual book pages
  - Easy to query specific sections
  - Best for AI processing
- **Cons**:
  - Requires manual structuring or conversion tool
  - More complex initial setup

## Recommended MVP Approach

**Start with Option 1 (Plain Text) + Option 4 (Structured Storage)**

### Upload Flow:
1. Teacher uploads a **plain text file** or **pastes text directly**
2. System automatically processes:
   - Detects chapters (by headers like "Chapter 1", "CHAPTER ONE", etc.)
   - Chunks text into manageable sections (300-500 words each)
   - Generates virtual "page" numbers
   - Creates embeddings for AI retrieval
3. Store in database as:
   - Book metadata (title, author, source)
   - Chapters (number, title, word count)
   - Text chunks with:
     - Chunk index
     - Virtual page number
     - Word range
     - Character range
     - Vector embedding
     - Raw text

### Assignment Selection Options:

Instead of arbitrary page numbers, offer teachers multiple selection methods:

#### Option A: Chapter-Based (Simplest)
```
Select content:
☐ Entire book
☑ Specific chapters: [Chapters 1-3]
☐ Custom range
```

#### Option B: Section-Based
```
Select sections:
☐ First 5 sections
☐ Sections 10-15
☐ Custom
```

#### Option C: Word/Character Range
```
Word range: [Start: 0] to [End: 5000]
(Approximately X pages)
```

#### Option D: Hybrid (Recommended)
```
Content Selection:
- Book: [To Kill a Mockingbird ▼]
- Chapters: [1 ▼] to [3 ▼]
- Or paste text directly
```

## Database Schema for Books

```sql
-- Books table
CREATE TABLE books (
  id UUID PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  author VARCHAR(255),
  source VARCHAR(255), -- "uploaded", "pasted", "project_gutenberg"
  public_domain_bool BOOLEAN DEFAULT true,
  total_words INTEGER,
  total_chapters INTEGER,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Chapters table
CREATE TABLE chapters (
  id UUID PRIMARY KEY,
  book_id UUID REFERENCES books(id) ON DELETE CASCADE,
  number INTEGER NOT NULL,
  title VARCHAR(500),
  word_count INTEGER,
  char_count INTEGER,
  start_position INTEGER, -- word position in full book
  end_position INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Text chunks for AI retrieval
CREATE TABLE chapter_chunks (
  id UUID PRIMARY KEY,
  chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  virtual_page INTEGER, -- calculated page number
  word_start INTEGER,
  word_end INTEGER,
  content TEXT NOT NULL,
  embedding VECTOR(1536), -- for semantic search
  token_count INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_chapter_chunks_chapter ON chapter_chunks(chapter_id);
CREATE INDEX idx_chapter_chunks_embedding ON chapter_chunks
  USING ivfflat (embedding vector_cosine_ops);
```

## Processing Pipeline

### Step 1: Upload/Paste
- Teacher provides text via upload or paste
- System stores raw text temporarily

### Step 2: Chapter Detection
```typescript
function detectChapters(text: string): Chapter[] {
  const chapterPatterns = [
    /^Chapter\s+(\d+|[IVXLCDM]+)[\s:]/mi,
    /^CHAPTER\s+(\d+|[IVXLCDM]+)[\s:]/mi,
    /^\d+\.\s+/m, // "1. Title"
  ];

  // Split text into chapters
  // Return array of { number, title, text }
}
```

### Step 3: Chunking
```typescript
function chunkText(chapter: Chapter): Chunk[] {
  const WORDS_PER_CHUNK = 400;
  const words = chapter.text.split(/\s+/);

  const chunks = [];
  for (let i = 0; i < words.length; i += WORDS_PER_CHUNK) {
    chunks.push({
      chunk_index: chunks.length,
      virtual_page: Math.floor(i / 250) + 1, // 250 words per "page"
      word_start: i,
      word_end: Math.min(i + WORDS_PER_CHUNK, words.length),
      content: words.slice(i, i + WORDS_PER_CHUNK).join(' '),
    });
  }

  return chunks;
}
```

### Step 4: Generate Embeddings
```typescript
async function generateEmbeddings(chunks: Chunk[]): Promise<void> {
  for (const chunk of chunks) {
    // Call OpenAI embeddings API
    const embedding = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: chunk.content,
    });

    chunk.embedding = embedding.data[0].embedding;
    chunk.token_count = encoding.encode(chunk.content).length;
  }
}
```

## Assignment Content Selection

When creating an assignment, the form will:

1. Show dropdown of uploaded books
2. For selected book, show available chapters
3. Allow selection of:
   - Full book
   - Specific chapters (1-3)
   - Or paste custom text (bypasses book selection)

The selected content will be used to:
- Generate AI tutor questions
- Provide context for answer evaluation
- Enable semantic search for evidence verification

## Future Enhancements

### Phase 2: PDF Support
- Add PDF upload
- Extract text using pdf.js
- Map PDF pages to chunks
- Allow "Page 1-50" selection matching actual PDF pages

### Phase 3: Project Gutenberg Integration
- Import books directly from Project Gutenberg
- Pre-process and chunk automatically
- Build a library of public domain books

### Phase 4: Advanced Features
- Automatic chapter detection improvement
- Support for poetry (line-based instead of word-based)
- Support for plays (scene-based)
- Custom chunking strategies per book type

## Implementation Priority

**MVP (Phase 1):**
1. ✅ Plain text paste (already implemented)
2. Plain text file upload
3. Automatic chapter detection
4. Chunk generation and storage
5. Chapter-based selection in assignments

**Later:**
- PDF support
- EPUB support
- Project Gutenberg integration
- Advanced chunking strategies

## Notes

- Start simple: Plain text with automatic chunking
- Virtual page numbers are acceptable for MVP
- Teachers can always paste exact text they want students to read
- Focus on AI functionality (questions, grading) over format perfection
- Can add more sophisticated formats later based on user feedback
