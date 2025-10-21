-- Add role column to auth.users table for admin access control
ALTER TABLE "auth"."users" ADD COLUMN "role" text DEFAULT 'customer' NOT NULL;
