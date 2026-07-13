import winpty
import time

cmd = "powershell.exe -NoProfile"
print(f"Executing: {cmd}")
try:
    pty = winpty.PtyProcess.spawn(cmd, cwd='.')
    print("Spawned successfully")
    time.sleep(1)
    
    pty.write("function prompt { 'PS my_project> ' }\r\n")
    time.sleep(0.5)
    pty.write("clear\r\n")
    time.sleep(0.5)
    
    output = pty.read(4096)
    print("Output:\n", output)
except Exception as e:
    print("Error:", e)
