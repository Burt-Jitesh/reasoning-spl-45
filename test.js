var fso = new ActiveXObject('Scripting.FileSystemObject');
var f = fso.OpenTextFile('data.js', 1);
var code = f.ReadAll();
code = code.replace('const globalPlatformData =', 'var globalPlatformData =');
try {
    eval(code);
    WScript.Echo('Success');
} catch (e) {
    WScript.Echo('Error: ' + e.message);
}
