#include <windows.h>
#include <process.h>
#include <tlhelp32.h>
#include <winbase.h>

#define GDEXT_DLL __declspec(dllexport)

#ifdef __cplusplus
extern "C" {
#endif

bool GDEXT_DLL isGDOpen() {
    PROCESSENTRY32 entry;
    entry.dwSize = sizeof(PROCESSENTRY32);

    HANDLE snapshot = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, NULL);
    bool exists = false;

    if (Process32First(snapshot, &entry) == TRUE) {
        while (Process32Next(snapshot, &entry) == TRUE) {
            if (stricmp(entry.szExeFile, "GeometryDash.exe") == 0) {
                exists = true;
                break;
            }
        }
    }

    CloseHandle(snapshot);
    return exists;
}

#ifdef __cplusplus
}
#endif