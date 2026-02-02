#include <jni.h>
#include <string>
#include <vector>
#include <iostream>
#include <fstream>
#include <sstream>
#include <android/log.h>
#include <unistd.h>
#include <sys/mman.h>
#include <dirent.h>
#include <setjmp.h>
#include <signal.h>

#define LOG_TAG "ModMenuNative"
#define LOGI(...) __android_log_print(ANDROID_LOG_INFO, LOG_TAG, __VA_ARGS__)
#define LOGE(...) __android_log_print(ANDROID_LOG_ERROR, LOG_TAG, __VA_ARGS__)

struct MemoryRegion {
    uintptr_t start;
    uintptr_t end;
    char perms[5];
    char name[256];
};

std::vector<MemoryRegion> get_java_heap_regions() {
    std::vector<MemoryRegion> regions;
    FILE* fp = fopen("/proc/self/maps", "r");
    if (fp) {
        char line[512];
        while (fgets(line, sizeof(line), fp)) {
            MemoryRegion region;
            char name[256] = {0};
            int n = sscanf(line, "%lx-%lx %4s %*s %*s %*s %s", &region.start, &region.end, region.perms, name);
            if (n >= 3) {
                strcpy(region.name, name);
                // Filter for java heap regions
                // Typical names: [anon:dalvik-main space], [anon:dalvik-alloc space], etc.
                if (strstr(name, "dalvik") != nullptr && strstr(name, "space") != nullptr) {
                    if (region.perms[0] == 'r' && region.perms[1] == 'w') {
                        regions.push_back(region);
                    }
                }
            }
        }
        fclose(fp);
    }
    return regions;
}

std::vector<uintptr_t> search_results;
sigjmp_buf jump_env;

void segfault_handler(int sig) {
    siglongjmp(jump_env, 1);
}

template<typename T>
bool safe_read(uintptr_t addr, T* out) {
    if (sigsetjmp(jump_env, 1) == 0) {
        // Use memcpy to avoid alignment issues
        memcpy(out, (void*)addr, sizeof(T));
        return true;
    }
    return false;
}

template<typename T>
void search_in_regions(const std::vector<MemoryRegion>& regions, T value) {
    search_results.clear();
    struct sigaction sa, old_sa;
    sa.sa_handler = segfault_handler;
    sigemptyset(&sa.sa_mask);
    sa.sa_flags = 0;
    sigaction(SIGSEGV, &sa, &old_sa);

    for (const auto& region : regions) {
        for (uintptr_t addr = region.start; addr < region.end - sizeof(T); addr += 1) {
            T val;
            if (safe_read(addr, &val)) {
                if (val == value) {
                    search_results.push_back(addr);
                }
            }
        }
    }
    sigaction(SIGSEGV, &old_sa, NULL);
}

template<typename T>
void refine_search(T value) {
    std::vector<uintptr_t> new_results;
    struct sigaction sa, old_sa;
    sa.sa_handler = segfault_handler;
    sigemptyset(&sa.sa_mask);
    sa.sa_flags = 0;
    sigaction(SIGSEGV, &sa, &old_sa);

    for (uintptr_t addr : search_results) {
        T val;
        if (safe_read(addr, &val)) {
            if (val == value) {
                new_results.push_back(addr);
            }
        }
    }
    search_results = new_results;
    sigaction(SIGSEGV, &old_sa, NULL);
}

// XOR search: search for (data ^ key) == value
void search_xor_in_regions(const std::vector<MemoryRegion>& regions, uint32_t value, uint32_t key) {
    search_results.clear();
    struct sigaction sa, old_sa;
    sa.sa_handler = segfault_handler;
    sigemptyset(&sa.sa_mask);
    sa.sa_flags = 0;
    sigaction(SIGSEGV, &sa, &old_sa);

    for (const auto& region : regions) {
        for (uintptr_t addr = region.start; addr < region.end - 4; addr += 1) {
            uint32_t val;
            if (safe_read(addr, &val)) {
                if ((val ^ key) == value) {
                    search_results.push_back(addr);
                }
            }
        }
    }
    sigaction(SIGSEGV, &old_sa, NULL);
}

