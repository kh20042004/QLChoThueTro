/**
 * Script to delete all properties from database
 */

const mongoose = require('mongoose');
const Property = require('./src/models/Property');
require('dotenv').config();

const deleteAllProperties = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/homerent', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        console.log('✅ Connected to MongoDB');

        // Count properties before deletion
        const countBefore = await Property.countDocuments();
        console.log(`📊 Found ${countBefore} properties in database`);

        if (countBefore === 0) {
            console.log('ℹ️  Database is already empty');
            process.exit(0);
        }

        // Ask for confirmation
        console.log('\n⚠️  WARNING: This will delete ALL properties from the database!');
        console.log('💡 Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');

        // Wait 5 seconds before deletion
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Delete all properties
        const result = await Property.deleteMany({});
        
        console.log(`✅ Successfully deleted ${result.deletedCount} properties`);

        // Verify deletion
        const countAfter = await Property.countDocuments();
        console.log(`📊 Properties remaining: ${countAfter}`);

        if (countAfter === 0) {
            console.log('✨ Database is now empty!');
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error deleting properties:', error);
        process.exit(1);
    }
};

// Run the script
deleteAllProperties();
