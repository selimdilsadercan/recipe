package com.recipe.app;

import android.content.Intent;
import android.content.ClipData;
import android.net.Uri;
import android.os.Bundle;
import android.view.Window;
import android.graphics.Color;
import android.util.Log;
import android.webkit.WebView;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

import org.json.JSONObject;
import org.json.JSONArray;

public class MainActivity extends BridgeActivity {
    private static final String TAG = "RecipeShare";
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        Window window = getWindow();
        window.setStatusBarColor(Color.parseColor("#FAF9F7"));
        window.setNavigationBarColor(Color.WHITE);
        
        WindowInsetsControllerCompat windowInsetsController = 
            WindowCompat.getInsetsController(window, window.getDecorView());
        windowInsetsController.setAppearanceLightStatusBars(true);
        windowInsetsController.setAppearanceLightNavigationBars(true);
        
        // Check for share intent on startup
        handleIntent(getIntent());
    }
    
    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleIntent(intent);
    }
    
    private void handleIntent(Intent intent) {
        if (intent == null) {
            Log.d(TAG, "handleIntent: intent is null");
            return;
        }
        
        String action = intent.getAction();
        String type = intent.getType();
        
        Log.d(TAG, "handleIntent - action: " + action + ", type: " + type);
        
        if (Intent.ACTION_SEND.equals(action) && type != null) {
            try {
                JSONObject shareData = new JSONObject();
                shareData.put("action", action);
                shareData.put("type", type);
                
                // Handle text/plain
                if ("text/plain".equals(type)) {
                    String sharedText = intent.getStringExtra(Intent.EXTRA_TEXT);
                    String subject = intent.getStringExtra(Intent.EXTRA_SUBJECT);
                    
                    Log.d(TAG, "Text share - text: " + (sharedText != null ? sharedText.substring(0, Math.min(100, sharedText.length())) : "null"));
                    Log.d(TAG, "Text share - subject: " + subject);
                    
                    shareData.put("text", sharedText);
                    shareData.put("subject", subject);
                }
                
                // Handle video/*
                else if (type.startsWith("video/")) {
                    Uri videoUri = intent.getParcelableExtra(Intent.EXTRA_STREAM);
                    String sharedText = intent.getStringExtra(Intent.EXTRA_TEXT);
                    
                    Log.d(TAG, "Video share - uri: " + videoUri);
                    Log.d(TAG, "Video share - text: " + sharedText);
                    
                    shareData.put("mediaType", "video");
                    shareData.put("mediaUri", videoUri != null ? videoUri.toString() : null);
                    shareData.put("text", sharedText);
                    
                    // Check for clipData (sometimes media comes here)
                    ClipData clipData = intent.getClipData();
                    if (clipData != null && clipData.getItemCount() > 0) {
                        JSONArray clipItems = new JSONArray();
                        for (int i = 0; i < clipData.getItemCount(); i++) {
                            ClipData.Item item = clipData.getItemAt(i);
                            JSONObject clipItem = new JSONObject();
                            clipItem.put("text", item.getText());
                            clipItem.put("uri", item.getUri() != null ? item.getUri().toString() : null);
                            clipItems.put(clipItem);
                        }
                        shareData.put("clipData", clipItems);
                        Log.d(TAG, "ClipData items: " + clipItems.length());
                    }
                }
                
                // Handle image/*
                else if (type.startsWith("image/")) {
                    Uri imageUri = intent.getParcelableExtra(Intent.EXTRA_STREAM);
                    String sharedText = intent.getStringExtra(Intent.EXTRA_TEXT);
                    
                    Log.d(TAG, "Image share - uri: " + imageUri);
                    Log.d(TAG, "Image share - text: " + sharedText);
                    
                    shareData.put("mediaType", "image");
                    shareData.put("mediaUri", imageUri != null ? imageUri.toString() : null);
                    shareData.put("text", sharedText);
                }
                
                // Get all extras for debugging
                Bundle extras = intent.getExtras();
                if (extras != null) {
                    JSONObject extrasJson = new JSONObject();
                    for (String key : extras.keySet()) {
                        Object value = extras.get(key);
                        if (value != null) {
                            extrasJson.put(key, value.toString());
                        }
                    }
                    shareData.put("allExtras", extrasJson);
                    Log.d(TAG, "All extras: " + extrasJson.toString());
                }
                
                // Inject to WebView
                injectShareDataToWebView(shareData.toString());
                
            } catch (Exception e) {
                Log.e(TAG, "Error processing share intent", e);
            }
        }
        
        // Handle SEND_MULTIPLE
        else if (Intent.ACTION_SEND_MULTIPLE.equals(action) && type != null) {
            try {
                JSONObject shareData = new JSONObject();
                shareData.put("action", action);
                shareData.put("type", type);
                shareData.put("isMultiple", true);
                
                // Get multiple URIs
                java.util.ArrayList<Uri> uris = intent.getParcelableArrayListExtra(Intent.EXTRA_STREAM);
                if (uris != null) {
                    JSONArray uriArray = new JSONArray();
                    for (Uri uri : uris) {
                        uriArray.put(uri.toString());
                    }
                    shareData.put("mediaUris", uriArray);
                    Log.d(TAG, "Multiple share - uris count: " + uris.size());
                }
                
                injectShareDataToWebView(shareData.toString());
                
            } catch (Exception e) {
                Log.e(TAG, "Error processing multiple share intent", e);
            }
        }
    }
    
    private void injectShareDataToWebView(final String jsonData) {
        runOnUiThread(() -> {
            try {
                WebView webView = getBridge().getWebView();
                if (webView != null) {
                    // Escape for JavaScript
                    String escapedJson = jsonData
                        .replace("\\", "\\\\")
                        .replace("'", "\\'")
                        .replace("\n", "\\n")
                        .replace("\r", "\\r");
                    
                    String jsCode = 
                        "try {" +
                        "  var shareData = JSON.parse('" + escapedJson + "');" +
                        "  localStorage.setItem('pendingShareData', JSON.stringify(shareData));" +
                        "  localStorage.setItem('pendingShareDataTimestamp', '" + System.currentTimeMillis() + "');" +
                        "  window.dispatchEvent(new CustomEvent('shareIntent', { detail: shareData }));" +
                        "  console.log('[ShareIntent] Data injected:', shareData);" +
                        "} catch(e) { console.error('[ShareIntent] Injection error:', e); }";
                    
                    webView.evaluateJavascript(jsCode, result -> {
                        Log.d(TAG, "JavaScript injection result: " + result);
                    });
                } else {
                    Log.e(TAG, "WebView is null");
                }
            } catch (Exception e) {
                Log.e(TAG, "Error injecting share data", e);
            }
        });
    }
}
