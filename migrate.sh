#!/bin/sh
cd "$(dirname "$0")"

echo ""
echo "========================================"
echo " Employee Management - Database Setup"
echo "========================================"
echo ""

php spark migrate
if [ $? -ne 0 ]; then
    echo ""
    echo "Migration failed. Check app/Config/Database.php and PHP."
    exit 1
fi

echo ""
echo "Seeding admin user..."
php spark db:seed AdminUserSeeder
if [ $? -eq 0 ]; then
    echo "Admin user: username=admin, password=admin"
fi

echo ""
echo "========================================"
echo " Done."
echo "========================================"
echo ""
