package com.classoflearners.app;

import android.content.ContentProvider;
import android.net.Uri;

public class GenericFileProvider extends android.content.ContentProvider {
    @Override
    public boolean onCreate() { return true; }

    @Override
    public android.database.Cursor query(Uri uri, String[] projection, String selection, String[] selectionArgs, String sortOrder) { return null; }

    @Override
    public String getType(Uri uri) { return "application/vnd.android.package-archive"; }

    @Override
    public Uri insert(Uri uri, android.content.ContentValues values) { return null; }

    @Override
    public int delete(Uri uri, String selection, String[] selectionArgs) { return 0; }

    @Override
    public int update(Uri uri, android.content.ContentValues values, String selection, String[] selectionArgs) { return 0; }
}
