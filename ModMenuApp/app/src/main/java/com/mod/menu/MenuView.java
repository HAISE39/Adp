package com.mod.menu;

import android.content.Context;
import android.graphics.Color;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.Spinner;
import android.widget.TextView;
import android.widget.ArrayAdapter;
import java.util.ArrayList;

public class MenuView extends LinearLayout {
    private MemoryScanner scanner;
    private LuaEngine luaEngine;
    private EditText inputSearch;
    private Spinner typeSpinner;
    private TextView resultText;
    private LinearLayout listLayout;
    private LinearLayout savedLayout;
    private Runnable onHideListener;
    private ArrayList<Long> savedList = new ArrayList<Long>();

    public MenuView(Context context) {
        super(context);
        scanner = new MemoryScanner();
        luaEngine = new LuaEngine(context, scanner);
        initUI();
    }

    public void setOnHideListener(Runnable listener) {
        this.onHideListener = listener;
    }

    private void initUI() {
        setOrientation(VERTICAL);
        setBackgroundColor(Color.argb(200, 50, 50, 50));
        setPadding(20, 20, 20, 20);

        TextView title = new TextView(getContext());
        title.setText("Mod Menu Memory Scanner");
        title.setTextColor(Color.WHITE);
        title.setTextSize(20);
        addView(title);

        inputSearch = new EditText(getContext());
        inputSearch.setHint("Value to search");
        inputSearch.setTextColor(Color.WHITE);
        inputSearch.setHintTextColor(Color.LTGRAY);
        addView(inputSearch);

        typeSpinner = new Spinner(getContext());
        String[] types = new String[]{"DWORD", "FLOAT", "BYTE", "WORD", "DOUBLE", "QWORD", "XOR"};
        ArrayAdapter<String> adapter = new ArrayAdapter<String>(getContext(), android.R.layout.simple_spinner_item, types);
        typeSpinner.setAdapter(adapter);
        addView(typeSpinner);

        LinearLayout buttonLayout = new LinearLayout(getContext());
        buttonLayout.setOrientation(HORIZONTAL);

        Button btnSearch = new Button(getContext());
        btnSearch.setText("New Search");
        btnSearch.setOnClickListener(new View.OnClickListener() {
            public void onClick(View v) {
                performSearch(false);
            }
        });
        buttonLayout.addView(btnSearch);

        Button btnRefine = new Button(getContext());
        btnRefine.setText("Refine");
        btnRefine.setOnClickListener(new View.OnClickListener() {
            public void onClick(View v) {
                performSearch(true);
            }
        });
        buttonLayout.addView(btnRefine);

        Button btnEditAll = new Button(getContext());
        btnEditAll.setText("Edit All");
        btnEditAll.setOnClickListener(new View.OnClickListener() {
            public void onClick(View v) {
                editAll();
            }
        });
        buttonLayout.addView(btnEditAll);

        addView(buttonLayout);

        resultText = new TextView(getContext());
        resultText.setTextColor(Color.YELLOW);
        resultText.setText("Results: 0");
        addView(resultText);

        Button btnHide = new Button(getContext());
        btnHide.setText("Minimize");
        btnHide.setOnClickListener(new View.OnClickListener() {
            public void onClick(View v) {
                setVisibility(View.GONE);
                if (onHideListener != null) onHideListener.run();
            }
        });
        addView(btnHide);

        TextView savedTitle = new TextView(getContext());
        savedTitle.setText("Saved List");
        savedTitle.setTextColor(Color.WHITE);
        addView(savedTitle);

        savedLayout = new LinearLayout(getContext());
        savedLayout.setOrientation(VERTICAL);
        addView(savedLayout);

        TextView resultsTitle = new TextView(getContext());
        resultsTitle.setText("Search Results");
        resultsTitle.setTextColor(Color.WHITE);
        addView(resultsTitle);

        EditText luaInput = new EditText(getContext());
        luaInput.setHint("Enter Lua Script");
        luaInput.setTextColor(Color.WHITE);
        addView(luaInput);

        Button btnRunLua = new Button(getContext());
        btnRunLua.setText("Run Lua");
        btnRunLua.setOnClickListener(new View.OnClickListener() {
            public void onClick(View v) {
                luaEngine.executeScript(luaInput.getText().toString());
            }
        });
        addView(btnRunLua);

        ScrollView scrollView = new ScrollView(getContext());
        listLayout = new LinearLayout(getContext());
        listLayout.setOrientation(VERTICAL);
        scrollView.addView(listLayout);
        addView(scrollView);
    }

