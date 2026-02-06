
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://savmpmnytfdqvhxjrmhf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhdm1wbW55dGZkcXZoeGpybWhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzODQ5NjUsImV4cCI6MjA4NTk2MDk2NX0.Eke9TUcBYxCF-kGJzTood5JZFyJAv_hV19z8oyAAjT8';

export const supabase = createClient(supabaseUrl, supabaseKey);
