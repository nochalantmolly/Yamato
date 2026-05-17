# L17 Deployment Verification — OCCABC/Yamato

**Date:** 2026-05-17
**Server:** occachildcare
**Backend path on server:** /home/molly/project/backend

## Check 1 — Django config + DB connection
**Status:** PASS
```
System check identified no issues (0 silenced).
```

## Check 2 — Migrations
**Status:** ALL APPLIED
```
admin
 [X] 0001_initial
 [X] 0002_logentry_remove_auto_add
 [X] 0003_logentry_add_action_flag_choices
auth
 [X] 0001_initial
 [X] 0002_alter_permission_name_max_length
 [X] 0003_alter_user_email_max_length
 [X] 0004_alter_user_username_opts
 [X] 0005_alter_user_last_login_null
 [X] 0006_require_contenttypes_0002
 [X] 0007_alter_validators_add_error_messages
 [X] 0008_alter_user_username_max_length
 [X] 0009_alter_user_last_name_max_length
 [X] 0010_alter_group_name_max_length
 [X] 0011_update_proxy_permissions
 [X] 0012_alter_user_first_name_max_length
cart
 [X] 0001_initial
contenttypes
 [X] 0001_initial
 [X] 0002_remove_content_type_name
menu
 [X] 0001_initial
orders
 [X] 0001_initial
sessions
 [X] 0001_initial
tables
 [X] 0001_initial
users
 [X] 0001_initial
```

## Check 3 — Tables in database
**Total:** 17 tables
```
auth_group
auth_group_permissions
auth_permission
cart_cartitem
django_admin_log
django_content_type
django_migrations
django_session
menu_category
menu_menuitem
orders_order
orders_orderitem
tables_table
tables_tablesession
users_user
users_user_groups
users_user_user_permissions
```

## Verdict
**READY** — All system checks pass, all 22 migrations applied, all 17 tables created in Azure PostgreSQL.
