// backend/utils/createNotificationsTables.js
const db = require('../config/db');

const createNotificationsTables = async () => {
  try {
    // Create notifications table
    await db.promise().query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type ENUM('info', 'success', 'warning', 'error') DEFAULT 'info',
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id),
        INDEX idx_is_read (is_read),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    console.log('✅ Notifications table created successfully');

    // Insert sample notifications for existing users
    const [users] = await db.promise().query('SELECT id FROM users LIMIT 5');
    
    for (const user of users) {
      await db.promise().query(`
        INSERT INTO notifications (user_id, title, message, type) VALUES
        (?, 'Selamat Datang', 'Sistem notifikasi realtime telah aktif', 'info'),
        (?, 'Data Ter-update', 'Data summary telah diperbarui', 'success'),
        (?, 'Backup Berhasil', 'Backup database berhasil dilakukan', 'success')
      `, [user.id, user.id, user.id]);
    }

    console.log('✅ Sample notifications created');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating tables:', error);
    process.exit(1);
  }
};

createNotificationsTables();
