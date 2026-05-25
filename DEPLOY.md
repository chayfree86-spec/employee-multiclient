# Live deployment checklist

## Fix 500 Internal Server Error

### 1. Set database credentials in `.env` (most common cause of 500)

On the **live server**, edit `.env` and **uncomment and set** your real MySQL details:

```env
CI_ENVIRONMENT = production

# REQUIRED – use values from your hosting (cPanel / MySQL / phpMyAdmin)
database.default.hostname = localhost
database.default.database = u748421121_employee
database.default.username = u748421121_emproot
database.default.password = Employee@2026
database.default.DBDriver = MySQLi
database.default.port = 3306
```

- **hostname**: often `localhost` on shared hosting, or the host your panel shows for MySQL.
- **database**: the database you created for this app.
- **username** / **password**: the MySQL user that can access that database.

If these are wrong or commented out, the app cannot connect and returns 500.

### 2. Writable directories

Ensure the web server can write to:

- `writable/session`
- `writable/cache`
- `writable/logs`

Example (Linux):

```bash
chmod -R 775 writable
# If needed, set owner to web server user, e.g.:
# chown -R www-data:www-data writable
```

### 3. See the real error (when 500 persists)

Temporarily in `.env` set:

```env
CI_ENVIRONMENT = development
```

Reload the site once. The framework will show the exact error (e.g. database connection failed). Then set back to `production` and fix the reported issue.

Or check the log file: `writable/logs/log-YYYY-MM-DD.log` (last lines when you open the page).

### 4. App URL

You do **not** need to set `app.baseURL` in `.env` for the site to work. It is set automatically from the request. You can set it only if you want to override (e.g. `app.baseURL = 'https://employee.chaychaupal.com/'`).