    private void performSearch(final boolean refine) {
        final String valStr = inputSearch.getText().toString();
        if (valStr.isEmpty()) return;

        final String type = typeSpinner.getSelectedItem().toString();
        resultText.setText("Searching...");

        new Thread(new Runnable() {
            public void run() {
                try {
                    if (type.equals("DWORD")) {
                        int val = Integer.parseInt(valStr);
                        if (refine) scanner.refineInt(val, 4);
                        else scanner.searchInt(val, 4);
                    } else if (type.equals("FLOAT")) {
                        float val = Float.parseFloat(valStr);
                        if (refine) scanner.refineFloat(val);
                        else scanner.searchFloat(val);
                    } else if (type.equals("BYTE")) {
                        int val = Integer.parseInt(valStr);
                        if (refine) scanner.refineInt(val, 1);
                        else scanner.searchInt(val, 1);
                    } else if (type.equals("WORD")) {
                        int val = Integer.parseInt(valStr);
                        if (refine) scanner.refineInt(val, 2);
                        else scanner.searchInt(val, 2);
                    } else if (type.equals("DOUBLE")) {
                        double val = Double.parseDouble(valStr);
                        if (refine) scanner.refineDouble(val);
                        else scanner.searchDouble(val);
                    } else if (type.equals("QWORD")) {
                        long val = Long.parseLong(valStr);
                        if (refine) scanner.refineLong(val);
                        else scanner.searchLong(val);
                    } else if (type.equals("XOR")) {
                        int val = Integer.parseInt(valStr);
                        int key = 0;
                        if (valStr.contains(":")) {
                            String[] parts = valStr.split(":");
                            val = Integer.parseInt(parts[0]);
                            key = Integer.parseInt(parts[1]);
                        }
                        if (refine) scanner.refineXor(val, key);
                        else scanner.searchXor(val, key);
                    }

                    final int count = scanner.getResultCount();
                    post(new Runnable() {
                        public void run() {
                            resultText.setText("Results: " + count);
                            updateList();
                        }
                    });
                } catch (final Exception e) {
                    post(new Runnable() {
                        public void run() {
                            resultText.setText("Error: " + e.getMessage());
                        }
                    });
                }
            }
        }).start();
    }

    private void editAll() {
        final String valStr = inputSearch.getText().toString();
        if (valStr.isEmpty()) return;
        final String type = typeSpinner.getSelectedItem().toString();

        new Thread(new Runnable() {
            public void run() {
                try {
                    if (type.equals("DWORD")) scanner.editAllInt(Integer.parseInt(valStr), 4);
                    else if (type.equals("FLOAT")) scanner.editAllFloat(Float.parseFloat(valStr));
                    else if (type.equals("BYTE")) scanner.editAllInt(Integer.parseInt(valStr), 1);
                    else if (type.equals("WORD")) scanner.editAllInt(Integer.parseInt(valStr), 2);
                    else if (type.equals("DOUBLE")) scanner.editAllDouble(Double.parseDouble(valStr));
                    else if (type.equals("QWORD")) scanner.editAllLong(Long.parseLong(valStr));

                    post(new Runnable() {
                        public void run() {
                            updateList();
                        }
                    });
                } catch (Exception e) {}
            }
        }).start();
    }

    private void updateList() {
        listLayout.removeAllViews();
        savedLayout.removeAllViews();

        for (int j = 0; j < savedList.size(); j++) {
            final long addr = savedList.get(j);
            Button btnSaved = new Button(getContext());
            btnSaved.setText(String.format("Saved: 0x%X", addr));
            btnSaved.setOnClickListener(new View.OnClickListener() {
                public void onClick(View v) {
                    editValue(addr);
                }
            });
            savedLayout.addView(btnSaved);
        }

        long[] results = scanner.getResults();
        int displayCount = Math.min(results.length, 100);
        for (int i = 0; i < displayCount; i++) {
            final long addr = results[i];
            LinearLayout item = new LinearLayout(getContext());
            item.setOrientation(HORIZONTAL);

            Button btnResult = new Button(getContext());
            btnResult.setText(String.format("0x%X", addr));
            btnResult.setOnClickListener(new View.OnClickListener() {
                public void onClick(View v) {
                    editValue(addr);
                }
            });
            item.addView(btnResult);

            Button btnSave = new Button(getContext());
            btnSave.setText("S");
            btnSave.setOnClickListener(new View.OnClickListener() {
                public void onClick(View v) {
                    if (!savedList.contains(addr)) {
                        savedList.add(addr);
                        updateList();
                    }
                }
            });
            item.addView(btnSave);

            listLayout.addView(item);
        }
    }

    private void editValue(long addr) {
        String valStr = inputSearch.getText().toString();
        if (valStr.isEmpty()) return;
        String type = typeSpinner.getSelectedItem().toString();
        try {
            if (type.equals("DWORD")) scanner.writeInt(addr, Integer.parseInt(valStr), 4);
            else if (type.equals("FLOAT")) scanner.writeFloat(addr, Float.parseFloat(valStr));
            else if (type.equals("BYTE")) scanner.writeInt(addr, Integer.parseInt(valStr), 1);
            else if (type.equals("WORD")) scanner.writeInt(addr, Integer.parseInt(valStr), 2);
            else if (type.equals("DOUBLE")) scanner.writeDouble(addr, Double.parseDouble(valStr));
            else if (type.equals("QWORD")) scanner.writeLong(addr, Long.parseLong(valStr));
            updateList();
        } catch (Exception e) {}
    }
}
