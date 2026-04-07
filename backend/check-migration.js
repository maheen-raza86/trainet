import supabase from './src/config/supabaseClient.js';

async function checkMigration() {
  try {
    console.log('Checking if reset token columns exist...');
    
    // Check if columns exist by trying to select them
    const { data, error } = await supabase
      .from('profiles')
      .select('reset_token, reset_token_expires')
      .limit(1);
    
    if (error) {
      if (error.message.includes('column') && error.message.includes('does not exist')) {
        console.log('❌ Reset token columns do not exist. Need to run migration.');
        
        // Try to add the columns directly
        console.log('Attempting to add columns...');
        
        const { error: alterError1 } = await supabase.rpc('exec_sql', {
          sql: 'ALTER TABLE profiles ADD COLUMN IF NOT EXISTS reset_token TEXT;'
        });
        
        if (alterError1) {
          console.error('Failed to add reset_token column:', alterError1);
        } else {
          console.log('✓ Added reset_token column');
        }
        
        const { error: alterError2 } = await supabase.rpc('exec_sql', {
          sql: 'ALTER TABLE profiles ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMP WITH TIME ZONE;'
        });
        
        if (alterError2) {
          console.error('Failed to add reset_token_expires column:', alterError2);
        } else {
          console.log('✓ Added reset_token_expires column');
        }
        
        // Add indexes
        const { error: indexError1 } = await supabase.rpc('exec_sql', {
          sql: 'CREATE INDEX IF NOT EXISTS idx_profiles_reset_token ON profiles(reset_token) WHERE reset_token IS NOT NULL;'
        });
        
        if (indexError1) {
          console.error('Failed to add reset_token index:', indexError1);
        } else {
          console.log('✓ Added reset_token index');
        }
        
        const { error: indexError2 } = await supabase.rpc('exec_sql', {
          sql: 'CREATE INDEX IF NOT EXISTS idx_profiles_reset_token_expires ON profiles(reset_token_expires) WHERE reset_token_expires IS NOT NULL;'
        });
        
        if (indexError2) {
          console.error('Failed to add reset_token_expires index:', indexError2);
        } else {
          console.log('✓ Added reset_token_expires index');
        }
        
        console.log('Migration completed!');
        
      } else {
        console.error('Unexpected error:', error);
      }
    } else {
      console.log('✓ Reset token columns already exist!');
    }
    
  } catch (error) {
    console.error('Error checking migration:', error);
  }
}

checkMigration();