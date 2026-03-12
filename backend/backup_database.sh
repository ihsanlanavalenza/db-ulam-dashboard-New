#!/bin/bash

# ==============================================
# Automatic Database Backup Script
# Untuk Dashboard MBU - ULaMM
# ==============================================

# Configuration
DB_USER="root"
DB_PASS="Rehan2003."
DB_NAME="db_ulaam"
BACKUP_DIR="/Users/macbook/Documents/WORK /Raihan/dashboard-mbu/backend/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_${DB_NAME}_${DATE}.sql"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "========================================"
echo "Database Backup Script"
echo "========================================"
echo ""

# Create backup directory if not exists
if [ ! -d "$BACKUP_DIR" ]; then
    echo -e "${YELLOW}Creating backup directory...${NC}"
    mkdir -p "$BACKUP_DIR"
fi

# Perform backup
echo -e "${YELLOW}Starting backup...${NC}"
mysqldump -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" > "$BACKUP_FILE" 2>&1

# Check if backup was successful
if [ $? -eq 0 ]; then
    # Get file size
    FILE_SIZE=$(ls -lh "$BACKUP_FILE" | awk '{print $5}')
    
    echo -e "${GREEN}✅ Backup berhasil!${NC}"
    echo "File: $BACKUP_FILE"
    echo "Size: $FILE_SIZE"
    echo ""
    
    # Count total backups
    BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/backup_*.sql 2>/dev/null | wc -l)
    echo "Total backups: $BACKUP_COUNT"
    
    # Keep only last 10 backups (delete older ones)
    if [ $BACKUP_COUNT -gt 10 ]; then
        echo -e "${YELLOW}Cleaning old backups (keeping last 10)...${NC}"
        ls -t "$BACKUP_DIR"/backup_*.sql | tail -n +11 | xargs rm -f
        echo -e "${GREEN}✅ Old backups cleaned${NC}"
    fi
    
    # Verify data integrity
    echo ""
    echo -e "${YELLOW}Verifying data integrity...${NC}"
    mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "
        SELECT COUNT(*) as total_users FROM users;
        SELECT COUNT(*) as total_summarydaily FROM summarydaily;
        SELECT COUNT(*) as total_cabang FROM md_cabang;
        SELECT COUNT(*) as total_unit FROM md_unit;
    " 2>&1 | grep -v "mysql: \[Warning\]"
    
    echo ""
    echo -e "${GREEN}✅ Backup completed successfully!${NC}"
    echo "========================================"
    
else
    echo -e "${RED}❌ Backup failed!${NC}"
    echo "Please check your database connection and credentials."
    exit 1
fi
