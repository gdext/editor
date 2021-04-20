#include <string>
#include <Windows.h>

typedef bool (*ISGDOPEN_PROC)();

#define INIT_SUCCESS 0
#define INIT_DLLNOTLOADED -1
#define INIT_DLLINCOMPLETE -2

namespace gdext {
    ISGDOPEN_PROC isGDOpen;

    struct InitReturn {
        int   type;
        DWORD err_code;
    };

    InitReturn init() {
        HINSTANCE gdext_dll = LoadLibraryA("gdext.dll");
        if (!gdext_dll) return { INIT_DLLNOTLOADED, GetLastError() };

        isGDOpen = (ISGDOPEN_PROC)GetProcAddress(gdext_dll, "isGDOpen");
        if (!isGDOpen) return { INIT_DLLINCOMPLETE, GetLastError() };

        return { INIT_SUCCESS, 0 };
    };
}