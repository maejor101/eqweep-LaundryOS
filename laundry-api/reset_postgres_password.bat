@echo off
echo ==============================================
echo PostgreSQL Password Reset for LaundryOS
echo ==============================================
echo.

echo Adding PostgreSQL to PATH...
set PATH=%PATH%;C:\Program Files\PostgreSQL\18\bin

echo.
echo Current PostgreSQL Service Status:
sc query postgresql-x64-18

echo.
echo ===== OPTION 1: Reset Password (Requires Admin) =====
echo If you have administrator privileges, we can reset the password.
echo.

echo ===== OPTION 2: Manual Setup =====
echo 1. Open Command Prompt as Administrator
echo 2. Run: net stop postgresql-x64-18
echo 3. Navigate to: C:\Program Files\PostgreSQL\18\data
echo 4. Backup pg_hba.conf: copy pg_hba.conf pg_hba.conf.backup
echo 5. Edit pg_hba.conf and change the line:
echo    host    all             all             127.0.0.1/32            md5
echo    to:
echo    host    all             all             127.0.0.1/32            trust
echo 6. Run: net start postgresql-x64-18
echo 7. Run: psql -U postgres -h localhost
echo 8. In psql, run: ALTER USER postgres PASSWORD 'newpassword123';
echo 9. Exit psql and restore original pg_hba.conf
echo 10. Restart service: net stop postgresql-x64-18 && net start postgresql-x64-18
echo.

echo ===== OPTION 3: Use pgAdmin =====
echo 1. Install pgAdmin if not installed
echo 2. Connect to PostgreSQL server
echo 3. Right-click on postgres user and change password
echo.

pause