package com.strukovnasamobor.ssviewer_ucenici.twa;

import android.content.res.Configuration;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.drawable.ColorDrawable;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.TypedValue;
import android.view.View;
import android.webkit.WebSettings;
import androidx.core.content.ContextCompat;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.webkit.WebSettingsCompat;
import androidx.webkit.WebViewFeature;
import com.getcapacitor.BridgeActivity;


public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);


        // Disable Android's auto-applied translucent scrim on the system bars,
        // otherwise the nav bar area looks grey even though windowBackground is
        // black. Requires API 29+ (Android 10+).
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            getWindow().setNavigationBarContrastEnforced(false);
            getWindow().setStatusBarContrastEnforced(false);
        }


        // Android 15+ (targetSdk >= 35) forces edge-to-edge. Pad the WebView so it
        // doesn't draw under system bars; the bar areas then show the activity
        // theme's window background instead of overlaying our content with a scrim.
        ViewCompat.setOnApplyWindowInsetsListener(
                findViewById(android.R.id.content),
                (v, insets) -> {
                    Insets bars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
                    v.setPadding(bars.left, bars.top, bars.right, bars.bottom);
                    return WindowInsetsCompat.CONSUMED;
                }
        );


        // Force-dark OFF so Samsung Internet / Android WebView cannot auto-invert.
        WebSettings s = this.bridge.getWebView().getSettings();
        if (WebViewFeature.isFeatureSupported(WebViewFeature.FORCE_DARK)) {
            WebSettingsCompat.setForceDark(s, WebSettingsCompat.FORCE_DARK_OFF);
        }
        if (WebViewFeature.isFeatureSupported(WebViewFeature.FORCE_DARK_STRATEGY)) {
            WebSettingsCompat.setForceDarkStrategy(
                    s, WebSettingsCompat.DARK_STRATEGY_WEB_THEME_DARKENING_ONLY
            );
        }


        // Status bar in the app color (#004080). Capacitor's SystemBars pads the
        // decor view by the system bar insets, so the bar areas show the decor
        // background. Paint only the status bar strip; the navigation bar keeps
        // the theme's window background.
        int statusBarColor = ContextCompat.getColor(this, R.color.status_bar_color);
        View decor = getWindow().getDecorView();
        decor.setBackground(new StatusBarBackground(decor, getWindowBackgroundColor(), statusBarColor));
        decor.addOnLayoutChangeListener((v, l, t, r, b, oldL, oldT, oldR, oldB) -> v.invalidate());

        // Android 14 and older don't force edge-to-edge and color the bar themselves.
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.VANILLA_ICE_CREAM) {
            getWindow().setStatusBarColor(statusBarColor);
        }

        // SystemBars sets its own icon style in a task posted during plugin load,
        // so apply ours after it.
        new Handler(Looper.getMainLooper()).post(this::applyStatusBarIconStyle);
    }

    @Override
    public void onConfigurationChanged(Configuration newConfig) {
        // SystemBars re-applies its icon style here (e.g. on dark mode change).
        super.onConfigurationChanged(newConfig);
        applyStatusBarIconStyle();
    }

    // White status bar icons on the blue status bar.
    private void applyStatusBarIconStyle() {
        WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView())
                .setAppearanceLightStatusBars(false);
    }

    private int getWindowBackgroundColor() {
        TypedValue value = new TypedValue();
        getTheme().resolveAttribute(android.R.attr.windowBackground, value, true);
        return value.data;
    }

    // Decor background: window color, plus the status bar strip (the decor's top
    // padding) in the app color. Extends ColorDrawable so SystemBars'
    // setBackgroundColor() only updates the window color and keeps the strip.
    private static class StatusBarBackground extends ColorDrawable {
        private final View decor;
        private final Paint statusBarPaint = new Paint();

        StatusBarBackground(View decor, int windowColor, int statusBarColor) {
            super(windowColor);
            this.decor = decor;
            statusBarPaint.setColor(statusBarColor);
        }

        @Override
        public void draw(Canvas canvas) {
            super.draw(canvas);
            canvas.drawRect(0, 0, getBounds().width(), decor.getPaddingTop(), statusBarPaint);
        }
    }
}
