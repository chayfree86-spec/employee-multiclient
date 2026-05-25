# Deploy on Hostinger – fix 500 error

## 1. Upload and folder structure

- Upload the **entire project** (all files and folders) into **`public_html`** via File Manager or FTP.
- So you have: `public_html/index.php`, `public_html/app/`, `public_html/writable/`, `public_html/.env`, etc.

## 2. Document root

- In **hPanel → Domains → your domain → Advanced → Document root** it should be **`public_html`** (where `index.php` is).
- Do **not** set document root to `public_html/public` unless you move the app to run from `public` (see below).

## 3. Fix .htaccess (important)

- Open **`public_html/.htaccess`** on the server.
- If your site is at **domain root** (e.g. `https://employee.chaychaupal.com/`), set:
  ```apache
  RewriteBase /
  ```
- If your site is in a **subfolder** (e.g. `https://yourdomain.com/employee-management/`), set:
  ```apache
  RewriteBase /employee-management/
  ```
- Save the file. Wrong `RewriteBase` often causes 500 on Hostinger.

## 4. PHP version

- **hPanel → Advanced → PHP Configuration** (or **Select PHP version**).
- Choose **PHP 8.2** or **8.3** (CodeIgniter 4 needs 8.2+).
- Save.

## 5. Database and .env

- In **hPanel → Databases → MySQL Databases**:
  - Create a database (e.g. `u123456789_employee`).
  - Create a user and password, then add the user to that database (All privileges).
- Edit **`public_html/.env`** on the server (create from `env.production.example` if needed) and set:
  ```env
  CI_ENVIRONMENT = production

  database.default.hostname = localhost
  database.default.database = your_db_name_from_hostinger
  database.default.username = your_db_user_from_hostinger
  database.default.password = your_db_password
  database.default.DBDriver = MySQLi
  database.default.port = 3306
  ```
- Hostinger often uses **`localhost`** as hostname. If they give a host like `mysql123.hostinger.com`, use that instead of `localhost`.

## 6. Writable permissions

- In File Manager, right‑click **`writable`** → Permissions → set **755** or **775**, and enable “Recurse into subdirectories”.
- Ensure **`writable/session`** and **`writable/logs`** exist and are writable.

## 7. See the real error (if still 500)

- In **`public_html/.env`** set:
  ```env
  CI_ENVIRONMENT = development
  ```
- Reload the site once. The full error message will show (e.g. database connection failed).
- Check **`public_html/writable/logs/log-YYYY-MM-DD.log`** for the same error.
- When done, set back to `CI_ENVIRONMENT = production` and fix the reported issue.

## 8. Health check (optional)

- Upload **`public/health.php`** so it is at **`public_html/public/health.php`** (if you have a `public` folder inside `public_html`).
- Or put **`health.php`** in **`public_html/`** and open: `https://yourdomain.com/health.php`.
- It shows PHP version, paths, and whether `.env` and `writable` are OK. Delete `health.php` after debugging.

## 9. If you use “public” as document root (alternative)

- Some setups use **document root = public_html/public**.
- Then:
  - Move **contents** of `public/` (e.g. `index.php`, `.htaccess`) to `public_html/` and adjust paths in `index.php` to point to the parent (project root), **or**
  - Keep document root as **public_html** and use the steps above (recommended).

## Quick checklist

- [ ] All project files in `public_html`, `index.php` in `public_html`
- [ ] `.htaccess` has `RewriteBase /` (or `/subfolder/` if in subfolder)
- [ ] PHP 8.2+ in Hostinger
- [ ] `.env` has correct `database.default.*` from Hostinger MySQL
- [ ] `writable/` (and subdirs) exist and are writable (755/775)
- [ ] If 500 continues: set `CI_ENVIRONMENT = development` and check `writable/logs/`