extern "C" {

JNIEXPORT void JNICALL
Java_com_mod_menu_MemoryScanner_searchInt(JNIEnv* env, jobject /* this */, jint value, jint type) {
    auto regions = get_java_heap_regions();
    if (type == 1) { // BYTE
        search_in_regions<int8_t>(regions, (int8_t)value);
    } else if (type == 2) { // WORD
        search_in_regions<int16_t>(regions, (int16_t)value);
    } else if (type == 4) { // DWORD
        search_in_regions<int32_t>(regions, (int32_t)value);
    }
}

JNIEXPORT void JNICALL
Java_com_mod_menu_MemoryScanner_searchFloat(JNIEnv* env, jobject /* this */, jfloat value) {
    auto regions = get_java_heap_regions();
    search_in_regions<float>(regions, value);
}

JNIEXPORT void JNICALL
Java_com_mod_menu_MemoryScanner_searchDouble(JNIEnv* env, jobject /* this */, jdouble value) {
    auto regions = get_java_heap_regions();
    search_in_regions<double>(regions, value);
}

JNIEXPORT void JNICALL
Java_com_mod_menu_MemoryScanner_searchLong(JNIEnv* env, jobject /* this */, jlong value) {
    auto regions = get_java_heap_regions();
    search_in_regions<int64_t>(regions, (int64_t)value);
}

JNIEXPORT void JNICALL
Java_com_mod_menu_MemoryScanner_searchXor(JNIEnv* env, jobject /* this */, jint value, jint key) {
    auto regions = get_java_heap_regions();
    search_xor_in_regions(regions, (uint32_t)value, (uint32_t)key);
}

JNIEXPORT void JNICALL
Java_com_mod_menu_MemoryScanner_refineInt(JNIEnv* env, jobject /* this */, jint value, jint type) {
    if (type == 1) refine_search<int8_t>((int8_t)value);
    else if (type == 2) refine_search<int16_t>((int16_t)value);
    else if (type == 4) refine_search<int32_t>((int32_t)value);
}

JNIEXPORT void JNICALL
Java_com_mod_menu_MemoryScanner_refineFloat(JNIEnv* env, jobject /* this */, jfloat value) {
    refine_search<float>(value);
}

JNIEXPORT void JNICALL
Java_com_mod_menu_MemoryScanner_refineDouble(JNIEnv* env, jobject /* this */, jdouble value) {
    refine_search<double>(value);
}

JNIEXPORT void JNICALL
Java_com_mod_menu_MemoryScanner_refineLong(JNIEnv* env, jobject /* this */, jlong value) {
    refine_search<int64_t>((int64_t)value);
}

JNIEXPORT jint JNICALL
Java_com_mod_menu_MemoryScanner_getResultCount(JNIEnv* env, jobject /* this */) {
    return (jint)search_results.size();
}

JNIEXPORT void JNICALL
Java_com_mod_menu_MemoryScanner_writeInt(JNIEnv* env, jobject /* this */, jlong addr, jint value, jint type) {
    if (type == 1) *(int8_t*)addr = (int8_t)value;
    else if (type == 2) *(int16_t*)addr = (int16_t)value;
    else if (type == 4) *(int32_t*)addr = (int32_t)value;
}

JNIEXPORT void JNICALL
Java_com_mod_menu_MemoryScanner_writeFloat(JNIEnv* env, jobject /* this */, jlong addr, jfloat value) {
    *(float*)addr = value;
}

JNIEXPORT void JNICALL
Java_com_mod_menu_MemoryScanner_writeDouble(JNIEnv* env, jobject /* this */, jlong addr, jdouble value) {
    *(double*)addr = value;
}

JNIEXPORT void JNICALL
Java_com_mod_menu_MemoryScanner_writeLong(JNIEnv* env, jobject /* this */, jlong addr, jlong value) {
    *(int64_t*)addr = (int64_t)value;
}

JNIEXPORT void JNICALL
Java_com_mod_menu_MemoryScanner_editAllInt(JNIEnv* env, jobject /* this */, jint value, jint type) {
    for (uintptr_t addr : search_results) {
        if (type == 1) *(int8_t*)addr = (int8_t)value;
        else if (type == 2) *(int16_t*)addr = (int16_t)value;
        else if (type == 4) *(int32_t*)addr = (int32_t)value;
    }
}

JNIEXPORT void JNICALL
Java_com_mod_menu_MemoryScanner_editAllFloat(JNIEnv* env, jobject /* this */, jfloat value) {
    for (uintptr_t addr : search_results) {
        *(float*)addr = value;
    }
}

JNIEXPORT void JNICALL
Java_com_mod_menu_MemoryScanner_editAllDouble(JNIEnv* env, jobject /* this */, jdouble value) {
    for (uintptr_t addr : search_results) {
        *(double*)addr = value;
    }
}

JNIEXPORT void JNICALL
Java_com_mod_menu_MemoryScanner_editAllLong(JNIEnv* env, jobject /* this */, jlong value) {
    for (uintptr_t addr : search_results) {
        *(int64_t*)addr = (int64_t)value;
    }
}

JNIEXPORT jlongArray JNICALL
Java_com_mod_menu_MemoryScanner_getResults(JNIEnv* env, jobject /* this */) {
    jlongArray result = env->NewLongArray(search_results.size());
    if (search_results.size() > 0) {
        jlong* fill = new jlong[search_results.size()];
        for (size_t i = 0; i < search_results.size(); ++i) {
            fill[i] = (jlong)search_results[i];
        }
        env->SetLongArrayRegion(result, 0, search_results.size(), fill);
        delete[] fill;
    }
    return result;
}

JNIEXPORT jstring JNICALL
Java_com_mod_menu_MemoryScanner_stringFromJNI(JNIEnv* env, jobject /* this */) {
    std::string hello = "Hello from Native Memory Scanner";
    return env->NewStringUTF(hello.c_str());
}

JNIEXPORT jobjectArray JNICALL
Java_com_mod_menu_MemoryScanner_getRegions(JNIEnv* env, jobject /* this */) {
    std::vector<MemoryRegion> regions = get_java_heap_regions();
    jclass stringClass = env->FindClass("java/lang/String");
    jobjectArray result = env->NewObjectArray(regions.size(), stringClass, nullptr);
    for (size_t i = 0; i < regions.size(); ++i) {
        char buf[512];
        snprintf(buf, sizeof(buf), "%lx-%lx %s %s", regions[i].start, regions[i].end, regions[i].perms, regions[i].name);
        env->SetObjectArrayElement(result, i, env->NewStringUTF(buf));
    }
    return result;
}

}
