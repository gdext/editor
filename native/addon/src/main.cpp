#include <node.h>
#include <v8.h>

#include <gdext.hpp>

#include <sstream>

static void InitMethod(const v8::FunctionCallbackInfo<v8::Value>& args) {
    v8::Isolate* isolate = args.GetIsolate();
    gdext::InitReturn err = gdext::init();

    if (err.type != INIT_SUCCESS) {
        std::stringstream err_msg;

        switch (err.type)
        {
        case INIT_DLLNOTLOADED:
            err_msg << "gdext.dll could not be loaded. Error Code: " << (int)err.err_code;
            break;
        case INIT_DLLINCOMPLETE:
            err_msg << "gdext.dll has a function missing. Error Code: " << (int)err.err_code;
            break;
        default:
            err_msg << "unknown error";
            break;
        }

        args.GetReturnValue().Set( v8::String::NewFromUtf8(isolate, err_msg.str().c_str()).ToLocalChecked() );
        return;
    }

    args.GetReturnValue().Set(v8::Null(isolate));
}

static void DLL_isGDOpen(const v8::FunctionCallbackInfo<v8::Value>& args) {
    v8::Isolate* isolate = args.GetIsolate();

    args.GetReturnValue().Set( v8::Boolean::New( isolate, gdext::isGDOpen() ) );
}

extern "C" NODE_MODULE_EXPORT void
NODE_MODULE_INITIALIZER(v8::Local<v8::Object> exports,
                        v8::Local<v8::Value> module,
                        v8::Local<v8::Context> context) {

    NODE_SET_METHOD(exports, "init", InitMethod);
    NODE_SET_METHOD(exports, "isGDOpen", DLL_isGDOpen);
}

static void FakeInit(v8::Local<v8::Object> exports,
                     v8::Local<v8::Value> module,
                     v8::Local<v8::Context> context) {}

#undef NODE_MODULE_VERSION
#define NODE_MODULE_VERSION 3
NODE_MODULE(NODE_GYP_MODULE_NAME, FakeInit)