package coop.tilleuls.resilience;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.widget.RemoteViews;

// Widget lanceur : un tap ouvre l'app sur le bon ecran et lance le timer (deep-link resilience://).
abstract class ModeWidget extends AppWidgetProvider {
    protected abstract String screen();
    protected abstract int labelRes();
    protected abstract int bgRes();

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] ids) {
        for (int id : ids) {
            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_mode);
            views.setTextViewText(R.id.widget_label, context.getString(labelRes()));
            views.setInt(R.id.widget_root, "setBackgroundResource", bgRes());

            Intent intent = new Intent(Intent.ACTION_VIEW,
                    Uri.parse("resilience://open?screen=" + screen() + "&auto=1"));
            intent.setPackage(context.getPackageName());
            PendingIntent pi = PendingIntent.getActivity(context, screen().hashCode(), intent,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
            views.setOnClickPendingIntent(R.id.widget_root, pi);

            manager.updateAppWidget(id, views);
        }
    }
}
