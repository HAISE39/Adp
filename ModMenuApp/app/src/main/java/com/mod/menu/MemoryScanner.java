package com.mod.menu;

public class MemoryScanner {
    static {
        System.loadLibrary("modmenu");
    }

    public static final int TYPE_BYTE = 1;
    public static final int TYPE_WORD = 2;
    public static final int TYPE_DWORD = 4;

    public native String stringFromJNI();
    public native String[] getRegions();

    public native void searchInt(int value, int type);
    public native void searchFloat(float value);
    public native void searchDouble(double value);
    public native void searchLong(long value);
    public native void searchXor(int value, int key);

    public native void refineInt(int value, int type);
    public native void refineFloat(float value);
    public native void refineDouble(double value);
    public native void refineLong(long value);

    public native int getResultCount();
    public native long[] getResults();

    public native void writeInt(long addr, int value, int type);
    public native void writeFloat(long addr, float value);
    public native void writeDouble(long addr, double value);
    public native void writeLong(long addr, long value);

    public native void editAllInt(int value, int type);
    public native void editAllFloat(float value);
    public native void editAllDouble(double value);
    public native void editAllLong(long value);
}
