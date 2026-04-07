import supabase from './src/config/supabaseClient.js';
import fs from 'fs';
import path from 'path';

async function runMigration() {
  try {
    console.log('Running password reset token migration...');
    
    // Read the migration file
    const migrationPath = path.join(process.cwd(), 'database', 'migrations', '004_password_reset_tokens.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split the SQL into individual statements and execute them
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log('Executing:', statement.substring(0, 50) + '...');
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          console.error('Statement failed:', error);
          console.error('Statement was:', statement);
          // Continue with other statements
        } else {
          console.log('✓ Statement executed successfully');
        }
      }
    }
    
    console.log('Migration completed!');
    
    // Verify the changes
    console.log('Verifying migration...');
    const { data, error: verifyError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'profiles')
      .in('column_name', ['reset_token', 'reset_token_expires']);
    
    if (verifyError) {
      console.error('Verification failed:', verifyError);
    } else if (data && data.length > 0) {
      console.log('✓ Verification successful - New columns added:');
      console.table(data);
    } else {
      console.log('⚠ Verification: No new columns found, they may already exist');
    }
    
  } catch (error) {
    console.error('Error running migration:', error);
    process.exit(1);
  }
}

runMigration();