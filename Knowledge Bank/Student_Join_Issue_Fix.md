# Student Join Issue - Fix Guide

## Problem
Students are joining through the mobile app but not appearing in the teacher's dashboard roster.

## Root Cause
The mobile app relies on a **database trigger** and the `auth_user_id` column in the students table to automatically create student records when they sign up. This SQL hasn't been run in your Supabase database yet.

## Solution

### Run the Mobile App Setup SQL

You need to run the SQL file located at:
```
BookClub_MobileApp/student-app/supabase-setup.sql
```

This file does three critical things:

### 1. Adds `auth_user_id` Column to Students Table
```sql
ALTER TABLE students
ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS students_auth_user_id_unique
ON students(auth_user_id);
```

This links student records to Supabase Auth users.

### 2. Creates Database Trigger
```sql
CREATE OR REPLACE FUNCTION public.handle_new_student_user()
RETURNS TRIGGER AS $$
DECLARE
  student_record_id UUID;
  class_id_from_metadata UUID;
BEGIN
  class_id_from_metadata := (NEW.raw_user_meta_data->>'class_id')::UUID;

  -- Create student record
  INSERT INTO public.students (name, auth_user_id)
  VALUES (
    NEW.raw_user_meta_data->>'name',
    NEW.id
  )
  RETURNING id INTO student_record_id;

  -- Join student to class
  IF class_id_from_metadata IS NOT NULL THEN
    INSERT INTO public.class_students (class_id, student_id)
    VALUES (class_id_from_metadata, student_record_id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_student_user();
```

This trigger automatically:
- Creates a student record in the `students` table when a user signs up
- Extracts the student's name from signup metadata
- Joins the student to the class using the class_id from signup metadata

### 3. Sets Up Row Level Security (RLS) Policies
The file also includes comprehensive RLS policies so:
- Students can only see their own data
- Teachers can see all students in their classes
- Students can join classes
- Teachers can manage their class enrollments

## How Student Joining Works

When a student signs up in the mobile app:

1. **User enters info** in the join-class screen:
   - Email
   - Password
   - Name
   - Invite code (XXXX-XXXX format)

2. **App validates invite code** by querying the classes table

3. **App creates Supabase auth user** with metadata:
   ```typescript
   supabase.auth.signUp({
     email: email,
     password: password,
     options: {
       data: {
         name: "Student Name",
         class_id: "uuid-of-class"
       }
     }
   })
   ```

4. **Database trigger fires automatically**:
   - Extracts name and class_id from user metadata
   - Creates student record in students table
   - Creates class_students junction record

5. **Student appears in teacher's roster** immediately!

## Steps to Fix

1. Open your Supabase Dashboard
2. Go to SQL Editor
3. Copy the entire contents of `BookClub_MobileApp/student-app/supabase-setup.sql`
4. Paste and run it
5. Verify success:
   - Check that students table has `auth_user_id` column
   - Check that trigger `on_auth_user_created` exists
   - Check that function `handle_new_student_user()` exists

## After Running SQL

1. Have a student sign up through the mobile app
2. Refresh the teacher's class details page
3. Student should now appear in the roster!

## Testing

To verify everything works:

```sql
-- Check if auth_user_id column exists
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'students'
AND column_name = 'auth_user_id';

-- Check if trigger exists
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- Check if function exists
SELECT routine_name
FROM information_schema.routines
WHERE routine_name = 'handle_new_student_user';
```

## Important Notes

- The trigger only works for NEW signups after you run this SQL
- Existing auth users won't get student records automatically
- If you have existing test users, you may need to manually create student records for them or have them sign up again with new emails
- The invite code can be stored with or without the dash (both XXXXXXXX and XXXX-XXXX formats work)

## Future Considerations

If you want teachers to manually add students (without requiring student signup), you could:
1. Add a "Add Student" button in the teacher app
2. Create a form to enter student name and email
3. Manually insert into students table and class_students junction
4. Optionally send invite email to student to set up their password

But the current mobile app flow (student self-signup with invite code) is the primary intended method.
