/**
 * 🔒 ENVIRONMENT VARIABLES VALIDATION
 * Validates required environment variables at startup
 * Prevents runtime crashes from missing configuration
 */

function validateEnv() {
    // Only validate on server-side
    if (typeof window !== 'undefined') {
        return; // Skip validation on client
    }

    const required = [
        'DATABASE_URL',
        'NEXTAUTH_SECRET',
        'NEXTAUTH_URL',
    ];
    
    const optional = [
        'DIRECT_URL',
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    ];
    
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
        console.error('❌ Missing required environment variables:');
        missing.forEach(key => console.error(`   - ${key}`));
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
    
    const missingOptional = optional.filter(key => !process.env[key]);
    if (missingOptional.length > 0) {
        console.warn('⚠️  Missing optional environment variables:');
        missingOptional.forEach(key => console.warn(`   - ${key}`));
    }
    
    console.log('✅ Environment variables validated');
}

// Run validation on import (server-side only)
try {
    validateEnv();
} catch (error) {
    // Don't throw during module import, just log
    if (typeof window === 'undefined') {
        console.error('Environment validation failed:', error);
    }
}

export { validateEnv };
