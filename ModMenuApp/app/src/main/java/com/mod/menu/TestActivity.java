package com.mod.menu;

import android.app.Activity;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;

public class TestActivity extends Activity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        Button btn = new Button(this);
        btn.setText("Start Mod Menu");
        btn.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Main.start(TestActivity.this);
            }
        });

        setContentView(btn);
    }
}
